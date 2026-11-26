import { describe, expect, it } from 'vitest';
import { emptyData } from '../domain/daily';
import { ORIGINAL_PLAN, TRAINING_PLAN_VERSION } from '../domain/plan';
import { anchorTrainingCycle, makeWorkout, reconcileOpenSessions, weeklyVolume } from '../domain/training';

// Tríceps (26/11/2026): 3 polia + 3 francês polia + 3 seated dips em A1 e A2, no plano e nas sessões.
const fixture=()=>{const data=emptyData();anchorTrainingCycle(data,'2026-11-22');return data;};
const triceps=(ids:string[])=>ids.filter(id=>['triceps','frances','triceps-seated-dips'].includes(id));

describe('tríceps 3 + 3 + 3',()=>{
 it('A1 e A2 trazem polia, francês e seated dips com 3 séries cada',()=>{
  for(const id of ['A1','A2']){const t=ORIGINAL_PLAN.find(x=>x.id===id)!;
   expect(t.exercises.filter(e=>e.muscle==='Tríceps').map(e=>[e.name,e.sets])).toEqual([['Tríceps polia',3],['Tríceps francês polia',3],['Tríceps seated dips',3]]);}
  expect(weeklyVolume(1,'full-deload')['Tríceps']).toBe(18);
  expect(weeklyVolume(4,'full-deload')['Tríceps']).toBeLessThan(18);
 });
 it('sessão nova de segunda (A1) já nasce com 3/3/3',()=>{
  const s=makeWorkout(fixture(),'2026-11-30')!;expect(s.template).toBe('A1');
  expect(s.exercises.filter(e=>e.muscle==='Tríceps').map(e=>[e.id,e.sets.length])).toEqual([['triceps',3],['frances',3],['triceps-seated-dips',3]]);
 });
 it('sessão aberta antiga é reconciliada sem perder séries registradas, e é idempotente',()=>{
  const data=fixture(),s=makeWorkout(data,'2026-11-30')!;
  // Simula a sessão criada no plano anterior: 4 polia (2 feitas), 4 francês, sem dips.
  const polia=s.exercises.find(e=>e.id==='triceps')!,fr=s.exercises.find(e=>e.id==='frances')!;
  const blank=polia.sets[0];
  polia.sets=[0,1,2,3].map(j=>({...blank,id:`triceps:${j}`}));polia.sets[0]={...polia.sets[0],done:true,load:30,reps:10};polia.sets[3]={...polia.sets[3],load:25};
  fr.sets=[0,1,2,3].map(j=>({...blank,id:`frances:${j}`}));
  s.exercises=s.exercises.filter(e=>e.id!=='triceps-seated-dips');data.sessions.push(s);
  expect(reconcileOpenSessions(data,'2026-11-26')).toBe(true);
  const got=data.sessions[0];
  expect(triceps(got.exercises.map(e=>e.id))).toEqual(['triceps','frances','triceps-seated-dips']);
  const p=got.exercises.find(e=>e.id==='triceps')!;
  // Quatro séries com dados (1ª feita, 4ª com carga) permanecem; só a vazia sai.
  expect(p.sets).toHaveLength(3);expect(p.sets[0]).toMatchObject({done:true,load:30,reps:10});expect(p.sets.some(v=>v.load===25)).toBe(true);
  expect(got.exercises.find(e=>e.id==='frances')!.sets).toHaveLength(3);
  expect(got.exercises.find(e=>e.id==='triceps-seated-dips')!.sets).toHaveLength(3);
  expect(data.adjustments.filter(a=>a.id===`training-plan-${TRAINING_PLAN_VERSION}`)).toHaveLength(1);
  const snap=JSON.stringify(data);expect(reconcileOpenSessions(data,'2026-11-26')).toBe(false);expect(JSON.stringify(data)).toBe(snap);
 });
 it('sessões encerradas e datas passadas ficam como foram executadas',()=>{
  const data=fixture(),s=makeWorkout(data,'2026-11-23')!;s.exercises=s.exercises.filter(e=>e.id!=='triceps-seated-dips');
  const closed=makeWorkout(data,'2026-11-30')!;closed.status='complete';closed.exercises=closed.exercises.filter(e=>e.id!=='triceps-seated-dips');
  data.sessions.push(s,closed);const snap=JSON.stringify(data.sessions);
  expect(reconcileOpenSessions(data,'2026-11-26')).toBe(false);expect(JSON.stringify(data.sessions)).toBe(snap);
 });
});
