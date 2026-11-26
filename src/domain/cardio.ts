import type { AppData, CardioSession } from './model';
import { addDays } from './training';

// Domingo a sábado. Prescrição rígida definida pelo proprietário (26/11/2026):
// segunda, terça, quinta, sexta e domingo, 60 min cada (5 × 60 = 300 min/semana). Quarta e sábado sem cardio.
// Independente do reagendamento da musculação.
export const CARDIO_SESSION_MINUTES = 60;
export const CARDIO_MINUTES = [60,60,60,null,60,60,null] as const;
export const CARDIO_WEEKLY_MINUTES = CARDIO_MINUTES.reduce<number>((n,m)=>n+(m??0),0); // 300
export const CARDIO_DAY_NAMES = 'segunda, terça, quinta, sexta e domingo';
export function cardioTarget(date:string):number|null { return CARDIO_MINUTES[new Date(date+'T12:00:00Z').getUTCDay()]; }
export function cardioSeconds(c:CardioSession,clock=Date.now()) {
 return Math.max(0,Math.floor(c.elapsed+(c.runningSince===null?0:Math.max(0,clock-c.runningSince)/1000)));
}
// A velocidade mínima só se aplica à esteira; outras modalidades não ficam bloqueadas.
export function speedRuleMet(c:CardioSession) { return c.minimumSpeed===null||c.mode!=='Esteira'||(c.speed!==null&&c.speed>=c.minimumSpeed); }
export function cardioGoalReached(c:CardioSession,clock=Date.now()) {
 return c.planned!==null&&cardioSeconds(c,clock)>=c.planned*60&&speedRuleMet(c);
}
export function applyCardioPlan(c:CardioSession,date:string) {
 c.planned=cardioTarget(date);c.minimumSpeed=5;c.mode='Esteira';c.planVersion='weekly-360';
 if(c.runningSince===null)c.status=cardioGoalReached(c)?'complete':c.elapsed>0&&c.planned!==null?'partial':'idle';
}
export function weeklyCardio(data:AppData,date:string,clock=Date.now()) {
 const start=addDays(date,-((new Date(date+'T12:00:00Z').getUTCDay()+6)%7));
 const days=Array.from({length:7},(_,i)=>{
  const id=addDays(start,i),day=data.days.find(d=>d.id===id),planned=cardioTarget(id);
  const actual=day?cardioSeconds(day.cardio,clock)/60:0;
  return {date:id,planned,actual,credited:planned===null?0:Math.min(planned,actual),complete:planned!==null&&!!day&&cardioGoalReached(day.cardio,clock)};
 });
 // Prescrição rígida: só conta o tempo de cada dia programado, até a meta daquele dia.
 // Minutos extras ou em dias sem cardio ficam registrados (actual), mas não compensam outro dia.
 const actual=days.reduce((n,d)=>n+d.actual,0),credited=days.reduce((n,d)=>n+d.credited,0);
 const scheduled=days.filter(d=>d.planned!==null),done=scheduled.filter(d=>d.complete).length;
 return {start,end:addDays(start,6),planned:CARDIO_WEEKLY_MINUTES,actual,credited,remaining:Math.max(0,CARDIO_WEEKLY_MINUTES-credited),reached:done===scheduled.length,sessions:{done,total:scheduled.length},days};
}
