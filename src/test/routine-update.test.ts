import type { AppData } from '../domain/model';
import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';
import { emptyData, makeDay, recordCardioMinutes, summaries } from '../domain/daily';
import { cardioTarget, weeklyCardio, applyCardioPlan } from '../domain/cardio';
import { activateMobility, currentMobilityProtocol, stopMobilityTimers, toggleMobilitySet } from '../domain/mobility';
import { addDays } from '../domain/training';
import { OaoDatabase, initialize, mutate, reconcileTimers } from '../storage/db';
import { appDataSchema } from '../domain/model';
import { encryptBackup, decryptBackup } from '../storage/backup';

describe('cardio semanal fixo',()=>{
 it('dias fixos: seg, ter, qui, sex e dom com 60 min (300/semana); quarta e sábado sem cardio',()=>{
  const data=emptyData(),days=Array.from({length:7},(_,i)=>makeDay(data,addDays('2026-10-19',i)));
  expect(days.map(d=>d.cardio.planned)).toEqual([60,60,null,60,60,null,60]);
  expect(days.reduce((n,d)=>n+(d.cardio.planned??0),0)).toBe(300);
  expect(summaries(data,'2026-10-25').workout.status).toBe('Não programado');
  expect(summaries(data,'2026-10-25').cardio.status).toBe('Não iniciado');
  expect(summaries(data,'2026-10-21').cardio.status).toBe('Não programado');
 });
 it('acumula sessões menores e só conclui a meta do próprio dia',()=>{
  const data=emptyData(),day=makeDay(data,'2026-10-22');data.days.push(day);day.cardio.speed=5;
  recordCardioMinutes(day.cardio,10);expect(day.cardio.status).toBe('partial');
  recordCardioMinutes(day.cardio,60);expect(day.cardio.elapsed).toBe(3600);expect(day.cardio.status).toBe('complete');
  // Prescrição rígida: 600 min num só dia contam 60 para a semana; os outros dias continuam devidos.
  day.cardio.elapsed=36000;const week=weeklyCardio(data,day.id);expect(week.actual).toBe(600);expect(week.credited).toBe(60);expect(week.remaining).toBe(240);expect(week.reached).toBe(false);expect(week.sessions).toEqual({done:1,total:5});expect(week.days.filter(d=>d.complete)).toHaveLength(1);
 });
 it('semana começa na segunda, inclusive atravessando ano; aplicar plano preserva medidas',()=>{
  const data=emptyData();expect(weeklyCardio(data,'2027-01-03').start).toBe('2026-12-28');
  const c=makeDay(data,'2026-10-23').cardio;Object.assign(c,{planned:null,planVersion:'legacy',elapsed:345,speed:4.5});applyCardioPlan(c,'2026-10-23');
  expect(c).toMatchObject({planned:60,elapsed:345,speed:4.5,status:'partial'});expect(cardioTarget('2026-10-25')).toBe(60);expect(cardioTarget('2026-10-24')).toBeNull();
 });
});

describe('postura: séries marcadas, sem cronômetro',()=>{
 const setup=()=>{const day=makeDay(emptyData(),'2026-10-19');return {session:day.mobility,ex:day.mobility.protocol!.exercises[0]};};
 it('sem cronômetro: cada série é marcada e desmarcada, e o bloco conclui com as quatro',()=>{
  const data=emptyData(),day=makeDay(data,'2026-10-19');data.days.push(day);const ex=day.mobility.protocol!.exercises[0];
  expect(ex).toMatchObject({sets:4,duration:60,rest:60});
  toggleMobilitySet(day.mobility,ex,0);toggleMobilitySet(day.mobility,ex,1);expect(summaries(data,day.id).mobility).toMatchObject({status:'Em andamento',done:2,total:4});
  toggleMobilitySet(day.mobility,ex,1);expect(summaries(data,day.id).mobility.done).toBe(1);
  day.mobility.sets[`${ex.id}:0`].pain=2;for(const i of [1,2,3])toggleMobilitySet(day.mobility,ex,i);
  expect(summaries(data,day.id).mobility.status).toBe('Concluído');expect(day.mobility.sets[`${ex.id}:0`]).toMatchObject({done:true,pain:2});
  expect(()=>toggleMobilitySet(day.mobility,ex,4)).toThrow('fora do protocolo');
 });
 it('cronômetro antigo em andamento é encerrado preservando o tempo registrado',()=>{
  const day=makeDay(emptyData(),'2026-10-19'),ex=day.mobility.protocol!.exercises[0];
  day.mobility.sequences[ex.id]={elapsed:0,runningSince:1000,completedAt:null};
  expect(stopMobilityTimers(day.mobility,181000)).toBe(true);expect(day.mobility.sequences[ex.id]).toMatchObject({elapsed:180,runningSince:null});
  expect(Object.values(day.mobility.sets).map(v=>v.done)).toEqual([true,true,false,false]);expect(stopMobilityTimers(day.mobility,999999)).toBe(false);
 });
 it('declaração genérica não conclui a sequência nem o cardio do novo plano',()=>{const data=emptyData(),day=makeDay(data,'2026-10-19');data.days.push(day);day.declarations.cardio={at:new Date().toISOString(),note:'Sem detalhes'};day.declarations.mobility={at:new Date().toISOString(),note:'Sem detalhes'};const blocks=summaries(data,day.id);expect(blocks.cardio.status).not.toBe('Concluído');expect(blocks.mobility.status).not.toBe('Concluído');});
 it('alongamento é diário (ignora dias antigos do protocolo) e não altera snapshots históricos',()=>{
  const saved=currentMobilityProtocol(null);saved.days=['C1'];saved.exercises[0].duration=20;
  const old=structuredClone(saved),updated=currentMobilityProtocol(saved);expect(saved).toEqual(old);expect(updated.days).toEqual(['C1']);expect(updated.exercises[0].duration).toBe(60);
  const data=emptyData();data.mobility=saved;for(const date of ['2026-10-19','2026-10-21','2026-10-24','2026-10-25'])expect(makeDay(data,date).mobility.protocol?.exercises[0].duration).toBe(60);
  expect(summaries(data,'2026-10-25').mobility.status).toBe('Não iniciado');
  const past=makeDay(data,'2026-10-20'),future=makeDay(data,'2026-10-26');past.mobility.protocol=null;future.mobility.protocol=null;data.days.push(past,future);
  expect(activateMobility(data,'2026-10-25')).toBe(true);expect(past.mobility.protocol).toBeNull();expect((future.mobility.protocol as AppData['days'][number]['mobility']['protocol'])?.exercises).toHaveLength(1);expect(activateMobility(data,'2026-10-25')).toBe(false);
 });
});

