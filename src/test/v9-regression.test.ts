import { describe, expect, it, vi, afterEach } from 'vitest';
import Dexie from 'dexie';
import { finishCardio, emptyData, makeDay, summaries } from '../domain/daily';
import { ORIGINAL_PLAN, WEEKS } from '../domain/plan';
import { anchorTrainingCycle, makeWorkout, now, setFactor, weeklyVolume, cycleForDate, schedule, addDays } from '../domain/training';
import { mealNutrients, nutritionTotals, setMealConsumed, nutritionReference, activateMealPlan, FOUR_MEAL_PLAN_2111, serving } from '../domain/nutrition';
import { migrateV9, MIGRATION_9 } from '../domain/migrations';
import { weeklyCardio, cardioGoalReached } from '../domain/cardio';
import { INFORMED_HORMONAL_PLAN, LEGACY_HORMONAL_PLAN, activateHormonalPlan, planForDay, registerHormonalDay } from '../domain/hormonal';
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
 it('padrão escolhido pelo proprietário: integrais, exceto semanas 4 e 8 de recuperação',()=>{
  expect(emptyData().settings.setPolicy).toBe('full-deload');
  const standard=cycleData(emptyData().settings.setPolicy);
  for(let week=1;week<=12;week++){const session=makeWorkout(standard,addDays('2026-11-23',(week-1)*7))!;const template=ORIGINAL_PLAN.find(t=>t.id===session.template)!;const full=session.exercises.every((e,i)=>e.sets.length===template.exercises[i].sets);expect(full).toBe(![4,8].includes(week));}
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

describe('plano alimentar vigente (26/11/2026) · TACO/TBCA',()=>{
 it('calcula cada refeição sem forçar 2.000 kcal e mostra a divergência real',()=>{
  const data=emptyData(),day=makeDay(data,'2026-11-26'),plan=day.nutrition!.plan.map(mealNutrients);
  const expected=[[549.7,45.0,62.4,13.5],[620.0,70.5,70.3,5.4],[549.7,45.0,62.4,13.5],[635.8,69.8,56.2,13.9]];
  plan.forEach((m,i)=>{expect(m.kcal).toBeCloseTo(expected[i][0],0);expect(m.protein).toBeCloseTo(expected[i][1],0);expect(m.carbs).toBeCloseTo(expected[i][2],0);expect(m.fat).toBeCloseTo(expected[i][3],0);});
  const totals=nutritionTotals(day)!;expect(totals.planned.kcal).toBeCloseTo(2355.2,1);expect(totals.planned.protein).toBeCloseTo(230.3,1);expect(totals.planned.carbs).toBeCloseTo(251.3,1);expect(totals.planned.fat).toBeCloseTo(46.4,1);
  expect(day.nutrition?.version==='four-meals-1'&&day.nutrition.calorieGoal).toBe(2000);
  expect(Object.values(totals.planned).every(v=>v!==null)).toBe(true);
 });
 it('nenhum alimento restrito aparece e quantidades prescritas são preservadas',()=>{
  const day=makeDay(emptyData(),'2026-11-26'),labels=day.nutrition!.plan.flatMap(m=>m.foods.map(f=>f.label.toLowerCase())).join(' ');
  for(const word of ['whey','feijão','banana','morango'])expect(labels).not.toContain(word);
  expect(day.nutrition!.plan.map(m=>m.foods.map(f=>f.quantity))).toEqual([[200,300,40,30],[200,250],[200,300,40,30],[180,200]]);
  for(const word of ['azeite','legumes'])expect(day.nutrition!.plan[1].foods.concat(day.nutrition!.plan[3].foods).map(f=>f.label.toLowerCase()).join(' ')).not.toContain(word);
 });
 it('refeição concluída sai das pendentes, permanece no total e pode ser desfeita',()=>{
  const data=emptyData(),day=makeDay(data,'2026-11-26');data.days.push(day);
  setMealConsumed(day,0,true,'2026-11-26T10:00:00.000Z');
  expect(day.nutrition!.consumed[0]).not.toBeNull();expect(nutritionTotals(day)!.consumed.kcal).toBeCloseTo(549.7,1);
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
  expect(nutritionTotals(past)!.consumed.kcal).toBeCloseTo(549.7,1);
  expect(past.nutrition!.consumed[0]!.meal.foods.map(f=>f.quantity)).toEqual([200,300,40,30]);
  expect(data.adjustments.filter(a=>a.id===MIGRATION_9)).toHaveLength(1);assertIntegrity(data);
  const custom=emptyData();custom.settings.calorieGoal=2300;migrateV9(custom,'2026-11-26');expect(custom.settings.calorieGoal).toBe(2300);
 });
 it('referência confirmada cadastrada pelo usuário continua tendo prioridade',()=>{
  const data=emptyData();data.foods.push({id:'f',name:'Iogurte grego natural',brand:'Marca X',quantity:100,unit:'g',kcal:120,protein:10,carbs:5,fat:6,source:'Rótulo',certainty:'confirmado'});
  expect(nutritionReference(data,'greekNatural').nutrients.kcal).toBe(120);
 });
});

describe('cardio · prescrição rígida (seg, ter, qui, sex, dom · 60 min = 300/semana)',()=>{
 it('minutos extras ou em dia sem cardio não compensam outro dia; semana fecha com as 5 sessões',()=>{
  const data=emptyData();
  for(const [id,min] of [['2026-11-23',120],['2026-11-24',120],['2026-11-25',120]] as const){const d=makeDay(data,id);d.cardio.elapsed=min*60;d.cardio.speed=5;if(d.cardio.planned!==null)finishCardio(d.cardio);data.days.push(d);}
  let week=weeklyCardio(data,'2026-11-26');expect(week.actual).toBe(360);expect(week.credited).toBe(120);expect(week.remaining).toBe(180);expect(week.reached).toBe(false);
  data.days.push(makeDay(data,'2026-11-26'));expect(summaries(data,'2026-11-26').cardio.status).toBe('Não iniciado');
  for(const id of ['2026-11-26','2026-11-27','2026-11-29']){const d=data.days.find(v=>v.id===id)??makeDay(data,id);if(!data.days.includes(d))data.days.push(d);d.cardio.elapsed=3600;d.cardio.speed=5;finishCardio(d.cardio);}
  week=weeklyCardio(data,'2026-11-29');expect(week.credited).toBe(300);expect(week.reached).toBe(true);expect(week.sessions).toEqual({done:5,total:5});
 });
 it('migração 9 aplica 60 min nos dias fixos aos dias abertos de hoje em diante, preservando tempo registrado e dias concluídos',()=>{
  const data=emptyData();
  const done=makeDay(data,'2026-11-26');Object.assign(done.cardio,{planned:60,elapsed:3600,speed:5,status:'complete'});
  const open=makeDay(data,'2026-11-27');Object.assign(open.cardio,{planned:30,elapsed:600,speed:5,status:'partial'});
  const rest=makeDay(data,'2026-11-28');Object.assign(rest.cardio,{planned:30,elapsed:0,status:'idle'});
  const past=makeDay(data,'2026-11-24');Object.assign(past.cardio,{planned:60,elapsed:1200,status:'partial'});
  data.days.push(past,done,open,rest);migrateV9(data,'2026-11-26');
  expect(done.cardio).toMatchObject({planned:60,status:'complete'});expect(open.cardio).toMatchObject({planned:60,elapsed:600,speed:5,status:'partial'});
  expect(rest.cardio).toMatchObject({planned:null,status:'idle'});expect(past.cardio).toMatchObject({planned:60,elapsed:1200});
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

describe('programa do dia: registro hormonal e alongamento',()=>{
 it('registro hormonal só é programado às segundas e quintas; exceções registradas aparecem',()=>{
  const data=emptyData();
  const status=(d:string)=>summaries(data,d).hormonal.status;
  expect(['2026-11-23','2026-11-26'].map(status)).toEqual(['Não iniciado','Não iniciado']);
  expect(['2026-11-24','2026-11-25','2026-11-27','2026-11-28','2026-11-29'].every(d=>status(d)==='Não programado')).toBe(true);
  const day=makeDay(data,'2026-11-25');day.declarations.hormonal={at:now(),note:'Exceção'};data.days.push(day);
  expect(status('2026-11-25')).toBe('Concluído');
 });
 it('alongamento é programado todos os dias',()=>{
  const data=emptyData();
  for(let i=0;i<7;i++)expect(summaries(data,addDays('2026-11-23',i)).mobility.status).toBe('Não iniciado');
 });
});

describe('registro hormonal com um toque',()=>{
 it('plano informado: segunda (500/200/50) e quinta (500/200), sem seleção manual',()=>{
  expect(planForDay(INFORMED_HORMONAL_PLAN,1,1).map(e=>[e.substance,e.doseMg])).toEqual([['Testosterona',500],['Decanoato de nandrolona',200],['Enantato de trembolona',50]]);
  expect(planForDay(INFORMED_HORMONAL_PLAN,4,1).map(e=>[e.substance,e.doseMg])).toEqual([['Testosterona',500],['Decanoato de nandrolona',200]]);
  expect(planForDay(INFORMED_HORMONAL_PLAN,3,1)).toEqual([]);
 });
 it('registra o dia inteiro, aceita dose ajustada e não duplica',()=>{
  const data=emptyData();let n=0;const ids=()=>`h${++n}`;
  const items=planForDay(data.hormonalProtocol!,1,1).map(e=>({entryId:e.id,doseMg:e.doseMg}));items[2].doseMg=40;
  expect(registerHormonalDay(data,'2026-11-23',1,items,ids,now())).toBe(3);
  expect(data.hormonalLogs.map(l=>l.doseMg)).toEqual([500,200,40]);
  expect(registerHormonalDay(data,'2026-11-23',1,items,ids,now())).toBe(0);expect(data.hormonalLogs).toHaveLength(3);
  expect(()=>registerHormonalDay(data,'2026-11-26',1,[{entryId:'testosterona-quinta',doseMg:0}],ids,now())).toThrow();
 });
 it('troca só o plano padrão anterior, uma vez, preservando registros e planos personalizados',()=>{
  const data=emptyData();data.hormonalProtocol=structuredClone(LEGACY_HORMONAL_PLAN);data.hormonalLogs.push({id:'old',date:'2026-11-16',week:1,entryId:'oximetolona-oral',substance:'Oximetolona oral',doseMg:50,notes:'',at:now()});
  expect(activateHormonalPlan(data)).toBe(true);expect(data.hormonalProtocol).toEqual(INFORMED_HORMONAL_PLAN);expect(data.hormonalLogs).toHaveLength(1);
  expect(activateHormonalPlan(data)).toBe(false);
  const custom=emptyData();custom.hormonalProtocol!.name='Meu plano';expect(activateHormonalPlan(custom)).toBe(false);expect(custom.hormonalProtocol!.name).toBe('Meu plano');
 });
});

describe('troca do plano alimentar 21/11 → 26/11/2026',()=>{
 const oldPlan=(data:AppData)=>FOUR_MEAL_PLAN_2111.map((m,i)=>({title:`Refeição ${i+1}`,foods:m.map(([k,q])=>serving(data,k,q))}));
 it('dias de hoje em diante passam ao plano novo; refeição já consumida mantém o que foi comido; passado intacto',()=>{
  const data=emptyData(),past=makeDay(data,'2026-11-25'),day=makeDay(data,'2026-11-26');
  for(const d of [past,day]){d.nutrition!.plan=oldPlan(data);d.meals=d.nutrition!.plan.map(m=>m.foods.map(()=>false));}
  setMealConsumed(day,1,true,'2026-11-26T12:00:00.000Z');setMealConsumed(past,0,true,'2026-11-25T08:00:00.000Z');data.days.push(past,day);
  const before=structuredClone(past);
  expect(activateMealPlan(data,'2026-11-26')).toBe(true);
  expect(past).toEqual(before);
  expect(day.nutrition!.plan.map(m=>m.foods.map(f=>f.quantity))).toEqual([[200,300,40,30],[200,250],[200,300,40,30],[180,200]]);
  expect(day.nutrition!.consumed[1]!.meal.foods).toHaveLength(4);expect(day.meals.map(m=>m.length)).toEqual([4,4,4,2]);
  const t=nutritionTotals(day)!;expect(t.consumed.kcal).toBeCloseTo(743.4,1);
  assertIntegrity(data);expect(activateMealPlan(data,'2026-11-26')).toBe(false);
 });
});
