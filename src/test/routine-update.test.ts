import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';
import { emptyData, makeDay, startCardio, pauseCardio, finishCardio, summaries } from '../domain/daily';
import { cardioTarget, weeklyCardio, applyCardioPlan } from '../domain/cardio';
import { currentMobilityProtocol, sequenceProgress, sequenceTotal, startSequence, pauseSequence, syncSequence, resetSequence } from '../domain/mobility';
import { addDays } from '../domain/training';
import { OaoDatabase, initialize, mutate, reconcileTimers } from '../storage/db';
import { appDataSchema } from '../domain/model';
import { encryptBackup, decryptBackup } from '../storage/backup';

describe('cardio semanal fixo',()=>{
 it('distribui exatamente 360 minutos nos sete dias, sem treino no domingo',()=>{
  const data=emptyData(),days=Array.from({length:7},(_,i)=>makeDay(data,addDays('2026-10-19',i)));
  expect(days.map(d=>d.cardio.planned)).toEqual([60,60,30,60,60,30,60]);
  expect(days.reduce((n,d)=>n+d.cardio.planned!,0)).toBe(360);
  expect(summaries(data,'2026-10-25').workout.status).toBe('Não programado');
  expect(summaries(data,'2026-10-25').cardio.status).toBe('Não iniciado');
 });
 it('acumula sessões menores e só conclui a meta do próprio dia',()=>{
  const data=emptyData(),day=makeDay(data,'2026-10-21');data.days.push(day);day.cardio.speed=5;
  startCardio(day.cardio,1000);pauseCardio(day.cardio,601000);finishCardio(day.cardio,601000);expect(day.cardio.status).toBe('partial');
  startCardio(day.cardio,1000000);finishCardio(day.cardio,2200000);expect(day.cardio.elapsed).toBe(1800);expect(day.cardio.status).toBe('complete');
  day.cardio.elapsed=36000;const week=weeklyCardio(data,day.id);expect(week.actual).toBe(600);expect(week.credited).toBe(30);expect(week.days.filter(d=>d.complete)).toHaveLength(1);
 });
 it('semana começa na segunda, inclusive atravessando ano; aplicar plano preserva medidas',()=>{
  const data=emptyData();expect(weeklyCardio(data,'2027-01-03').start).toBe('2026-12-28');
  const c=makeDay(data,'2026-10-24').cardio;Object.assign(c,{planned:null,planVersion:'legacy',elapsed:345,speed:4.5});applyCardioPlan(c,'2026-10-24');
  expect(c).toMatchObject({planned:30,elapsed:345,speed:4.5,status:'partial'});expect(cardioTarget('2026-10-25')).toBe(60);
 });
});

describe('sequência automática de hipercifose',()=>{
 const setup=()=>{const day=makeDay(emptyData(),'2026-10-19');return {session:day.mobility,ex:day.mobility.protocol!.exercises[0]};};
 it('tem quatro séries, três descansos e termina em 420 s com 240 s ativos',()=>{
  const {session,ex}=setup();expect(ex).toMatchObject({sets:4,duration:60,rest:60});expect(sequenceTotal(ex)).toBe(420);startSequence(session,ex,1000);
  for(const [seconds,index,resting,done] of [[0,0,false,0],[60,0,true,1],[120,1,false,1],[180,1,true,2],[240,2,false,2],[300,2,true,3],[360,3,false,3],[420,3,false,4]] as const){
   expect(sequenceProgress(ex,session.sequences[ex.id],1000+seconds*1000)).toMatchObject({index,resting,done});
  }
  syncSequence(session,ex,421000);expect(sequenceProgress(ex,session.sequences[ex.id],999999)).toMatchObject({complete:true,active:240,elapsed:420,remaining:0});
  expect(Object.values(session.sets).map(s=>s.seconds)).toEqual([60,60,60,60]);expect(session.sequences[ex.id].completedAt).toBe(new Date(421000).toISOString());
 });
 it('pausa não avança; retomada e início repetido não duplicam tempo',()=>{
  const {session,ex}=setup();startSequence(session,ex,1000);startSequence(session,ex,20000);pauseSequence(session,ex,31000);
  expect(sequenceProgress(ex,session.sequences[ex.id],100000)).toMatchObject({elapsed:30,active:30,remaining:30});
  startSequence(session,ex,100000);syncSequence(session,ex,490000);expect(sequenceProgress(ex,session.sequences[ex.id])).toMatchObject({complete:true,active:240});
  resetSequence(session,ex);expect(sequenceProgress(ex,session.sequences[ex.id])).toMatchObject({elapsed:0,done:0,complete:false});expect(session.sets).toEqual({});
 });
 it('mantém dias explicitamente personalizados e não altera snapshots históricos',()=>{
  const saved=currentMobilityProtocol(null);saved.days=['C1'];saved.exercises[0].duration=20;
  const old=structuredClone(saved),updated=currentMobilityProtocol(saved);expect(saved).toEqual(old);expect(updated.days).toEqual(['C1']);expect(updated.exercises[0].duration).toBe(60);
  const data=emptyData();data.mobility=saved;expect(makeDay(data,'2026-10-19').mobility.protocol).toBeNull();expect(makeDay(data,'2026-10-21').mobility.protocol?.exercises[0].duration).toBe(60);
 });
});