describe('persistência e migração compatível',()=>{
 it('reabre offline, reconcilia duas abas sem duplicação e mantém cardio independente',async()=>{
  const name='timers-'+crypto.randomUUID();let database=new OaoDatabase(name);await initialize(database);
  try{
   await mutate('Iniciar','',data=>{const day=makeDay(data,'2026-10-19'),ex=day.mobility.protocol!.exercises[0];day.mobility.sequences[ex.id]={elapsed:0,runningSince:1000,completedAt:null};day.cardio.runningSince=1000;day.cardio.status='running';day.cardio.speed=5;day.water[0]=275;data.days.push(day);},database);
   database.close();database=new OaoDatabase(name);await initialize(database);
   await Promise.all([reconcileTimers(421000,database),reconcileTimers(421000,database)]);
   let saved=(await database.state.get('main'))!;expect(saved.revision).toBe(2);expect(summaries(saved.data,'2026-10-19',421000).mobility.status).toBe('Concluído');expect(saved.data.days[0].cardio).toMatchObject({runningSince:null,elapsed:420,status:'partial'});expect(saved.data.days[0].water[0]).toBe(275);
   await reconcileTimers(3601000,database);saved=(await database.state.get('main'))!;expect(saved.revision).toBe(2);expect(saved.data.days[0].cardio).toMatchObject({status:'partial',elapsed:420,runningSince:null});
   const backup=await encryptBackup({format:'oaolife-backup-4',exportedAt:new Date().toISOString(),data:saved.data,audit:[],outbox:[]},'senha sintética de teste');expect((await decryptBackup(backup,'senha sintética de teste')).data).toEqual(saved.data);
  }finally{await database.delete();}
 });
 it('migra v3 preservando histórico, revisão, fila e protocolos anteriores',async()=>{
  const name='migration-'+crypto.randomUUID(),old=new Dexie(name);old.version(3).stores({state:'id',audit:'id,at,revision,kind',outbox:'id,at,state,revision'});
  const data=JSON.parse(JSON.stringify(emptyData()));data.schemaVersion=3;const day=JSON.parse(JSON.stringify(makeDay(emptyData(),'2026-10-17')));delete day.cardio.planVersion;delete day.mobility.sequences;day.cardio.planned=null;day.water[2]=600;day.mobility.protocol=null;data.days.push(day);
  await old.table('state').add({id:'main',revision:9,data});await old.table('outbox').add({id:'old',revision:9,state:'local-only',kind:'Água',at:new Date().toISOString()});old.close();
  const database=new OaoDatabase(name);try{await initialize(database);const saved=(await database.state.get('main'))!;expect(saved.revision).toBe(10);expect(saved.data.schemaVersion).toBe(9);expect(saved.data.days[0]).toMatchObject({water:[0,0,600,0,0,0],cardio:{planned:null,planVersion:'legacy'},mobility:{protocol:null,sequences:{}}});expect(await database.outbox.count()).toBe(2);expect(appDataSchema.parse(saved.data)).toEqual(saved.data);}finally{await database.delete();}
 });
});
