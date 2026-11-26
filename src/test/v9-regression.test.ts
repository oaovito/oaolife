import { describe, expect, it, vi, afterEach } from 'vitest';
import Dexie from 'dexie';
import { emptyData, makeDay, summaries } from '../domain/daily';
import { ORIGINAL_PLAN, WEEKS } from '../domain/plan';
import { anchorTrainingCycle, makeWorkout, now, setFactor, weeklyVolume, cycleForDate, schedule, addDays } from '../domain/training';
import { mealNutrients, nutritionTotals, setMealConsumed, nutritionReference } from '../domain/nutrition';
import { migrateV9, MIGRATION_9 } from '../domain/migrations';
import { weeklyCardio, cardioGoalReached } from '../domain/cardio';
import { assertIntegrity, initialize, OaoDatabase, restoreSnapshot } from '../storage/db';
import type { AppData } from '../domain/model';

afterEach(()=>{vi.useRealTimers();});
function cycleData(policy:AppData['settings']['setPolicy']='full') {
 const data=emptyData();data.settings.setPolicy=policy;
 data.cycles.push({id:'c',start:'2026-11-23',originalVersion:'original-1',createdAt:now(),overrides:{}});
 return data;
}

describe('séries exibidas = séries do plano vigente (bug das 2 séries)',()=>{
 it('em todas as 12 semanas, cada exercício recebe exatamente as séries prescritas',()=>{
  const data=cycleData('full');
  for(let week=1;week<=12;week++)for(let d=0;d<6;d++){
   const date=addDays('2026-11-23',(week-1)*7+d),session=makeWorkout(data,date)!;
   const template=ORIGINAL_PLAN.find(t=>t.id===session.template)!;
   expect(session.week).toBe(week);
   expect(session.exercises.map(e=>e.sets.length)).toEqual(template.exercises.map(e=>e.sets));
   expect(session.exercises.every(e=>e.sets.length>=3)).toBe(true);
   expect(session.exercises.map(e=>e.rir)).toEqual(template.exercises.map(()=>WEEKS[week-1].rir));
  }
 });
 it('semana 1 (23/11/2026) não exibe 2 séries em nenhum exercício',()=>{
  const data=cycleData('full');
  for(const date of ['2026-11-23','2026-11-24','2026-11-25','2026-11-26','2026-11-27','2026-11-28'])
   expect(makeWorkout(data,date)!.exercises.some(e=>e.sets.length===2)).toBe(false);
  expect(weeklyVolume(1,'full')).toEqual(weeklyVolume(3,'full'));
  expect(weeklyVolume(1,'full')['Peito']).toBe(20);expect(weeklyVolume(1,'full')['Costas']).toBe(20);
 });
 it('políticas alternativas continuam explícitas e não são o padrão',()=>{
  expect(emptyData().settings.setPolicy).toBe('full');
  expect(setFactor('full',4)).toBe(1);expect(setFactor('full-deload',4)).toBe(.55);expect(setFactor('full-deload',1)).toBe(1);expect(setFactor('periodized',1)).toBe(.75);
  const deload=cycleData('full-deload');expect(makeWorkout(deload,'2026-12-14')!.exercises.reduce((n,e)=>n+e.sets.length,0)).toBeLessThan(makeWorkout(deload,'2026-12-07')!.exercises.reduce((n,e)=>n+e.sets.length,0));
 });
 it('a migração 9 completa uma sessão aberta de hoje sem apagar séries preenchidas e preserva sessões encerradas',()=>{
  const data=cycleData('periodized');
  const closed=makeWorkout(data,'2026-11-23')!;closed.status='partial';closed.reason='Encerrada';closed.closedAt=now();closed.exercises[0].sets[0].done=true;
  const open=makeWorkout(data,'2026-11-26')!;open.exercises[1].sets[0]={...open.exercises[1].sets[0],done:true,load:30,reps:10,rir:3};
  data.sessions.push(closed,open);const closedBefore=structuredClone(closed),filled=structuredClone(open.exercises[1].sets[0]);
  data.settings.setPolicy='full';
  expect(migrateV9(data,'2026-11-26')).toBe(true);
  expect(data.sessions[0]).toEqual(closedBefore);
  const template=ORIGINAL_PLAN.find(t=>t.id==='A2')!;
  expect(open.exercises.map(e=>e.sets.length)).toEqual(template.exercises.map(e=>e.sets));
  expect(open.exercises[1].sets[0]).toEqual(filled);
  expect(new Set(open.exercises.flatMap(e=>e.sets.map(s=>s.id))).size).toBe(open.exercises.reduce((n,e)=>n+e.sets.length,0));
  assertIntegrity(data);
  const snapshot=structuredClone(data);expect(migrateV9(data,'2026-11-26')).toBe(false);expect(data).toEqual(snapshot);
 });
});

