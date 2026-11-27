import { describe, expect, it } from 'vitest';
import { emptyData, makeDay, summaries } from '../domain/daily';
import { appDataSchema } from '../domain/model';
import { routineDone, routineItems, toggleRoutine } from '../domain/routines';
import { perfectDay } from '../domain/weeklyReport';

// ManCare (Barba aos domingos) e Cuidado Casa (Louça e Lixo todos os dias), a partir de 26/11/2026.
describe('blocos ManCare e Cuidado Casa',()=>{
 it('programação: barba só aos domingos; louça e lixo todos os dias; nada antes de 26/11/2026',()=>{
  expect(routineItems('mancare','2026-11-29').map(i=>i.name)).toEqual(['Barba']);
  for(const d of ['2026-11-26','2026-11-27','2026-11-28','2026-11-30'])expect(routineItems('mancare',d)).toEqual([]);
  for(const d of ['2026-11-28','2026-11-29'])expect(routineItems('casa',d).map(i=>i.name)).toEqual(['Louça','Lixo']);
  for(const d of ['2026-11-26','2026-12-01','2026-12-03'])expect(routineItems('casa',d).map(i=>i.name)).toEqual(['Louça','Lixo','Aspirador']);
  for(const d of ['2026-11-27','2026-11-30','2026-12-02'])expect(routineItems('casa',d).map(i=>i.name)).toEqual(['Louça','Lixo','Roupa 1','Roupa 2']);
  expect(routineItems('casa','2026-11-25')).toEqual([]);expect(routineItems('casa','2026-11-24').map(i=>i.name)).toEqual([]);
  const data=emptyData();expect(summaries(data,'2026-11-25').casa.status).toBe('Não programado');expect(summaries(data,'2026-11-30').mancare.status).toBe('Não programado');
 });
 it('marca e desmarca cada item; bloco conclui com todos os itens do dia',()=>{
  const data=emptyData(),day=makeDay(data,'2026-11-29');data.days.push(day);
  expect(summaries(data,day.id).casa).toMatchObject({status:'Não iniciado',done:0,total:2});
  toggleRoutine(day,'casa','louca','2026-11-29T20:00:00.000Z');expect(summaries(data,day.id).casa).toMatchObject({status:'Em andamento',done:1});
  toggleRoutine(day,'casa','lixo','2026-11-29T20:01:00.000Z');expect(summaries(data,day.id).casa.status).toBe('Concluído');
  toggleRoutine(day,'casa','lixo','2026-11-29T20:02:00.000Z');expect(day.routines.lixo).toEqual({done:false,at:null});
  toggleRoutine(day,'mancare','barba','2026-11-29T08:00:00.000Z');expect(summaries(data,day.id).mancare.status).toBe('Concluído');
  expect(()=>toggleRoutine(makeDay(data,'2026-11-30'),'mancare','barba','2026-11-30T08:00:00.000Z')).toThrow('fora da rotina');
 });
 it('roupa: duas caixas, Roupa 1 e Roupa 2, seg/qua/sex; bloco só conclui com as duas',()=>{
  const data=emptyData(),day=makeDay(data,'2026-11-30');data.days.push(day);
  toggleRoutine(day,'casa','louca','2026-11-30T20:00:00.000Z');toggleRoutine(day,'casa','lixo','2026-11-30T20:00:00.000Z');
  toggleRoutine(day,'casa','roupa1','2026-11-30T21:00:00.000Z');expect(day.routines.roupa1).toEqual({done:true,at:'2026-11-30T21:00:00.000Z'});
  expect(summaries(data,day.id).casa).toMatchObject({status:'Em andamento',done:3,total:4});
  toggleRoutine(day,'casa','roupa2','2026-11-30T21:01:00.000Z');expect(summaries(data,day.id).casa.status).toBe('Concluído');
  toggleRoutine(day,'casa','roupa2','2026-11-30T21:02:00.000Z');expect(day.routines.roupa2).toEqual({done:false,at:null});
  expect(()=>toggleRoutine(makeDay(data,'2026-12-01'),'casa','roupa1','2026-12-01T08:00:00.000Z')).toThrow('fora da rotina');
 });
 it('regressão: etapas antigas da máquina de roupa continuam valendo e não são apagadas',()=>{
  const data=emptyData(),day=makeDay(data,'2026-11-27');data.days.push(day);
  for(const k of ['lavar','estender','recolher','dobrar','guardar'])day.routines[`roupa.1.${k}`]={done:true,at:'2026-11-27T10:00:00.000Z'};
  day.routines['roupa.2.lavar']={done:true,at:'2026-11-27T11:00:00.000Z'};
  const [,,r1,r2]=routineItems('casa',day.id);expect(routineDone(day,r1)).toBe(true);expect(routineDone(day,r2)).toBe(false);
  expect(appDataSchema.parse(data).days[0].routines['roupa.2.lavar'].done).toBe(true);
  toggleRoutine(day,'casa','roupa1','2026-11-27T12:00:00.000Z');expect(routineDone(day,r1)).toBe(false);expect(day.routines['roupa.1.lavar']).toEqual({done:false,at:null});
 });
 it('dia cumprido exige os itens de rotina do dia',()=>{
  const data=emptyData(),day=makeDay(data,'2026-11-27');data.days.push(day);
  const blocks=summaries(data,day.id);for(const k of ['workout','meals','water','cardio','mobility','hormonal'] as const)day.declarations[k]={at:'2026-11-27T22:00:00.000Z',note:'teste'};
  expect(blocks.casa.status).not.toBe('Concluído');expect(perfectDay(data,day.id)).toBe(false);
 });
 it('registros antigos sem o campo continuam válidos (padrão vazio)',()=>{
  const data=emptyData(),day=makeDay(data,'2026-11-20') as Record<string,unknown>;delete day.routines;data.days.push(day as never);
  const parsed=appDataSchema.parse(data);expect(parsed.days[0].routines).toEqual({});
 });
});
