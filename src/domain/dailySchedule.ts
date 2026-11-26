import { DEFAULT_SCHEDULE, scheduleItemSchema, type AppSettings, type DailyLog, type ScheduleItem } from './model';
export { DEFAULT_SCHEDULE, scheduleItemSchema, type ScheduleItem };
import { addWater, editWater, waterConsumed } from './hydration';
import { setMealConsumed } from './nutrition';

// Rotina diária de alimentação e hidratação (26/11/2026, proprietário). Horário local
// (America/Sao_Paulo). Cada item tem horário, tipo (água/refeição), subtipo (líquida/sólida) e volume.
// O status do dia vem dos próprios registros (água em `hydration.entries`, refeição em `meals`):
// à meia-noite o novo dia começa pendente e os dias anteriores permanecem no histórico.
// Treino (26/11/2026): às 08:00 nos dias com sessão de musculação programada.
export const TRAINING_TIME='08:00';
// Cardio (26/11/2026): domingo às 09:00; nos demais dias às 10:00. A Refeição 2 fica 1h30 após o
// início do cardio (domingo 10:30; demais dias 11:30), inclusive nos dias sem cardio (mesma âncora).
export const CARDIO_TIMES=['09:00','10:00','10:00','10:00','10:00','10:00','10:00'] as const; // domingo..sábado
export const MEAL2_AFTER_CARDIO_MIN=90;
const weekday=(date:string)=>new Date(date+'T12:00:00Z').getUTCDay();
export const cardioTime=(date:string)=>CARDIO_TIMES[weekday(date)];
export const hhmm=(min:number)=>`${String(Math.floor(min/60)%24).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;
export const SCHEDULE_MEALS=4;
export const SCHEDULE_WATER_ML=4000;
// Refeições 1 e 3 são líquidas; 2 e 4, sólidas (plano alimentar de 26/11/2026, FOUR_MEAL_PLAN).
export const mealSubtype=(index:number)=>index%2===0?'Líquida':'Sólida';

export interface ScheduledEntry extends ScheduleItem {meal:number|null;subtype:'Líquida'|'Sólida'|null;label:string;done:boolean;at:string|null}
export const waterEntryId=(item:{id:string})=>`rotina:${item.id}`;

// Ordem cronológica; a n-ésima refeição do dia é a Refeição n do plano.
export function normalizeSchedule(items:ScheduleItem[]):ScheduleItem[]{
 const list=items.map(i=>scheduleItemSchema.parse({...i,ml:i.kind==='water'?i.ml:null})).sort((a,b)=>a.time.localeCompare(b.time)||a.id.localeCompare(b.id));
 if(list.filter(i=>i.kind==='meal').length!==SCHEDULE_MEALS)throw Error(`A rotina precisa de exatamente ${SCHEDULE_MEALS} refeições (plano alimentar fixo).`);
 if(list.some(i=>i.kind==='water'&&i.ml===null))throw Error('Informe o volume de cada horário de água.');
 if(new Set(list.map(i=>i.time)).size!==list.length)throw Error('Dois itens não podem ter o mesmo horário.');
 return list;
}
export const scheduleFor=(settings:Pick<AppSettings,'dailySchedule'>)=>normalizeSchedule(settings.dailySchedule??DEFAULT_SCHEDULE);
// Rotina de uma data: a Refeição 2 segue o horário do cardio do dia (+1h30). Água no mesmo horário
// passa para o meio do intervalo até o item seguinte (ex.: 11:30 → 12:15).
export function scheduleForDate(settings:Pick<AppSettings,'dailySchedule'>,date:string):ScheduleItem[]{
 const list=scheduleFor(settings).map(i=>({...i})),meal2=list.filter(i=>i.kind==='meal')[1];
 meal2.time=hhmm(minutesOf(cardioTime(date))+MEAL2_AFTER_CARDIO_MIN);
 const sorted=()=>list.sort((a,b)=>a.time.localeCompare(b.time)||(a.kind==='meal'?-1:1));sorted();
 for(let i=0;i<list.length;i++){const it=list[i];if(it!==meal2&&it.time===meal2.time&&it.kind==='water'){const after=list.slice(i+1).find(x=>x.time>meal2.time),limit=after?minutesOf(after.time):minutesOf(meal2.time)+90;it.time=hhmm(Math.floor((minutesOf(meal2.time)+limit)/2/5)*5);sorted();}}
 return list;
}

export function scheduleDay(settings:Pick<AppSettings,'dailySchedule'>,day:DailyLog|undefined,date=day?.id):ScheduledEntry[]{
 let n=0;
 return (date?scheduleForDate(settings,date):scheduleFor(settings)).map((item,i)=>{
  if(item.kind==='meal'){const index=n++,subtype=mealSubtype(index),done=!!day?.meals[index]?.every(Boolean);
   return {...item,meal:index,subtype,label:`Refeição ${index+1} – ${subtype}`,done,at:day?.mealTimes[index]??null};}
  const entry=day?.hydration?.entries.find(e=>e.id===waterEntryId(item));
  return {...item,meal:null,subtype:null,label:`Água · ${item.ml} ml${i===0?' (ao acordar)':''}`,done:!!entry,at:entry?.at??null};
 });
}
// Próximo item pendente, em ordem cronológica.
export const nextPending=(entries:ScheduledEntry[])=>entries.find(e=>!e.done)??null;
export function scheduleProgress(entries:ScheduledEntry[],day:DailyLog|undefined){
 const meals=entries.filter(e=>e.kind==='meal');
 return {waterMl:day?waterConsumed(day):0,waterGoal:SCHEDULE_WATER_ML,mealsDone:meals.filter(e=>e.done).length,mealsTotal:meals.length};
}
// Marca ou desmarca um item no dia. A água entra no registro de líquidos do dia; a refeição, no plano alimentar.
export function toggleScheduleItem(settings:Pick<AppSettings,'dailySchedule'>,day:DailyLog,itemId:string,at=new Date().toISOString()){
 const entry=scheduleDay(settings,day).find(e=>e.id===itemId);if(!entry)throw Error('Item fora da rotina.');
 if(entry.kind==='meal'){setMealConsumed(day,entry.meal!,!entry.done,at);return;}
 if(entry.done)editWater(day,waterEntryId(entry),0);else addWater(day,entry.ml!,waterEntryId(entry),at);
}
// Edição: horário, volume e tipo. Mantém 4 refeições; ids preservados para o histórico dos itens.
export function updateSchedule(settings:AppSettings,items:ScheduleItem[]){settings.dailySchedule=normalizeSchedule(items);}
export function minutesOf(t:string){const [h,m]=t.split(':').map(Number);return h*60+m;}