describe('plano alimentar de 21/11/2026 · TACO/TBCA',()=>{
 it('calcula cada refeição sem forçar 2.000 kcal e mostra a divergência real',()=>{
  const data=emptyData(),day=makeDay(data,'2026-11-26'),plan=day.nutrition!.plan.map(mealNutrients);
  const expected=[[628.5,47.8,75.8,15.2],[743.4,72.5,77.3,15.9],[549.7,45.0,62.5,13.5],[715.0,71.8,63.3,19.4]];
  plan.forEach((m,i)=>{expect(m.kcal).toBeCloseTo(expected[i][0],0);expect(m.protein).toBeCloseTo(expected[i][1],0);expect(m.carbs).toBeCloseTo(expected[i][2],0);expect(m.fat).toBeCloseTo(expected[i][3],0);});
  const totals=nutritionTotals(day)!;expect(totals.planned.kcal).toBeCloseTo(2636.6,0);expect(totals.planned.protein).toBeCloseTo(237.1,0);
  expect(day.nutrition?.version==='four-meals-1'&&day.nutrition.calorieGoal).toBe(2000);
  expect(Object.values(totals.planned).every(v=>v!==null)).toBe(true);
 });
 it('nenhum alimento restrito aparece e quantidades prescritas são preservadas',()=>{
  const day=makeDay(emptyData(),'2026-11-26'),labels=day.nutrition!.plan.flatMap(m=>m.foods.map(f=>f.label.toLowerCase())).join(' ');
  for(const word of ['whey','feijão','banana','morango'])expect(labels).not.toContain(word);
  expect(day.nutrition!.plan.map(m=>m.foods.map(f=>f.quantity))).toEqual([[200,300,40,50],[200,250,150,10],[200,300,40,30],[180,200,150,5]]);
 });
 it('refeição concluída sai das pendentes, permanece no total e pode ser desfeita',()=>{
  const data=emptyData(),day=makeDay(data,'2026-11-26');data.days.push(day);
  setMealConsumed(day,0,true,'2026-11-26T10:00:00.000Z');
  expect(day.nutrition!.consumed[0]).not.toBeNull();expect(nutritionTotals(day)!.consumed.kcal).toBeCloseTo(628.5,0);
  expect(summaries(data,'2026-11-26').meals.done).toBe(1);
  setMealConsumed(day,0,false);expect(nutritionTotals(day)!.consumed.kcal).toBe(0);assertIntegrity(data);
 });
 it('migração 9 completa referências desconhecidas de registros consumidos e ajusta só a meta padrão antiga',()=>{
  const data=emptyData();data.settings.calorieGoal=2525;
  const past=makeDay(data,'2026-11-24'),today=makeDay(data,'2026-11-26');
  for(const d of [past,today]){if(d.nutrition?.version!=='four-meals-1')throw Error();d.nutrition.calorieGoal=2525;for(const m of d.nutrition.plan)for(const f of m.foods)if(['greekNatural','skimMilk','vegetables'].includes(f.key))f.reference={...f.reference,nutrients:{kcal:null,protein:null,carbs:null,fat:null},certainty:'desconhecido'};}
  setMealConsumed(past,0,true,'2026-11-24T10:00:00.000Z');data.days.push(past,today);
  expect(nutritionTotals(past)!.consumed.kcal).toBeNull();
  migrateV9(data,'2026-11-26');
  expect(data.settings.calorieGoal).toBe(2000);
  expect(past.nutrition?.version==='four-meals-1'&&past.nutrition.calorieGoal).toBe(2525);
  expect(today.nutrition?.version==='four-meals-1'&&today.nutrition.calorieGoal).toBe(2000);
  expect(nutritionTotals(past)!.consumed.kcal).toBeCloseTo(628.5,0);
  expect(past.nutrition!.consumed[0]!.meal.foods.map(f=>f.quantity)).toEqual([200,300,40,50]);
  expect(data.adjustments.filter(a=>a.id===MIGRATION_9)).toHaveLength(1);assertIntegrity(data);
  const custom=emptyData();custom.settings.calorieGoal=2300;migrateV9(custom,'2026-11-26');expect(custom.settings.calorieGoal).toBe(2300);
 });
 it('referência confirmada cadastrada pelo usuário continua tendo prioridade',()=>{
  const data=emptyData();data.foods.push({id:'f',name:'Iogurte grego natural',brand:'Marca X',quantity:100,unit:'g',kcal:120,protein:10,carbs:5,fat:6,source:'Rótulo',certainty:'confirmado'});
  expect(nutritionReference(data,'greekNatural').nutrients.kcal).toBe(120);
 });
});

