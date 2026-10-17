import type { AppData, Muscle } from './model';
import { addDays, cycleForDate, makeWorkout } from './training';
import { timerSeconds, weeklyWeight } from './daily';
import { MEALS } from './plan';

export function dayReport(data:AppData,date:string) {
 const day=data.days.find(d=>d.id===date),sets=data.sessions.filter(s=>s.date===date).flatMap(s=>s.exercises.flatMap(e=>e.sets));
 const labels={workout:'treino',meals:'alimentação',water:'hidratação',cardio:'cardio',mobility:'mobilidade',hormonal:'registro hormonal'};
 return {
  declaredBlocks:Object.keys(day?.declarations??{}).map(k=>labels[k as keyof typeof labels]),
  hormonalLogs:data.hormonalLogs.filter(log=>log.date===date),
  setsDone:sets.filter(s=>s.done).length,
  setsSkipped:sets.filter(s=>s.skipped).length,
  incompleteSets:sets.filter(s=>s.done&&(s.load===null||s.reps===null||s.rir===null||s.technique===null||s.range===null)).length,
  waterMl:day?.recorded.includes('water')?day.water.reduce((a,v)=>a+v,0):null,
  cardioMinutes:day?.recorded.includes('cardio')?timerSeconds(day.cardio)/60:null,
  cardioSpeed:day?.cardio.speed??null,
  foods:MEALS.flatMap((m,i)=>m.foods.filter((_,j)=>day?.meals[i][j]).map(f=>`${m.title}: ${f}`)),
  caloriesConsumed:null,caloriesBurned:null,
 };
}
export const METRICS={weight:'Peso (kg)',average:'Média de peso em 7 dias (kg)',waist:'Cintura (cm)',load:'Carga máxima (kg, modalidade original)',reps:'Repetições executadas',volume:'Séries diretas executadas por músculo',planned:'Séries previstas',executed:'Séries executadas',rir:'RIR médio',frequency:'Frequência de treino',cardio:'Cardio realizado (min)',mobility:'Hipercifose (séries)',meals:'Alimentação (refeições)',water:'Água (ml)',sleep:'Sono (h)',recovery:'Fadiga (0–10)'} as const;
export type Metric=keyof typeof METRICS;
export interface Point {date:string;value:number|null;note?:string}
export function metricPoints(data:AppData,start:string,end:string,metric:Metric,exerciseId:string,muscle:Muscle):Point[] {
 const result:Point[]=[];let count=0;
 for(let date=start;date<=end&&count<400;date=addDays(date,1),count++){
 const measurement=data.measurements.find(m=>m.date===date);const day=data.days.find(d=>d.id===date);const session=data.sessions.find(s=>s.date===date);const sets=session?.exercises.flatMap(e=>e.sets.filter(v=>v.done).map(v=>({...v,exerciseId:e.id,muscle:e.muscle,plannedMode:e.mode})))||[];
 let value:number|null=null,note:string|undefined;
 switch(metric){
 case 'weight':value=measurement?.weight??null;break;
 case 'waist':value=measurement?.waist??null;break;
 case 'average':{const average=weeklyWeight(data,date);value=average.average;note=`${average.count}/7 medições${average.complete?'':' · média incompleta'}`;break;}
 case 'load':{const values=sets.filter(s=>s.exerciseId===exerciseId&&s.mode===s.plannedMode&&s.load!==null).map(s=>s.load!);value=values.length?Math.max(...values):null;break;}
 case 'reps':{const values=sets.filter(s=>s.exerciseId===exerciseId&&s.reps!==null);value=values.length?values.reduce((a,v)=>a+v.reps!,0):null;break;}
 case 'volume':value=session?sets.filter(s=>s.muscle===muscle).length:null;break;
 case 'planned':{const planned=session??makeWorkout(data,date);value=planned?.exercises.reduce((a,e)=>a+e.sets.length,0)??null;break;}
 case 'executed':value=session?sets.length:null;break;
 case 'frequency':value=session?(sets.length?1:0):null;break;
 case 'rir':{const values=sets.filter(s=>s.exerciseId===exerciseId&&s.rir!==null);value=values.length?values.reduce((a,v)=>a+v.rir!,0)/values.length:null;break;}
 case 'cardio':value=day?.recorded.includes('cardio')?timerSeconds(day.cardio)/60:null;break;
 case 'mobility':value=day?.recorded.includes('mobility')?Object.values(day.mobility.sets).filter(v=>v.done).length:null;break;
 case 'meals':value=day?.recorded.includes('meals')?day.meals.filter(m=>m.every(Boolean)).length:null;break;
 case 'water':value=day?.recorded.includes('water')?day.water.reduce((a,v)=>a+v,0):null;break;
 case 'sleep':value=day?.recovery.sleep??null;break;
 case 'recovery':value=day?.recovery.fatigue??null;break;
 }
 result.push({date,value,note});
 }return result;
}
export function cycleReport(data:AppData,cycleId:string) {
 const cycle=data.cycles.find(c=>c.id===cycleId);if(!cycle)return null;
 const end=addDays(cycle.start,83),days=data.days.filter(d=>d.id>=cycle.start&&d.id<=end),sessions=data.sessions.filter(s=>s.cycleId===cycleId);
 const first=sessions.filter(s=>s.week===1),last=sessions.filter(s=>s.week===12);
 const setCount=(items:typeof sessions)=>items.flatMap(s=>s.exercises.flatMap(e=>e.sets)).filter(s=>s.done).length;
 const waist=data.measurements.filter(m=>m.date>=cycle.start&&m.date<=end&&m.waist!==null).sort((a,b)=>a.date.localeCompare(b.date));
 return {confirmedWithoutDetails:days.filter(d=>Object.keys(d.declarations).length>0).length,skippedSets:sessions.flatMap(s=>s.exercises.flatMap(e=>e.sets)).filter(s=>s.skipped).length,start:cycle.start,end,week1Sets:setCount(first),week12Sets:setCount(last),firstWeight:weeklyWeight(data,addDays(cycle.start,6)),lastWeight:weeklyWeight(data,end),waistChange:waist.length>=2?waist.at(-1)!.waist!-waist[0].waist!:null,daysLogged:days.length,meals:days.filter(d=>d.recorded.includes('meals')).reduce((a,d)=>a+d.meals.filter(m=>m.every(Boolean)).length,0),waterDays:days.filter(d=>d.recorded.includes('water')&&d.water.every((v,i)=>v>=d.waterTargets[i])).length,cardioMinutes:days.filter(d=>d.recorded.includes('cardio')).reduce((a,d)=>a+timerSeconds(d.cardio)/60,0),mobilitySets:days.reduce((a,d)=>a+Object.values(d.mobility.sets).filter(s=>s.done).length,0),averageSleep:average(days.map(d=>d.recovery.sleep)),averageFatigue:average(days.map(d=>d.recovery.fatigue)),completedSessions:sessions.filter(s=>s.status==='complete').length,partialSessions:sessions.filter(s=>s.status==='partial').length};
}
function average(values:(number|null)[]){const present=values.filter((v):v is number=>v!==null);return present.length?present.reduce((a,v)=>a+v,0)/present.length:null;}
