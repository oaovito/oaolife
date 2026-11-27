import { waterConsumed, waterGoal } from './hydration';
import { createNutrition, mealsForDay, setMealConsumed, syncMealRecord } from './nutrition';
import type { AppData, BlockKey, BlockSummary, DailyLog, WorkoutSession, CardioSession } from './model';
import { DEFAULT_SCHEDULE } from './model';
import { routineDone, routineItems, type RoutineBlock } from './routines';
import { INFORMED_HORMONAL_PLAN } from './hormonal';
import { MEALS } from './plan';
import { cycleForDate, now, schedule } from './training';
import { cardioTarget, speedRuleMet } from './cardio';
import { currentMobilityProtocol } from './mobility';
export const HORMONAL_WEEKDAYS=[1,4]; // segunda e quinta
// DADO PESSOAL: perfil (idade, altura, peso) e metas individuais. Migrar para repositório privado (docs/PERSONAL_DATA_INVENTORY.md).
export function emptyData():AppData { return {schemaVersion:9,nutritionOverrides:{},hormonalProtocol:structuredClone(INFORMED_HORMONAL_PLAN),hormonalLogs:[],profile:{id:'local-user',age:27,height:178,initialWeight:84},settings:{id:'settings',haptics:true,theme:'dark',timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,increments:{},cardioMinutes:60,waterTarget:500,hydrationTarget:4000,bottleVolume:500,calorieGoal:2000,proteinGoal:190,setPolicy:'full-deload',mealTimes:['','','','',''],lastBackup:null,installationNotice:false,dailySchedule:structuredClone(DEFAULT_SCHEDULE)},cycles:[],sessions:[],days:[],measurements:[],photos:[],foods:[],recipes:[],mobility:null,decisions:[],adjustments:[]}; }
export function makeDay(data:AppData,date:string):DailyLog {
 const cycle=cycleForDate(data,date),p=schedule(cycle,date);
 const configured=currentMobilityProtocol(data.mobility);
 // Alongamento para hipercifose: todos os dias, inclusive domingo (ordem do proprietário, 26/11/2026).
 const protocol=structuredClone(configured);
 return {hydration:{version:'liquids-1',target:data.settings.hydrationTarget,bottle:data.settings.bottleVolume,entries:[]},archivedNutrition:[],nutrition:createNutrition(data),previousNutrition:null,declarations:{},id:date,cycleId:cycle?.id??null,timezone:data.settings.timezone,createdAt:now(),recorded:[],meals:MEALS.map(m=>m.foods.map(()=>false)),mealTimes:MEALS.map(()=>null),water:Array(6).fill(0),waterTargets:Array(6).fill(data.settings.waterTarget),cardio:{planVersion:'weekly-360',planned:cardioTarget(date),elapsed:0,runningSince:null,status:'idle',mode:'Esteira',minimumSpeed:5,speed:null,intensity:'Leve',rpe:null,heartRate:null,notes:''},mobility:{protocol,sets:{},sequences:{}},recovery:{sleep:null,fatigue:null,soreness:null,pain:null,jointPain:false,symptoms:false,notes:''},routines:{}};
}
export function nextMeal(day:DailyLog) { const i=day.meals.findIndex(m=>!m.every(Boolean));return i<0?null:i; }
export function toggleFood(day:DailyLog,meal:number,food:number,at=now()) { if(day.nutrition?.version==='five-meals-2'&&meal===3)throw Error('Use os registros de frutas.'); if(day.nutrition?.consumed[meal]){day.nutrition.plan[meal]=structuredClone(day.nutrition.consumed[meal]!.meal);if(day.nutrition.version==='five-meals-1'&&meal===4)day.nutrition.protein=day.nutrition.plan[4].foods[1].key as typeof day.nutrition.protein;if(day.nutrition.version==='five-meals-2'&&(meal===1||meal===4)){const p=day.nutrition.plan[meal].foods[0].key as typeof day.nutrition.protein;if(meal===1)day.nutrition.lunchProtein=p;else day.nutrition.protein=p;}}day.meals[meal][food]=!day.meals[meal][food];day.mealTimes[meal]=day.meals[meal].every(Boolean)?at:null;syncMealRecord(day,meal,at); }
export function completeMeal(day:DailyLog,meal:number,at=now()) {setMealConsumed(day,meal,!day.meals[meal].every(Boolean),at);}
export function timerSeconds(timer:{elapsed:number;runningSince:number|null},clock=Date.now()) { return Math.max(0,Math.floor(timer.elapsed+(timer.runningSince===null?0:Math.max(0,clock-timer.runningSince)/1000))); }
// Cardio sem cronômetro (26/11/2026, proprietário): um toque registra a meta do dia ou o usuário
// informa os minutos realizados. A conclusão exige a meta do próprio dia (e, na esteira, 5,0 km/h).
export function settleCardio(c:CardioSession) {
 c.runningSince=null;c.status=c.planned!==null&&c.elapsed>=c.planned*60&&speedRuleMet(c)?'complete':c.elapsed>0?'partial':'idle';
}
export function recordCardioMinutes(c:CardioSession,minutes:number) {
 if(!Number.isFinite(minutes)||minutes<0||minutes>1440)throw Error('Informe os minutos realizados (0 a 1.440).');
 c.elapsed=Math.round(minutes*60);settleCardio(c);
}
// Check da meta: registra os minutos programados do dia. Na esteira, o toque confirma a velocidade
// mínima prescrita quando nenhuma foi informada; velocidade informada abaixo dela continua valendo.
export function toggleCardioTarget(c:CardioSession) {
 if(c.planned===null)throw Error('Sem cardio programado neste dia.');
 if(c.status==='complete'){c.elapsed=0;settleCardio(c);return;}
 if(c.mode==='Esteira'&&c.minimumSpeed!==null&&c.speed===null)c.speed=c.minimumSpeed;
 c.elapsed=c.planned*60;settleCardio(c);
 if((c.status as string)!=='complete')throw Error(`Velocidade registrada abaixo de ${c.minimumSpeed?.toLocaleString('pt-BR',{minimumFractionDigits:1})} km/h na esteira. Corrija a velocidade para concluir.`);
}
// Cronômetros antigos em andamento: encerra preservando o tempo já decorrido.
export function stopCardioTimer(c:CardioSession,clock=Date.now()) {
 if(c.runningSince===null)return false;c.elapsed=timerSeconds(c,clock);settleCardio(c);return true;
}
export function timedCompletionRequired(day:DailyLog,key:string) { return key==='cardio'&&day.cardio.planVersion==='weekly-360'||key==='mobility'&&!!day.mobility.protocol?.exercises.some(ex=>/hipercifose/i.test(ex.name)&&ex.sets===4&&ex.duration===60&&ex.rest===60); }
function summary(done:number,total:number,subtitle:string,partial=false):BlockSummary { return {done,total,subtitle,status:total===0?'Não programado':done>=total?'Concluído':partial?'Parcial':done?'Em andamento':'Não iniciado'}; }
export function summaries(data:AppData,date:string,clock=Date.now()):Record<BlockKey,BlockSummary> {
 const cycle=cycleForDate(data,date),plan=schedule(cycle,date),day=data.days.find(d=>d.id===date)??makeDay(data,date);const session=data.sessions.find(s=>s.date===date&&s.cycleId===cycle?.id);
 const totalSets=session?.exercises.reduce((a,e)=>a+e.sets.length,0)||0,doneSets=session?.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0)||0;
 const workout=plan.template?summary(doneSets,totalSets||1,`${plan.template} · ${totalSets?`${doneSets}/${totalSets} séries`:plan.week?'Pronto para começar':'Configure a semana da periodização'}`,session?.status==='partial'):summary(0,0,'Descanso e recuperação');
 if(plan.template&&!session){workout.done=0;workout.total=0;workout.status=plan.week?'Não iniciado':'Pendente de revisão';}
 const mealDone=day.meals.filter(m=>m.every(Boolean)).length,mi=nextMeal(day);
 const meals=summary(mealDone,day.meals.length,mi===null?'Alimentação concluída':`${mealsForDay(day)[mi].title} · ${mealsForDay(day)[mi].foods[0]??'Frutas à vontade'}`,day.meals.some(m=>m.some(Boolean)&&!m.every(Boolean)));
 const waterDone=day.water.filter((v,i)=>v>=day.waterTargets[i]).length;
 const water=day.hydration?summary(waterConsumed(day),waterGoal(day),`${waterConsumed(day)} de ${waterGoal(day)} ml`):summary(waterDone,6,waterDone===6?'Hidratação concluída':`${(day.water.reduce((a,v)=>a+v,0)/1000).toLocaleString('pt-BR',{maximumFractionDigits:2})} de ${(day.waterTargets.reduce((a,v)=>a+v,0)/1000).toLocaleString('pt-BR')} litros`,day.water.some((v,i)=>v>0&&v<day.waterTargets[i]));
 const cardioScheduled=day.cardio.planned!==null;const seconds=timerSeconds(day.cardio,clock);
 const cardio=cardioScheduled?summary(day.cardio.status==='complete'?1:0,1,day.cardio.planned===null?'Sem cardio programado':`${Math.floor(seconds/60)} de ${day.cardio.planned} min · ${day.cardio.mode}${day.cardio.minimumSpeed===null?'':` · ${day.cardio.speed??'—'} / ${day.cardio.minimumSpeed} km/h`}`,day.cardio.status==='partial'):summary(0,0,'Não programado');
 if(cardioScheduled&&day.cardio.planned===null)cardio.status='Pendente de revisão';else if(cardioScheduled&&['running','paused'].includes(day.cardio.status))cardio.status='Em andamento';
 // Cardio rígido: o dia só conclui com a própria meta (sem compensação semanal).
 const mobilityScheduled=true; // diário
 const protocol=day.mobility.protocol;const mTotal=protocol?.exercises.reduce((a,e)=>a+e.sets,0)||0;const validIds=protocol?.exercises.flatMap(e=>Array.from({length:e.sets},(_,i)=>`${e.id}:${i}`))||[];const mDone=validIds.filter(id=>day.mobility.sets[id]?.done).length;
 const mobility=mobilityScheduled?(mTotal?summary(mDone,mTotal,`${mDone}/${mTotal} séries do protocolo`):{status:'Pendente de revisão' as const,done:0,total:4,subtitle:'Protocolo pendente de configuração'}):summary(0,0,'Não programado');
 const logs=data.hormonalLogs.filter(log=>log.date===date);
 // Registro hormonal: programado às segundas e quintas. Em outros dias só aparece quando há
 // exceção registrada (administração ou conclusão declarada), aberta por Ajustes.
 const hormonalDay=HORMONAL_WEEKDAYS.includes(new Date(date+'T12:00:00Z').getUTCDay())||logs.length>0||!!day.declarations.hormonal;
 const hormonal=hormonalDay?summary(0,1,logs.length?`${logs.length} administração(ões) registrada(s)`:`Plano informado · ${(data.hormonalProtocol??INFORMED_HORMONAL_PLAN).weeks} semanas`):summary(0,0,'Não programado');
 if(hormonalDay&&logs.length)hormonal.status='Em andamento';
 // ManCare e Cuidado Casa: itens do dia, marcados um a um.
 const routine=(block:RoutineBlock)=>{const items=routineItems(block,date);if(!items.length)return summary(0,0,'Não programado');const done=items.filter(i=>routineDone(day,i));return summary(done.length,items.length,items.map(i=>`${i.name}${routineDone(day,i)?' ✓':''}`).join(' · '));};
 const blocks={workout,meals,water,cardio,mobility,hormonal,despertar:routine('despertar'),mancare:routine('mancare'),casa:routine('casa')};
 for(const key of Object.keys(day.declarations) as (keyof typeof blocks)[]) {
  if(!timedCompletionRequired(day,key)&&blocks[key].status!=='Não programado') blocks[key]={status:'Concluído',done:1,total:1,subtitle:'Confirmado por você · detalhes não informados'};
 }
 return blocks;
}
export function dayComplete(blocks:ReturnType<typeof summaries>) { return Object.values(blocks).every(b=>b.status==='Concluído'||b.status==='Não programado'); }
export function workoutComplete(s:WorkoutSession) { return s.exercises.length>0&&s.exercises.every(e=>e.sets.every(v=>v.done)); }
export function weeklyWeight(data:AppData,end:string) { const last=new Date(end+'T12:00:00Z');last.setUTCDate(last.getUTCDate()-6);const start=last.toISOString().slice(0,10);const values=data.measurements.filter(m=>m.date>=start&&m.date<=end&&m.weight!==null);const dates=new Map(values.map(v=>[v.date,v.weight!]));return {average:dates.size?[...dates.values()].reduce((a,n)=>a+n,0)/dates.size:null,count:dates.size,complete:dates.size===7}; }
export function recipeNutrition(data:AppData,recipeId:string) {
 const r=data.recipes.find(r=>r.id===recipeId);if(!r)return null;
 return Object.fromEntries((['kcal','protein','carbs','fat'] as const).map(key=>{const values=r.ingredients.map(i=>{const f=data.foods.find(f=>f.id===i.foodId);return f?.[key]===null||!f?null:f[key]!*i.quantity/f.quantity;});return [key,values.some(v=>v===null)?null:(values as number[]).reduce((a,v)=>a+v,0)*100/r.yieldGrams];}));
}

