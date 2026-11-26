import { describe, expect, it } from 'vitest';
import { emptyData } from '../domain/daily';
import { EXERCISES } from '../domain/plan';
import { anchorTrainingCycle, loadSuggestion, makeWorkout } from '../domain/training';
import type { AppData } from '../domain/model';

// Carga sugerida pelas últimas 5 semanas, com aumento quando a carga vem subindo (26/11/2026).
const ex=EXERCISES.find(e=>e.id==='triceps')!;
function log(data:AppData,date:string,loads:number[]){const s=makeWorkout(data,date)!;const e=s.exercises.find(e=>e.id===ex.id)!;e.sets.forEach((v,i)=>Object.assign(v,{done:true,load:loads[i]??loads.at(-1)!,reps:10}));s.status='complete';data.sessions.push(s);}
const fixture=()=>{const d=emptyData();anchorTrainingCycle(d,'2026-11-24');d.settings.setPolicy='full-deload';return d;};

describe('carga sugerida pelas últimas 5 semanas',()=>{
 it('sem registro usa a referência do plano; seated dips fica a definir',()=>{
  const d=fixture();expect(loadSuggestion(d,ex,'2026-11-30').load).toBe(31);
  expect(loadSuggestion(d,EXERCISES.find(e=>e.id==='triceps-seated-dips')!,'2026-11-30')).toMatchObject({load:null});
 });
 it('carga subindo nas últimas sessões sugere aumentar pelo último passo',()=>{
  const d=fixture();log(d,'2026-11-23',[30]);log(d,'2026-11-26',[32.5]);
  const s=loadSuggestion(d,ex,'2026-11-30');expect(s.load).toBe(35);expect(s.basis).toContain('subindo');
 });
 it('usa o incremento configurado quando existe',()=>{
  const d=fixture();d.settings.increments[ex.id]=1.25;log(d,'2026-11-23',[30]);log(d,'2026-11-26',[32.5]);
  expect(loadSuggestion(d,ex,'2026-11-30').load).toBe(33.75);
 });
 it('carga estável ou em queda mantém a última carga',()=>{
  const d=fixture();log(d,'2026-11-23',[32.5]);log(d,'2026-11-26',[30]);
  expect(loadSuggestion(d,ex,'2026-11-30')).toMatchObject({load:30});
  const e=fixture();log(e,'2026-11-23',[30]);log(e,'2026-11-26',[30]);expect(loadSuggestion(e,ex,'2026-11-30').load).toBe(30);
 });
 it('aumento só com a última sessão completa',()=>{
  const d=fixture();log(d,'2026-11-23',[30]);log(d,'2026-11-26',[32.5]);d.sessions[1].exercises.find(e=>e.id===ex.id)!.sets[2].done=false;
  expect(loadSuggestion(d,ex,'2026-11-30').load).toBe(32.5);
 });
 it('registros fora da janela de 5 semanas não contam para a tendência',()=>{
  const d=fixture();d.cycles[0].start='2026-09-28';log(d,'2026-10-01',[25]);log(d,'2026-11-26',[30]);
  expect(loadSuggestion(d,ex,'2026-11-30').load).toBe(30);
 });
 it('semana de recuperação mantém a carga',()=>{
  const d=fixture();log(d,'2026-11-30',[30]);log(d,'2026-12-07',[32.5]);
  expect(loadSuggestion(d,ex,'2026-12-14')).toMatchObject({load:32.5,basis:'Semana de recuperação: manter a última carga.'});
 });
 it('sessão nova já nasce com a carga sugerida',()=>{
  const d=fixture();log(d,'2026-11-23',[30]);log(d,'2026-11-26',[32.5]);
  expect(makeWorkout(d,'2026-11-30')!.exercises.find(e=>e.id===ex.id)!.suggested).toBe(35);
 });
});