describe('persistência e migração compatível',()=>{
 it('reabre offline, reconcilia duas abas sem duplicação e mantém cardio independente',async()=>{
  const name='timers-'+crypto.randomUUID();let database=new OaoDatabase(name);await initialize(database);
  try{
   await mutate('Iniciar','',data=>{const day=makeDay(data,'2026-10-19'),ex=day.mobility.protocol!.exercises[0];startSequence(day.mobility,ex,1000);startCardio(day.cardio,1000);day.cardio.speed=5;day.water[0]=275;data.days.push(day);},database);
   database.close();database=new OaoDatabase(name);await initialize(database);
   await Promise.all([reconcileTimers(421000,database),reconcileTimers(421000,database)]);
   let saved=(await database.state.get('main'))!;expect(saved.revision).toBe(2);expect(summaries(saved.data,'2026-10-19',421000).mobility.status).toBe('Concluído');expect(saved.data.days[0].cardio.runningSince).toBe(1000);expect(saved.data.days[0].water[0]).toBe(275);
   await reconcileTimers(3601000,database);saved=(await database.state.get('main'))!;expect(saved.data.days[0].cardio).toMatchObject({status:'complete',elapsed:3600,runningSince:null});
   const backup=await encryptBackup({format:'oaolife-backup-4',exportedAt:new Date().toISOString(),data:saved.data,audit:[],outbox:[]},'senha sintética de teste');expect((await decryptBackup(backup,'senha sintética de teste')).data).toEqual(saved.data);
  }finally{await database.delete();}
 });
 it('migra v3 preservando histórico, revisão, fila e protocolos anteriores',async()=>{
  const name='migration-'+crypto.randomUUID(),old=new Dexie(name);old.version(3).stores({state:'id',audit:'id,at,revision,kind',outbox:'id,at,state,revision'});
  const data=JSON.parse(JSON.stringify(emptyData()));data.schemaVersion=3;const day=JSON.parse(JSON.stringify(makeDay(emptyData(),'2026-10-17')));delete day.cardio.planVersion;delete day.mobility.sequences;day.cardio.planned=null;day.water[2]=600;day.mobility.protocol=null;data.days.push(day);
  await old.table('state').add({id:'main',revision:9,data});await old.table('outbox').add({id:'old',revision:9,state:'local-only',kind:'Água',at:new Date().toISOString()});old.close();
  const database=new OaoDatabase(name);try{await initialize(database);const saved=(await database.state.get('main'))!;expect(saved.revision).toBe(9);expect(saved.data.schemaVersion).toBe(4);expect(saved.data.days[0]).toMatchObject({water:[0,0,600,0,0,0],cardio:{planned:null,planVersion:'legacy'},mobility:{protocol:null,sequences:{}}});expect(await database.outbox.count()).toBe(1);expect(appDataSchema.parse(saved.data)).toEqual(saved.data);}finally{await database.delete();}
 });
});
