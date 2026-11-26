import type { AppData } from './model';
import { addDays, cycleForDate, schedule } from './training';
import { summaries, timerSeconds } from './daily';
import { waterConsumed, waterGoal } from './hydration';
import { nutritionTotals } from './nutrition';
import { cardioGoalReached, weeklyCardio, CARDIO_WEEKLY_MINUTES } from './cardio';

// Relatório semanal (segunda a domingo). Liberado depois do cardio de domingo concluído,
// ou automaticamente quando a semana termina. Só usa registros reais: ausência ≠ zero.

export type ModuleKey='workout'|'meals'|'water'|'cardio'|'mobility';
export const MODULE_LABELS:Record<ModuleKey,string>={workout:'Treino',meals:'Alimentação',water:'Hidratação',cardio:'Cardio',mobility:'Alongamento'};
const MODULES=Object.keys(MODULE_LABELS) as ModuleKey[];

export interface DayLine {date:string;kcal:number|null;protein:number|null;waterMl:number|null;waterGoal:number;cardioMin:number;cardioPlanned:number|null;setsDone:number;setsPlanned:number;mobilityDone:boolean;done:Record<ModuleKey,boolean|null>}
export interface WeekReport {
 start:string;end:string;released:boolean;
 days:DayLine[];
 adherence:Record<ModuleKey,{done:number;scheduled:number}>;
 overall:number|null; // % das prescrições cumpridas na semana
 kcalAvg:number|null;proteinAvg:number|null;waterAvg:number|null;
 cardioMin:number;cardioSessions:{done:number;total:number};
 setsDone:number;setsPlanned:number;sessionsDone:number;sessionsPlanned:number;
 weight:number|null;weightDate:string|null;calorieGoal:number;proteinGoal:number;
}

export function weekStart(date:string){return addDays(date,-((new Date(date+'T12:00:00Z').getUTCDay()+6)%7));}
const avg=(values:(number|null)[])=>{const v=values.filter((n):n is number=>n!==null);return v.length?v.reduce((a,n)=>a+n,0)/v.length:null;};

export function reportReleased(data:AppData,start:string,today:string,clock=Date.now()){
 const sunday=addDays(start,6);if(today>sunday)return true;if(today<sunday)return false;
 const day=data.days.find(d=>d.id===sunday);return !!day&&cardioGoalReached(day.cardio,clock);
}

export function weekReport(data:AppData,start:string,today:string,clock=Date.now()):WeekReport {
 const days:DayLine[]=[];const adherence=Object.fromEntries(MODULES.map(k=>[k,{done:0,scheduled:0}])) as WeekReport['adherence'];
 let setsDone=0,setsPlanned=0,sessionsDone=0,sessionsPlanned=0;
 for(let i=0;i<7;i++){
  const date=addDays(start,i),day=data.days.find(d=>d.id===date),future=date>today;
  const blocks=summaries(data,date,clock);
  const done={} as DayLine['done'];
  for(const k of MODULES){const b=blocks[k];if(b.status==='Não programado'){done[k]=null;continue;}
   if(k==='workout'&&!schedule(cycleForDate(data,date),date).template){done[k]=null;continue;}
   if(future){done[k]=null;continue;}
   adherence[k].scheduled++;const ok=b.status==='Concluído';if(ok)adherence[k].done++;done[k]=ok;}
  const session=data.sessions.find(s=>s.date===date);
  const sd=session?session.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.done).length,0):0,sp=session?session.exercises.reduce((n,e)=>n+e.sets.length,0):0;
  setsDone+=sd;setsPlanned+=sp;if(done.workout!==null&&!future){sessionsPlanned++;if(session&&(session.status==='complete'||session.status==='partial'))sessionsDone++;}
  const totals=day?nutritionTotals(day):null,ate=!!day&&day.meals.some(m=>m.some(Boolean));
  days.push({date,kcal:ate?totals?.consumed.kcal??null:null,protein:ate?totals?.consumed.protein??null:null,waterMl:day?.hydration?waterConsumed(day):null,waterGoal:day?.hydration?waterGoal(day):data.settings.hydrationTarget,cardioMin:day?timerSeconds(day.cardio,clock)/60:0,cardioPlanned:day?day.cardio.planned:null,setsDone:sd,setsPlanned:sp,mobilityDone:done.mobility===true,done});
 }
 const scheduled=MODULES.reduce((n,k)=>n+adherence[k].scheduled,0),achieved=MODULES.reduce((n,k)=>n+adherence[k].done,0);
 const end=addDays(start,6),cardio=weeklyCardio(data,end,clock);
 const weighed=data.measurements.filter(m=>m.date>=start&&m.date<=end&&m.weight!==null).sort((a,b)=>a.date.localeCompare(b.date)).at(-1)??null;
 return {start,end,released:reportReleased(data,start,today,clock),days,adherence,overall:scheduled?achieved/scheduled*100:null,
  kcalAvg:avg(days.map(d=>d.kcal)),proteinAvg:avg(days.map(d=>d.protein)),waterAvg:avg(days.map(d=>d.waterMl)),
  cardioMin:cardio.credited,cardioSessions:cardio.sessions,setsDone,setsPlanned,sessionsDone,sessionsPlanned,
  weight:weighed?.weight??null,weightDate:weighed?.date??null,calorieGoal:data.settings.calorieGoal,proteinGoal:data.settings.proteinGoal};
}

