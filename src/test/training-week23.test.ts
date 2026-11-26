import { describe, expect, it, vi } from 'vitest';
import { emptyData, makeDay } from '../domain/daily';
import { anchorTrainingCycle, cycleForDate, makeWorkout, now, schedule } from '../domain/training';
import { assertIntegrity, initialize, OaoDatabase, reconcileTimers } from '../storage/db';

function fixture(){const data=emptyData();data.settings.setPolicy='periodized';anchorTrainingCycle(data,'2026-11-22');return data;}
describe('semana 1 a partir de 23/11/2026',()=>{
 it('reinicia a contagem com 75%, 23 séries na segunda, sem mudar as semanas anteriores',()=>{
  const data=fixture();expect(makeWorkout(data,'2026-11-23')!.exercises.flatMap(e=>e.sets)).toHaveLength(17);
  expect(anchorTrainingCycle(data,'2026-11-24')).toBe(true);
  for(const [date,week] of [['2026-11-16',3],['2026-11-22',3],['2026-11-23',1],['2026-11-29',1],['2026-11-30',2],['2026-12-07',3],['2026-12-14',4],['2027-02-14',12]] as const)expect(schedule(cycleForDate(data,date),date).week).toBe(week);
  const monday=makeWorkout(data,'2026-11-23')!;expect(monday.volume).toBe(.75);expect(monday.exercises.map(e=>e.sets.length)).toEqual([3,3,3,2,3,3,2,2,2]);expect(monday.exercises.every(e=>e.rir.join(',')==='3,4')).toBe(true);
  expect(cycleForDate(data,'2027-02-15')).toBeUndefined();assertIntegrity(data);
 });
 it('ajusta sessão aberta de segunda mesmo após a data, mantendo execução e outros módulos',()=>{
  const data=fixture();const past=makeWorkout(data,'2026-11-16')!,monday=makeWorkout(data,'2026-11-23')!;data.sessions.push(past,monday);
  monday.exercises[0].sets[0]={...monday.exercises[0].sets[0],done:true,load:50,reps:8,rir:4,notes:'Registro real'};
  data.days.push(makeDay(data,'2026-11-23'));data.days[0].water[0]=500;const before=structuredClone(data);
  anchorTrainingCycle(data,'2026-11-24');expect(data.sessions[0]).toEqual(before.sessions[0]);expect(monday.week).toBe(1);expect(monday.volume).toBe(.75);expect(monday.exercises.flatMap(e=>e.sets)).toHaveLength(23);expect(monday.exercises[0].sets[0]).toEqual(before.sessions[1].exercises[0].sets[0]);
  const {cycleId:oldCycle,...previousDay}=before.days[0],{cycleId:newCycle,...currentDay}=data.days[0];expect(newCycle).not.toBe(oldCycle);expect(currentDay).toEqual(previousDay);expect(data.settings).toEqual(before.settings);assertIntegrity(data);
  const saved=structuredClone(data);expect(anchorTrainingCycle(data,'2026-11-25')).toBe(false);expect(data).toEqual(saved);
 });
 it('conserva sessão encerrada como foi executada e não inventa novas séries realizadas',()=>{
  const data=fixture(),session=makeWorkout(data,'2026-11-23')!;session.status='partial';session.reason='Registro encerrado';session.closedAt=now();session.exercises[0].sets[0].done=true;data.sessions.push(session);const before=structuredClone(session);
  anchorTrainingCycle(data,'2026-11-24');const {cycleId:oldCycle,...oldSession}=before,{cycleId:newCycle,...newSession}=session;expect(newCycle).not.toBe(oldCycle);expect(newSession).toEqual(oldSession);expect(schedule(cycleForDate(data,session.date),session.date).week).toBe(1);assertIntegrity(data);
 });
 it('mantém reagendamentos e ciclo futuro sem antecipá-lo',()=>{
  const data=fixture(),old=cycleForDate(data,'2026-11-23')!;old.overrides['2026-11-23']='B1';data.cycles.push({id:'future',start:'2027-01-04',originalVersion:'original-1',createdAt:now(),overrides:{}});const future=structuredClone(data.cycles.at(-1));
  anchorTrainingCycle(data,'2026-11-24');expect(cycleForDate(data,'2026-11-23')?.start).toBe('2026-11-23');expect(schedule(cycleForDate(data,'2026-11-23'),'2026-11-23').template).toBe('B1');expect(cycleForDate(data,'2027-01-04')).toEqual(future);expect(cycleForDate(data,'2026-12-31')?.end).toBe('2027-01-03');assertIntegrity(data);
 });
 it('persiste migração transacional única e ativa a nova semana na virada local',async()=>{
  vi.setSystemTime(new Date('2026-11-22T12:00:00-03:00'));const db=new OaoDatabase('week23-'+crypto.randomUUID());
  try{await initialize(db);vi.setSystemTime(new Date('2026-11-23T12:00:00-03:00'));await reconcileTimers(Date.now(),db);const first=(await db.state.get('main'))!;expect(schedule(cycleForDate(first.data,'2026-11-23'),'2026-11-23').week).toBe(1);expect(await db.audit.count()).toBe(1);expect(await db.outbox.count()).toBe(1);await initialize(db);await reconcileTimers(Date.now(),db);expect(await db.state.get('main')).toEqual(first);expect(await db.audit.count()).toBe(1);assertIntegrity(first.data);}finally{await db.delete();}
 });
});
