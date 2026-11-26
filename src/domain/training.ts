import { ORIGINAL_PLAN, WEEKS, TRAINING_PLAN_VERSION } from './plan';
import type { AppData, Exercise, SessionName, TrainingCycle, WorkoutSession, PlannedExercise } from './model';
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export function today(timezone=Intl.DateTimeFormat().resolvedOptions().timeZone) { const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); return `${parts.find(p=>p.type==='year')!.value}-${parts.find(p=>p.type==='month')!.value}-${parts.find(p=>p.type==='day')!.value}`; }
export function addDays(date:string,n:number) { const d=new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
export function daysBetween(start:string,date:string) { return Math.round((+new Date(date+'T12:00:00Z')-+new Date(start+'T12:00:00Z'))/86400000); }
export function cycleEnd(cycle:TrainingCycle) {return cycle.end??addDays(cycle.start,83);}
export function cycleForDate(data:AppData,date:string) { return [...data.cycles].sort((a,b)=>b.start.localeCompare(a.start)).find(c=>date>=c.start && date<=cycleEnd(c)); }
export const CALENDAR_REFERENCE = { date:'2026-10-17', template:'C2' as const, index:5 };
export function weeklyTemplate(date:string):SessionName|null {
 const names:SessionName[]=['A1','B1','C1','A2','B2','C2'];
 const index=((daysBetween(CALENDAR_REFERENCE.date,date)+CALENDAR_REFERENCE.index)%7+7)%7;
 return names[index]??null;
}
export function schedule(cycle:TrainingCycle|undefined,date:string):{template:SessionName|null;week:number|null;rest:boolean} {
 const diff=cycle?daysBetween(cycle.start,date):-1;
 const week=cycle&&diff>=0&&diff<84&&date<=cycleEnd(cycle)?Math.floor(diff/7)+1:null;
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
export type SetPolicy=AppData['settings']['setPolicy'];
// Fator aplicado ao número de séries prescrito. 'full' exibe exatamente as séries do
// plano em todas as semanas; a periodização continua a definir o RIR.
export function setFactor(policy:SetPolicy|undefined,week:number) {
 const volume=WEEKS[week-1].volume;
 if(policy==='periodized')return volume;
 if(policy==='full-deload')return week===4||week===8?volume:1;
 return 1;
}
export function weeklyVolume(week:number,policy:SetPolicy='full') { const volumes:Record<string,number>={}; for(const t of ORIGINAL_PLAN){const counts=allocateSets(t.exercises,setFactor(policy,week));t.exercises.forEach((e,i)=>{volumes[e.muscle]=(volumes[e.muscle]||0)+counts[i];});}return volumes; }
export function suggestedLoad(data:AppData,exercise:Exercise,date:string) {
 const decision=[...data.decisions].filter(d=>d.exerciseId===exercise.id&&d.date<date&&!d.undoneAt&&d.mode===exercise.mode).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt))[0];
 const lastSession=[...data.sessions].filter(s=>s.date<date&&s.exercises.some(e=>e.id===exercise.id&&e.sets.some(v=>v.done&&v.load!==null&&v.mode===exercise.mode))).sort((a,b)=>b.date.localeCompare(a.date))[0];
 if(decision&&(!lastSession||decision.date>=lastSession.date))return decision.next;
 const last=lastSession?.exercises.find(e=>e.id===exercise.id)?.sets.find(v=>v.done&&v.load!==null&&v.mode===exercise.mode);
 return last?.load??exercise.reference;
}
export function makeWorkout(data:AppData,date:string):WorkoutSession|null {
 const cycle=cycleForDate(data,date); const plan=schedule(cycle,date);if(!cycle||!plan.template||!plan.week)return null;
 const t=ORIGINAL_PLAN.find(t=>t.id===plan.template)!;const w=WEEKS[plan.week-1];const factor=setFactor(data.settings.setPolicy,plan.week);const counts=allocateSets(t.exercises,factor);
 return {id:`${cycle.id}:${date}`,cycleId:cycle.id,date,timezone:data.settings.timezone,template:t.id,week:plan.week,volume:factor,status:'open',reason:'',startedAt:now(),closedAt:null,exercises:t.exercises.map((e,i):PlannedExercise=>({id:e.id,name:e.name,muscle:e.muscle,reps:[...e.reps],reference:e.reference,suggested:suggestedLoad(data,e,date),mode:e.mode,rir:[...w.rir],rest:e.fst?'30–45 s':e.compound?'2–3 min':'60–120 s',notes:e.notes||'',fst:!!e.fst,sets:Array.from({length:counts[i]},(_,j)=>({id:`${e.id}:${j}`,done:false,skipped:false,load:null,reps:null,rir:null,technique:null,range:null,notes:'',mode:e.mode}))}))};
}
export function nextExposure(data:AppData,s:WorkoutSession,id:string) {
 const c=data.cycles.find(c=>c.id===s.cycleId)!;
 for(let d=addDays(s.date,1);d<=cycleEnd(c);d=addDays(d,1)){const p=schedule(c,d);if(!p.template||!p.week)continue;const t=ORIGINAL_PLAN.find(t=>t.id===p.template)!;const index=t.exercises.findIndex(e=>e.id===id);if(index>=0)return {date:d,sets:allocateSets(t.exercises,setFactor(data.settings.setPolicy,p.week))[index],week:p.week};}
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

const PREVIOUS_TRAINING_ANCHOR='2026-11-02';
function anchorPreviousTrainingCycle(data:AppData,date:string):boolean {
 const marker='training-anchor-2026-11-02';
 if(date<PREVIOUS_TRAINING_ANCHOR||data.adjustments.some(a=>a.id===marker))return false;
 const end=addDays(PREVIOUS_TRAINING_ANCHOR,83);
 const candidates=data.cycles.filter(c=>c.start>=PREVIOUS_TRAINING_ANCHOR&&c.start<=end).sort((a,b)=>a.start.localeCompare(b.start));
 const target=candidates[0]??{id:uid(),start:PREVIOUS_TRAINING_ANCHOR,originalVersion:'original-1' as const,createdAt:now(),overrides:{}};
 if(!candidates.length)data.cycles.push(target);
 for(const c of data.cycles){if(c.id!==target.id&&c.start<PREVIOUS_TRAINING_ANCHOR&&cycleEnd(c)>=PREVIOUS_TRAINING_ANCHOR){for(const [day,template] of Object.entries(c.overrides))if(day>=PREVIOUS_TRAINING_ANCHOR&&day<=end&&!Object.hasOwn(target.overrides,day))target.overrides[day]=template;c.end=addDays(PREVIOUS_TRAINING_ANCHOR,-1);}}
 target.start=PREVIOUS_TRAINING_ANCHOR;target.end=candidates[1]?addDays(candidates[1].start,-1):end;
 for(const s of data.sessions){if(s.date<PREVIOUS_TRAINING_ANCHOR||s.date>cycleEnd(target))continue;s.cycleId=target.id;
  if(s.date>=date&&s.status==='open'){
   reshapeOpenSession(data,s);
  }
 }
 for(const day of data.days)if(day.id>=PREVIOUS_TRAINING_ANCHOR&&day.id<=cycleEnd(target))day.cycleId=target.id;
 for(const decision of data.decisions){const s=data.sessions.find(s=>s.id===decision.sessionId);if(s)decision.cycleId=s.cycleId;}
 data.adjustments.push({id:marker,at:now(),kind:'Semana 1 em 02/11/2026',detail:'Periodização preservada; ciclo ancorado em 02/11/2026. Histórico de execução preservado.'});
 return true;
}

// A new explicit start does not rewrite the completed weeks before November 23.
export const TRAINING_ANCHOR='2026-11-23';
const TRAINING_MARKER='training-anchor-2026-11-23';
export function trainingAnchorPending(data:AppData,date:string) {
 return (date>=PREVIOUS_TRAINING_ANCHOR&&!data.adjustments.some(a=>a.id==='training-anchor-2026-11-02'))||(date>=TRAINING_ANCHOR&&!data.adjustments.some(a=>a.id===TRAINING_MARKER));
}
export function anchorTrainingCycle(data:AppData,date:string):boolean {
 const previousChanged=anchorPreviousTrainingCycle(data,date);
 if(date<TRAINING_ANCHOR||data.adjustments.some(a=>a.id===TRAINING_MARKER))return previousChanged;
 const future=data.cycles.filter(c=>c.start>TRAINING_ANCHOR).sort((a,b)=>a.start.localeCompare(b.start))[0];
 const end=future&&future.start<=addDays(TRAINING_ANCHOR,83)?addDays(future.start,-1):addDays(TRAINING_ANCHOR,83);
 const target=data.cycles.find(c=>c.start===TRAINING_ANCHOR)??{id:uid(),start:TRAINING_ANCHOR,originalVersion:'original-1' as const,createdAt:now(),overrides:{}};
 if(!data.cycles.includes(target))data.cycles.push(target);
 for(const c of data.cycles){if(c.id!==target.id&&c.start<TRAINING_ANCHOR&&cycleEnd(c)>=TRAINING_ANCHOR){
  for(const [day,template] of Object.entries(c.overrides))if(day>=TRAINING_ANCHOR&&day<=end&&!Object.hasOwn(target.overrides,day))target.overrides[day]=template;
  c.end=addDays(TRAINING_ANCHOR,-1);
 }}
 target.end=end;
 for(const session of data.sessions){
  if(session.date<TRAINING_ANCHOR||session.date>end)continue;
  session.cycleId=target.id;
  // Preserve closed sessions as executed. Open sessions, including Monday 23,
  // receive the new plan without removing any entered or completed set.
  if(session.status!=='open')continue;
  reshapeOpenSession(data,session);
 }
 for(const day of data.days)if(day.id>=TRAINING_ANCHOR&&day.id<=end)day.cycleId=target.id;
 for(const decision of data.decisions){const session=data.sessions.find(s=>s.id===decision.sessionId);if(session)decision.cycleId=session.cycleId;}
 data.adjustments.push({id:TRAINING_MARKER,at:now(),kind:'Semana 1 em 23/11/2026',detail:'Semana 1 com 75% do volume a partir de 23/11/2026. Séries registradas e sessões encerradas preservadas.'});
 return true;
}

// Ajusta uma sessão aberta ao planejamento vigente sem apagar séries com qualquer dado.
// Séries vazias excedentes são removidas; séries faltantes são acrescentadas.
export function reshapeOpenSession(data:AppData,session:WorkoutSession):boolean {
 if(session.status!=='open')return false;
 const planned=makeWorkout(data,session.date);if(!planned||planned.template!==session.template)return false;
 const before=JSON.stringify(session);
 session.week=planned.week;session.volume=planned.volume;
 for(const exercise of session.exercises){
  const next=planned.exercises.find(e=>e.id===exercise.id);if(!next)continue;exercise.rir=next.rir;
  const untouched=(v:typeof exercise.sets[number])=>!v.done&&!v.skipped&&v.load===null&&v.reps===null&&v.rir===null&&v.technique===null&&v.range===null&&!v.notes;
  while(exercise.sets.length>next.sets.length&&untouched(exercise.sets.at(-1)!))exercise.sets.pop();
  while(exercise.sets.length<next.sets.length){let index=exercise.sets.length;while(exercise.sets.some(v=>v.id===`${exercise.id}:${index}`))index++;exercise.sets.push({...next.sets[exercise.sets.length],id:`${exercise.id}:${index}`});}
 }
 return JSON.stringify(session)!==before;
}

// Mudança no plano de treino vale "no coração": sessões abertas a partir de `today` passam a seguir
// o plano vigente. Séries feitas ou puladas nunca são removidas; só séries vazias são ajustadas.
// Sessões concluídas/parciais e datas anteriores permanecem como foram executadas. Idempotente.
const emptySet=(v:WorkoutSession['exercises'][number]['sets'][number])=>!v.done&&!v.skipped&&v.load===null&&v.reps===null&&v.rir===null&&v.technique===null&&v.range===null&&!v.notes;
export function reconcileOpenSessions(data:AppData,today:string):boolean{
 let changed=false;
 for(const s of data.sessions){
  if(s.status!=='open'||s.date<today)continue;
  const fresh=makeWorkout(data,s.date);if(!fresh||fresh.template!==s.template)continue;
  const next:PlannedExercise[]=[];
  for(const f of fresh.exercises){
   const cur=s.exercises.find(e=>e.id===f.id);
   if(!cur){next.push(f);changed=true;continue;}
   const sets=[...cur.sets];
   while(sets.length>f.sets.length){let i=sets.length-1;while(i>=0&&!emptySet(sets[i]))i--;if(i<0)break;sets.splice(i,1);changed=true;}
   for(let j=sets.length;j<f.sets.length;j++){let id=`${f.id}:${j}`;let k=j;while(sets.some(v=>v.id===id))id=`${f.id}:${++k}`;sets.push({...f.sets[j],id});changed=true;}
   if(cur.name!==f.name||cur.reps.join()!==f.reps.join())changed=true;
   next.push({...cur,name:f.name,reps:[...f.reps],sets});
  }
  // Exercício que saiu do plano só permanece se já tiver séries registradas.
  for(const cur of s.exercises)if(!fresh.exercises.some(f=>f.id===cur.id)){if(cur.sets.some(v=>!emptySet(v)))next.push(cur);else changed=true;}
  if(next.map(e=>e.id).join()!==s.exercises.map(e=>e.id).join())changed=true;
  s.exercises=next;
 }
 const marker=`training-plan-${TRAINING_PLAN_VERSION}`;
 if(changed&&!data.adjustments.some(a=>a.id===marker))data.adjustments.push({id:marker,at:now(),kind:'Plano de treino atualizado',detail:`Plano ${TRAINING_PLAN_VERSION} aplicado às sessões abertas a partir de ${today}; séries registradas preservadas.`});
 return changed;
}