// Semanas com algum registro, da primeira até a atual. Mais recente primeiro.
export function reportWeeks(data:AppData,today:string,clock=Date.now()):WeekReport[] {
 const ids=[...data.days.map(d=>d.id),...data.measurements.map(m=>m.date),...data.sessions.map(s=>s.date)].filter(d=>d<=today).sort();
 if(!ids.length)return [];
 const out:WeekReport[]=[];
 for(let s=weekStart(ids[0]);s<=weekStart(today)&&out.length<520;s=addDays(s,7))out.push(weekReport(data,s,today,clock));
 return out.reverse();
}

export type Comparable='overall'|'kcalAvg'|'proteinAvg'|'waterAvg'|'cardioMin'|'setsDone'|'weight';
export const COMPARABLE_LABELS:Record<Comparable,{label:string;unit:string;digits:number}>={
 overall:{label:'Cumprimento do plano',unit:'%',digits:0},kcalAvg:{label:'Calorias por dia',unit:'kcal',digits:0},proteinAvg:{label:'Proteína por dia',unit:'g',digits:0},
 waterAvg:{label:'Água por dia',unit:'ml',digits:0},cardioMin:{label:'Cardio cumprido',unit:`min / ${CARDIO_WEEKLY_MINUTES}`,digits:0},setsDone:{label:'Séries executadas',unit:'séries',digits:0},weight:{label:'Peso de domingo',unit:'kg',digits:1}};

// Compara uma semana com a anterior e com a média de todas as semanas liberadas (histórico).
export function compareWeek(weeks:WeekReport[],index:number){
 const current=weeks[index],previous=weeks[index+1]??null,released=weeks.filter(w=>w.released);
 const first=[...weeks].reverse().find(w=>w.weight!==null)??null;
 return (Object.keys(COMPARABLE_LABELS) as Comparable[]).map(key=>{
  const value=current[key],prev=previous?.[key]??null;
  const allTime=key==='weight'?(first?.weight??null):avg(released.map(w=>w[key]));
  return {key,...COMPARABLE_LABELS[key],value,previous:prev,allTime,allTimeLabel:key==='weight'?'Primeiro registro':'Média histórica',deltaPrev:value!==null&&prev!==null?value-prev:null,deltaAll:value!==null&&allTime!==null?value-allTime:null};
 });
}

// Sequência de dias consecutivos (até ontem, ou hoje se já concluído) com o módulo cumprido.
export function streak(data:AppData,key:ModuleKey,today:string,clock=Date.now()){
 let n=0,date=today;const todayDone=summaries(data,today,clock)[key].status==='Concluído';if(!todayDone)date=addDays(today,-1);
 for(let i=0;i<366;i++,date=addDays(date,-1)){const b=summaries(data,date,clock)[key];if(b.status==='Não programado')continue;if(b.status!=='Concluído'||!data.days.some(d=>d.id===date)&&key!=='workout')break;n++;}
 return n;
}

export const isSunday=(date:string)=>new Date(date+'T12:00:00Z').getUTCDay()===0;
// Pesagem de domingo: grava/corrige só o peso da data, preservando as demais medidas do dia.
export function recordWeight(data:AppData,date:string,weight:number,id:string){
 if(!Number.isFinite(weight)||weight<20||weight>400)throw Error('Informe um peso entre 20 e 400 kg.');
 const existing=data.measurements.find(m=>m.date===date);
 if(existing){existing.weight=Math.round(weight*10)/10;return existing;}
 const m={id,date,weight:Math.round(weight*10)/10,waist:null,systolic:null,diastolic:null,restingHR:null,body:'',notes:''};
 data.measurements.push(m);return m;
}

// Dias cumpridos integralmente: todos os blocos programados do dia concluídos no próprio dia.
// Conta desde 26/11/2026, sem limite, e não depende do plano atual (cada dia é avaliado pelo
// programa que valia nele). A sequência atual inclui hoje só se hoje já estiver completo.
export const PERFECT_SINCE='2026-11-26';
export function perfectDay(data:AppData,date:string,clock=Date.now()){
 if(!data.days.some(d=>d.id===date))return false;
 const blocks=Object.values(summaries(data,date,clock)).filter(b=>b.status!=='Não programado');
 return blocks.length>0&&blocks.every(b=>b.status==='Concluído');
}
export function perfectDays(data:AppData,today:string,clock=Date.now()){
 let total=0,streak=0,best=0;
 for(let date=PERFECT_SINCE;date<=today;date=addDays(date,1)){
  if(perfectDay(data,date,clock)){total++;streak++;best=Math.max(best,streak);}else if(date<today)streak=0;
 }
 return {total,streak,best};
}
