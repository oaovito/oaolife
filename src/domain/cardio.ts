import type { AppData, CardioSession } from './model';
import { addDays } from './training';

// Sunday through Saturday. The weekly plan is independent of strength rescheduling.
export const CARDIO_MINUTES = [60,60,60,30,60,60,30] as const;
export const CARDIO_WEEKLY_MINUTES = 360;
export function cardioTarget(date:string) { return CARDIO_MINUTES[new Date(date+'T12:00:00Z').getUTCDay()]; }
export function cardioSeconds(c:CardioSession,clock=Date.now()) {
 return Math.max(0,Math.floor(c.elapsed+(c.runningSince===null?0:Math.max(0,clock-c.runningSince)/1000)));
}
export function cardioGoalReached(c:CardioSession,clock=Date.now()) {
 return c.planned!==null&&cardioSeconds(c,clock)>=c.planned*60&&(c.minimumSpeed===null||(c.mode==='Esteira'&&c.speed!==null&&c.speed>=c.minimumSpeed));
}
export function applyCardioPlan(c:CardioSession,date:string) {
 c.planned=cardioTarget(date);c.minimumSpeed=5;c.mode='Esteira';c.planVersion='weekly-360';
 if(c.runningSince===null)c.status=cardioGoalReached(c)?'complete':c.elapsed>0?'partial':'idle';
}
export function weeklyCardio(data:AppData,date:string,clock=Date.now()) {
 const start=addDays(date,-((new Date(date+'T12:00:00Z').getUTCDay()+6)%7));
 const days=Array.from({length:7},(_,i)=>{
  const id=addDays(start,i),day=data.days.find(d=>d.id===id),planned=cardioTarget(id);
  const actual=day?cardioSeconds(day.cardio,clock)/60:0;
  return {date:id,planned,actual,credited:Math.min(planned,actual),complete:!!day&&cardioGoalReached(day.cardio,clock)};
 });
 return {start,end:addDays(start,6),planned:CARDIO_WEEKLY_MINUTES,actual:days.reduce((n,d)=>n+d.actual,0),credited:days.reduce((n,d)=>n+d.credited,0),days};
}
