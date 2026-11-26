import { describe, expect, it } from 'vitest';
import { emptyData } from '../domain/daily';
import { ORIGINAL_PLAN, TRAINING_PLAN_VERSION } from '../domain/plan';
import { anchorTrainingCycle, makeWorkout, reconcileOpenSessions, weeklyVolume } from '../domain/training';

// Abdominal máquina (26/11/2026): 12 séries/semana = 3 séries em B1, C1, B2 e C2.
const fixture=()=>{const data=emptyData();anchorTrainingCycle(data,'2026-11-22');return data;};

describe('abdominal máquina 12 séries/semana',()=>{
 it('3 séries em B1, C1, B2 e C2; fora de A1 e A2; 12 por semana e menos na recuperação',()=>{
  const sets=(id:string)=>ORIGINAL_PLAN.find(t=>t.id===id)!.exercises.filter(e=>e.id==='abdominal-maquina').map(e=>[e.name,e.muscle,e.sets]);
  for(const id of ['B1','C1','B2','C2'])expect(sets(id)).toEqual([['Abdominal máquina','Abdômen',3]]);
  for(const id of ['A1','A2'])expect(sets(id)).toEqual([]);
  expect(weeklyVolume(1,'full-deload')['Abdômen']).toBe(12);
  expect(weeklyVolume(4,'full-deload')['Abdômen']).toBeLessThan(12);
 });
 it('sessão aberta de hoje em diante recebe o abdominal; registros e sessões passadas ficam intactos; idempotente',()=>{
  const data=fixture();
  const days=['2026-11-30','2026-12-01','2026-12-02','2026-12-03','2026-12-04','2026-12-05'];
  const open=days.map(d=>makeWorkout(data,d)!).find(s=>['B1','C1','B2','C2'].includes(s.template))!;
  open.exercises=open.exercises.filter(e=>e.id!=='abdominal-maquina');open.exercises[0].sets[0]={...open.exercises[0].sets[0],done:true,load:40,reps:10};
  const past=makeWorkout(data,'2026-11-24')!;past.exercises=past.exercises.filter(e=>e.id!=='abdominal-maquina');
  data.sessions.push(open,past);const pastSnap=JSON.stringify(past);
  expect(reconcileOpenSessions(data,'2026-11-26')).toBe(true);
  const got=data.sessions.find(s=>s.id===open.id)!;
  expect(got.exercises.find(e=>e.id==='abdominal-maquina')!.sets).toHaveLength(3);
  expect(got.exercises[0].sets[0]).toMatchObject({done:true,load:40,reps:10});
  expect(JSON.stringify(data.sessions.find(s=>s.id===past.id))).toBe(pastSnap);
  expect(data.adjustments.filter(a=>a.id===`training-plan-${TRAINING_PLAN_VERSION}`)).toHaveLength(1);
  const snap=JSON.stringify(data);expect(reconcileOpenSessions(data,'2026-11-26')).toBe(false);expect(JSON.stringify(data)).toBe(snap);
 });
});
