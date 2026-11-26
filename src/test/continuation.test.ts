import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';
import { z } from 'zod';
import { emptyData, makeDay, finishCardio, summaries, dayComplete } from '../domain/daily';
import { appDataSchema, hormonalImportSchema } from '../domain/model';
import { dayReport, metricPoints } from '../domain/analytics';
import { now, makeWorkout } from '../domain/training';
import { progressionFor } from '../domain/progression';
import { OaoDatabase, initialize, mutate, db, confirmDay } from '../storage/db';
import { encryptBackup, decryptBackup } from '../storage/backup';

describe('conclusão simples e relatórios reais',()=>{
 it('série feita sem detalhes é aceita, não gera progressão e não vira carga/repetição zero',()=>{
  const data=emptyData();data.cycles.push({id:'cycle',start:'2026-09-28',createdAt:now(),originalVersion:'original-1',overrides:{}});
  const session=makeWorkout(data,'2026-10-17')!;session.exercises[0].sets[0].done=true;session.exercises[0].sets[1].skipped=true;data.sessions.push(session);
  const parsed=appDataSchema.parse(data),report=dayReport(parsed,session.date);
  expect(report.setsDone).toBe(1);expect(report.setsSkipped).toBe(1);expect(report.incompleteSets).toBe(1);
  expect(progressionFor(parsed,session,session.exercises[0]).eligible).toBe(false);
  for(const metric of ['load','reps','rir'] as const)expect(metricPoints(data,session.date,session.date,metric,session.exercises[0].id,'Panturrilhas')[0].value).toBeNull();
 });
 it('confirma dia anterior sem ciclo e sem fabricar medidas; correção e repetição preservam registros',async()=>{
  await initialize(db);try {
   await mutate('registro existente','',d=>{const day=makeDay(d,'2026-10-16');day.water[0]=275;day.recorded.push('water');d.days.push(day);});
   await confirmDay('2026-10-16');const data=(await db.state.get('main'))!.data;
   expect(dayComplete(summaries(data,'2026-10-16'))).toBe(false);expect(data.days[0].declarations.cardio).toBeUndefined();expect(data.sessions).toHaveLength(0);expect(data.hormonalLogs).toEqual([]);expect(data.days[0].declarations.hormonal).toBeUndefined(); // sexta: registro hormonal fora do programa
   expect(dayReport(data,'2026-10-16')).toMatchObject({waterMl:275,cardioMinutes:null,cardioSpeed:null,caloriesConsumed:null,caloriesBurned:null});
   expect(data.days[0].meals.flat().every(v=>!v)).toBe(true);expect(data.days[0].cardio.elapsed).toBe(0);
   await confirmDay('2026-10-16');expect((await db.state.get('main'))!.data).toEqual(data);
   await mutate('Desfazer confirmação','',d=>{d.days[0].declarations={};});expect(dayComplete(summaries((await db.state.get('main'))!.data,'2026-10-16'))).toBe(false);
  }finally{await db.delete();}
 });
 it.each([[59,5,'Esteira','partial'],[60,null,'Esteira','partial'],[60,4.9,'Esteira','partial'],[60,null,'Bicicleta','complete'],[60,5,'Esteira','complete'],[61,5.5,'Esteira','complete']] as const)('cardio %s min a %s km/h em %s resulta %s',(minutes,speed,mode,status)=>{
  const cardio=makeDay(emptyData(),'2026-10-19').cardio;Object.assign(cardio,{elapsed:minutes*60,speed,mode});finishCardio(cardio);expect(cardio.status).toBe(status);
 });
});

describe('migração protege dados de abas antigas',()=>{
 it('migra v2, mantém histórico e bloqueia gravação pelo código v2 após gravar velocidade',async()=>{
  const name=`old-tab-${crypto.randomUUID()}`,old=new Dexie(name);old.version(2).stores({state:'id',audit:'id,at,revision,kind',outbox:'id,at,state,revision'});
  const original=JSON.parse(JSON.stringify(emptyData()));original.schemaVersion=2;delete original.hormonalProtocol;delete original.hormonalLogs;
  const day=JSON.parse(JSON.stringify(makeDay(emptyData(),'2026-10-16')));delete day.cardio.speed;delete day.cardio.minimumSpeed;delete day.declarations;day.cardio.planned=20;day.cardio.elapsed=1200;day.cardio.status='complete';day.water[0]=275;original.days.push(day);
  await old.table('state').add({id:'main',revision:8,data:original});old.close();
  const current=new OaoDatabase(name);try{
   await initialize(current);const migrated=(await current.state.get('main'))!;
   expect(migrated.revision).toBe(9);expect(migrated.data.schemaVersion).toBe(9);expect(migrated.data.days[0].cardio).toMatchObject({planned:20,elapsed:1200,status:'complete',speed:null,minimumSpeed:null});expect(migrated.data.days[0].water[0]).toBe(275);
   await mutate('Novo cardio','',d=>{const newDay=makeDay(d,'2026-10-19');newDay.cardio.speed=5;d.days.push(newDay);},current);
   await old.open();
   // The v2 app validates its full snapshot, including literal schemaVersion:2, before writing.
   await expect(old.transaction('rw',old.table('state'),async()=>{const snapshot=await old.table('state').get('main');snapshot.data.settings.theme='light';z.object({schemaVersion:z.literal(2)}).parse(snapshot.data);await old.table('state').put(snapshot);})).rejects.toThrow();
   expect((await current.state.get('main'))!.data.days[1].cardio.speed).toBe(5);
   const data=(await current.state.get('main'))!.data;
   const encrypted=await encryptBackup({format:'oaolife-backup-3',exportedAt:now(),data,audit:[],outbox:[]},'senha sintética longa');expect((await decryptBackup(encrypted,'senha sintética longa')).data).toEqual(data);
  }finally{old.close();await current.delete();}
 });
 it('importa protocolo informado sem criar administrações e mantém segundo dia desconhecido',()=>{
  const value=hormonalImportSchema.parse({format:'oaolife-hormonal-1',protocol:{name:'Registro sintético',weeks:12,entries:[{id:'a',substance:'Substância informada',doseMg:10,frequency:'weekly',weekday:null,fromWeek:1,toWeek:8}]}});
  const data=appDataSchema.parse({...emptyData(),hormonalProtocol:value.protocol});expect(data.hormonalLogs).toEqual([]);expect(data.hormonalProtocol!.entries[0].weekday).toBeNull();
 });
});

