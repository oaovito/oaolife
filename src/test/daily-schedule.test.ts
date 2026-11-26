import { describe, expect, it } from 'vitest';
import { emptyData, makeDay } from '../domain/daily';
import { appDataSchema } from '../domain/model';
import { DEFAULT_SCHEDULE, nextPending, scheduleDay, scheduleProgress, toggleScheduleItem, updateSchedule } from '../domain/dailySchedule';

// Rotina diária de alimentação e hidratação (26/11/2026).
describe('rotina diária de alimentação e hidratação',()=>{
 it('seed: 12 itens em ordem cronológica, 4 refeições (2 líquidas, 2 sólidas) e 8 × 500 ml = 4.000 ml',()=>{
  const data=emptyData(),list=scheduleDay(data.settings,undefined);
  expect(list.map(e=>e.time)).toEqual(['06:00','07:00','08:30','09:30','10:30','11:30','13:00','14:00','15:30','17:00','18:30','19:30']);
  expect(list.filter(e=>e.kind==='meal').map(e=>e.label)).toEqual(['Refeição 1 – Líquida','Refeição 2 – Sólida','Refeição 3 – Líquida','Refeição 4 – Sólida']);
  expect(list.filter(e=>e.kind==='water').reduce((n,e)=>n+e.ml!,0)).toBe(4000);
  expect(list[0].label).toBe('Água · 500 ml (ao acordar)');expect(list[4].label).toBe('Refeição 2 – Sólida');
 });
 it('marca itens no próprio dia: água soma no registro de líquidos, refeição no plano alimentar; próximo pendente avança',()=>{
  const data=emptyData(),day=makeDay(data,'2026-11-27');data.days.push(day);
  expect(nextPending(scheduleDay(data.settings,day))?.time).toBe('06:00');
  toggleScheduleItem(data.settings,day,'agua-0600','2026-11-27T09:00:00.000Z');
  toggleScheduleItem(data.settings,day,'refeicao-1','2026-11-27T10:00:00.000Z');
  const list=scheduleDay(data.settings,day);
  expect(scheduleProgress(list,day)).toMatchObject({waterMl:500,waterGoal:4000,mealsDone:1,mealsTotal:4});
  expect(day.meals[0].every(Boolean)).toBe(true);expect(nextPending(list)?.time).toBe('08:30');
  toggleScheduleItem(data.settings,day,'agua-0600');expect(scheduleProgress(scheduleDay(data.settings,day),day).waterMl).toBe(0);
 });
 it('reset diário: o dia seguinte começa pendente e o anterior permanece no histórico',()=>{
  const data=emptyData(),a=makeDay(data,'2026-11-27'),b=makeDay(data,'2026-11-28');data.days.push(a,b);
  for(const e of scheduleDay(data.settings,a))toggleScheduleItem(data.settings,a,e.id);
  expect(scheduleDay(data.settings,a).every(e=>e.done)).toBe(true);
  expect(scheduleDay(data.settings,b).some(e=>e.done)).toBe(false);
  expect(scheduleProgress(scheduleDay(data.settings,a),a)).toMatchObject({waterMl:4000,mealsDone:4});
 });
 it('edição: horário, volume e tipo; mantém 4 refeições e reordena',()=>{
  const data=emptyData(),items=structuredClone(DEFAULT_SCHEDULE);
  items[0].time='05:45';items[2].ml=600;
  const water=items.find(i=>i.id==='agua-1930')!,meal=items.find(i=>i.id==='refeicao-4')!;
  water.kind='meal';water.ml=null;meal.kind='water';meal.ml=500;
  updateSchedule(data.settings,items);
  const list=scheduleDay(data.settings,undefined);
  expect(list[0].time).toBe('05:45');expect(list.find(e=>e.id==='agua-0830')!.ml).toBe(600);
  expect(list.filter(e=>e.kind==='meal').map(e=>e.time)).toEqual(['07:00','10:30','14:00','19:30']);
  expect(list.filter(e=>e.time>='18:30').map(e=>[e.time,e.label])).toEqual([['18:30','Água · 500 ml'],['19:30','Refeição 4 – Sólida']]);
  expect(()=>updateSchedule(data.settings,items.map(i=>i.id==='refeicao-1'?{...i,kind:'water' as const,ml:500}:i))).toThrow('exatamente 4 refeições');
  expect(()=>updateSchedule(data.settings,items.map(i=>i.id==='agua-0930'?{...i,time:'08:30'}:i))).toThrow('mesmo horário');
 });
 it('ajustes antigos recebem a rotina padrão (campo aditivo)',()=>{
  const data=emptyData() as unknown as {settings:Record<string,unknown>};delete data.settings.dailySchedule;
  const parsed=appDataSchema.parse(data);expect(parsed.settings.dailySchedule).toHaveLength(12);
 });
});
