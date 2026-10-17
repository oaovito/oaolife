import { ORIGINAL_PLAN, WEEKS } from './plan';
import type { AppData, Exercise, SessionName, TrainingCycle, WorkoutSession, PlannedExercise } from './model';
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export function today(timezone=Intl.DateTimeFormat().resolvedOptions().timeZone) { const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); return `${parts.find(p=>p.type==='year')!.value}-${parts.find(p=>p.type==='month')!.value}-${parts.find(p=>p.type==='day')!.value}`; }
export function addDays(date:string,n:number) { const d=new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
export function daysBetween(start:string,date:string) { return Math.round((+new Date(date+'T12:00:00Z')-+new Date(start+'T12:00:00Z'))/86400000); }
export function cycleForDate(data:AppData,date:string) { return [...data.cycles].sort((a,b)=>b.start.localeCompare(a.start)).find(c=>date>=c.start && daysBetween(c.start,date)<84); }
export const CALENDAR_REFERENCE = { date:'2026-10-17', template:'C2' as const, index:5 };
export function weeklyTemplate(date:string):SessionName|null {
 const names:SessionName[]=['A1','B1','C1','A2','B2','C2'];
 const index=((daysBetween(CALENDAR_REFERENCE.date,date)+CALENDAR_REFERENCE.index)%7+7)%7;
 return names[index]??null;
}
export function schedule(cycle:TrainingCycle|undefined,date:string):{template:SessionName|null;week:number|null;rest:boolean} {
 const diff=cycle?daysBetween(cycle.start,date):-1;
 const week=cycle&&diff>=0&&diff<84?Math.floor(diff/7)+1:null;
 const template=cycle&&Object.hasOwn(cycle.overrides,date)?cycle.overrides[date]:weeklyTemplate(date);
 return {template,week,rest:template===null};
}
// Distribui o orçamento inteiro da sessão pelo maior resto, preservando ao menos
// uma série por exercício e favorecendo prioridades quando há empate.
export function allocateSets(exercises:Exercise[],factor:number) {
 const target=Math.max(exercises.length,Math.round(exercises.reduce((a,e)=>a+e.sets,0)*factor));
 const counts=exercises.map(e=>Math.max(1,Math.floor(e.sets*factor)));
 const order=exercises.map((e,i)=>({i,rest:e.sets*factor-Math.floor(e.sets*factor),priority:e.priority?1:0})).sort((a,b)=>b.rest-a.rest||b.priority-a.priority||a.i-b.i);
 let remaining=target-counts.reduce((a,n)=>a+n,0);
 while(remaining>0){let moved=false;for(const {i} of order){if(remaining&&counts[i]<exercises[i].sets){counts[i]++;remaining--;moved=true;}}if(!moved)break;}
 return counts;
}
export function weeklyVolume(week:number) { const volumes:Record<string,number>={}; for(const t of ORIGINAL_PLAN){const counts=allocateSets(t.exercises,WEEKS[week-1].volume);t.exercises.forEach((e,i)=>{volumes[e.muscle]=(volumes[e.muscle]||0)+counts[i];});}return volumes; }
export function suggestedLoad(data:AppData,exercise:Exercise,date:string) {
 const decision=[...data.decisions].filter(d=>d.exerciseId===exercise.id&&d.date<date&&!d.undoneAt&&d.mode===exercise.mode).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt))[0];
 const lastSession=[...data.sessions].filter(s=>s.date<date&&s.exercises.some(e=>e.id===exercise.id&&e.sets.some(v=>v.done&&v.load!==null&&v.mode===exercise.mode))).sort((a,b)=>b.date.localeCompare(a.date))[0];
 if(decision&&(!lastSession||decision.date>=lastSession.date))return decision.next;
 const last=lastSession?.exercises.find(e=>e.id===exercise.id)?.sets.find(v=>v.done&&v.load!==null&&v.mode===exercise.mode);
 return last?.load??exercise.reference;
}
export function makeWorkout(data:AppData,date:string):WorkoutSession|null {
 const cycle=cycleForDate(data,date); const plan=schedule(cycle,date);if(!cycle||!plan.template||!plan.week)return null;
 const t=ORIGINAL_PLAN.find(t=>t.id===plan.template)!;const w=WEEKS[plan.week-1];const counts=allocateSets(t.exercises,w.volume);
 return {id:`${cycle.id}:${date}`,cycleId:cycle.id,date,timezone:data.settings.timezone,template:t.id,week:plan.week,volume:w.volume,status:'open',reason:'',startedAt:now(),closedAt:null,exercises:t.exercises.map((e,i):PlannedExercise=>({id:e.id,name:e.name,muscle:e.muscle,reps:[...e.reps],reference:e.reference,suggested:suggestedLoad(data,e,date),mode:e.mode,rir:[...w.rir],rest:e.fst?'30–45 s':e.compound?'2–3 min':'60–120 s',notes:e.notes||'',fst:!!e.fst,sets:Array.from({length:counts[i]},(_,j)=>({id:`${e.id}:${j}`,done:false,skipped:false,load:null,reps:null,rir:null,technique:null,range:null,notes:'',mode:e.mode}))}))};
}
export function nextExposure(data:AppData,s:WorkoutSession,id:string) {
 const c=data.cycles.find(c=>c.id===s.cycleId)!;
 for(let d=addDays(s.date,1);daysBetween(c.start,d)<84;d=addDays(d,1)){const p=schedule(c,d);if(!p.template||!p.week)continue;const t=ORIGINAL_PLAN.find(t=>t.id===p.template)!;const index=t.exercises.findIndex(e=>e.id===id);if(index>=0)return {date:d,sets:allocateSets(t.exercises,WEEKS[p.week-1].volume)[index],week:p.week};}
 return null;
}
export function reschedule(data:AppData,from:string,to:string) {
 const cycle=cycleForDate(data,from);if(!cycle||cycleForDate(data,to)?.id!==cycle.id)throw Error('Escolha duas datas do mesmo ciclo.');
 if(from===to)throw Error('Escolha outra data.');
 if(data.sessions.some(s=>s.cycleId===cycle.id&&(s.date===from||s.date===to)))throw Error('Uma dessas datas já tem sessão registrada. Preserve o histórico e escolha outra data.');
 const a=schedule(cycle,from).template,b=schedule(cycle,to).template;if(!a)throw Error('Não há treino nesta data.');
 cycle.overrides[from]=b;cycle.overrides[to]=a;
 data.adjustments.push({id:uid(),at:now(),kind:'Reagendamento',detail:`${a}: ${from} → ${to}; ${b||'descanso'}: ${to} → ${from}`});
}