describe('cardio · meta semanal flexível de 360 min',()=>{
 it('qualquer distribuição conta para a semana e conclui o bloco ao atingir 360 min',()=>{
  const data=emptyData();
  for(const [id,min] of [['2026-11-23',120],['2026-11-24',120],['2026-11-25',120]] as const){const d=makeDay(data,id);d.cardio.elapsed=min*60;d.cardio.speed=5;data.days.push(d);}
  const week=weeklyCardio(data,'2026-11-26');expect(week.actual).toBe(360);expect(week.remaining).toBe(0);expect(week.reached).toBe(true);
  data.days.push(makeDay(data,'2026-11-26'));expect(summaries(data,'2026-11-26').cardio.status).toBe('Concluído');
 });
 it('semana reinicia na segunda-feira sem apagar o histórico',()=>{
  const data=emptyData(),d=makeDay(data,'2026-11-29');d.cardio.elapsed=3600;data.days.push(d);
  expect(weeklyCardio(data,'2026-11-29').actual).toBe(60);expect(weeklyCardio(data,'2026-11-30').actual).toBe(0);expect(data.days).toHaveLength(1);
 });
 it('velocidade mínima vale só para esteira',()=>{
  const c=makeDay(emptyData(),'2026-11-26').cardio;Object.assign(c,{elapsed:c.planned!*60,mode:'Bicicleta',speed:null});expect(cardioGoalReached(c)).toBe(true);
  Object.assign(c,{mode:'Esteira',speed:4});expect(cardioGoalReached(c)).toBe(false);
 });
});

describe('rollback local da atualização 9',()=>{
 it('guarda cópia antes de migrar e restaura sem reaplicar a migração',async()=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-11-26T12:00:00-03:00'));
  const name='v9-'+crypto.randomUUID(),old=new Dexie(name);old.version(8).stores({state:'id',audit:'id,at,revision,kind',outbox:'id,at,state,revision'});
  const data=emptyData();data.schemaVersion=8 as never;data.settings.calorieGoal=2525;anchorTrainingCycle(data,'2026-11-26');
  await old.table('state').put({id:'main',revision:3,data});old.close();
  const database=new OaoDatabase(name);
  try{
   await initialize(database);const migrated=(await database.state.get('main'))!;
   expect(migrated.data.schemaVersion).toBe(9);expect(migrated.data.settings.calorieGoal).toBe(2000);
   expect((await database.snapshots.get('pre-v9'))!.revision).toBe(3);
   await restoreSnapshot('pre-v9',database);const restored=(await database.state.get('main'))!;
   expect(restored.data.settings.calorieGoal).toBe(2525);expect(restored.revision).toBe(migrated.revision+1);
   await initialize(database);expect((await database.state.get('main'))!.data.settings.calorieGoal).toBe(2525);
   expect(schedule(cycleForDate(restored.data,'2026-11-26'),'2026-11-26').week).toBe(1);
  }finally{await database.delete();}
 });
});
