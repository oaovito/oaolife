import type { MobilityExercise, MobilityProtocol, MobilitySequence, MobilitySession } from './model';

export const HIPER_KYPHOSIS_ID='hipercifose-parede';
export const INFORMED_MOBILITY:MobilityProtocol={id:'hipercifose-60-60-v1',name:'Alongamento para hipercifose',days:['A1','B1','A2'],updatedAt:'2026-10-18T00:00:00.000Z',exercises:[{id:HIPER_KYPHOSIS_ID,name:'Alongamento para hipercifose',description:'Em pé, com os cotovelos na parede.',sets:4,reps:null,duration:60,rest:60,resistance:'',instructions:'4 séries de 60 segundos, com 60 segundos de descanso entre séries. Sem descanso após a quarta série.',image:''}]};
export function currentMobilityProtocol(saved:MobilityProtocol|null):MobilityProtocol {
 if(!saved)return structuredClone(INFORMED_MOBILITY);
 const result=structuredClone(saved);
 const matching=result.exercises.filter(e=>e.id===HIPER_KYPHOSIS_ID||/hipercifose/i.test(e.name));
 if(!matching.length)result.exercises.push(structuredClone(INFORMED_MOBILITY.exercises[0]));
 else for(const e of matching)Object.assign(e,{name:'Alongamento para hipercifose',description:'Em pé, com os cotovelos na parede.',sets:4,duration:60,rest:60,reps:null});
 return result;
}
export function sequenceTotal(ex:MobilityExercise) { return ex.sets*(ex.duration??0)+Math.max(0,ex.sets-1)*ex.rest; }
export function sequenceProgress(ex:MobilityExercise,s:MobilitySequence|undefined,clock=Date.now()) {
 const total=sequenceTotal(ex),elapsed=Math.min(total,Math.max(0,(s?.elapsed??0)+(s?.runningSince==null?0:Math.max(0,clock-s.runningSince)/1000)));
 const duration=ex.duration??0,span=duration+ex.rest;
 const complete=total>0&&elapsed>=total;
 const index=complete?ex.sets-1:Math.min(ex.sets-1,Math.floor(elapsed/Math.max(1,span)));
 const offset=elapsed-index*span,resting=!complete&&offset>=duration;
 const seconds=Array.from({length:ex.sets},(_,i)=>Math.min(duration,Math.max(0,elapsed-i*span)));
 return {elapsed,total,complete,index,resting,remaining:complete?0:Math.ceil((resting?span:duration)-offset),seconds,active:seconds.reduce((a,n)=>a+n,0),done:seconds.filter(n=>duration>0&&n>=duration).length};
}
export function syncSequence(session:MobilitySession,ex:MobilityExercise,clock=Date.now()) {
 const s=session.sequences[ex.id];if(!s)return;
 const p=sequenceProgress(ex,s,clock);
 for(let i=0;i<ex.sets;i++) {
  const key=`${ex.id}:${i}`,previous=session.sets[key];
  session.sets[key]={done:p.seconds[i]>=(ex.duration??Infinity),seconds:p.seconds[i],runningSince:null,discomfort:previous?.discomfort??null,pain:previous?.pain??null,notes:previous?.notes??''};
 }
 if(p.complete&&!s.completedAt){s.completedAt=new Date(s.runningSince===null?clock:s.runningSince+(p.total-s.elapsed)*1000).toISOString();s.elapsed=p.total;s.runningSince=null;}
}
export function startSequence(session:MobilitySession,ex:MobilityExercise,clock=Date.now()) {
 if(!ex.duration)throw Error('Defina a duração antes de iniciar a sequência.');
 if(Object.entries(session.sequences).some(([id,s])=>id!==ex.id&&s.runningSince!==null)||Object.values(session.sets).some(s=>s.runningSince!==null))throw Error('Pause o outro cronômetro de alongamento antes de iniciar.');
 const s=session.sequences[ex.id]??{elapsed:0,runningSince:null,completedAt:null};
 session.sequences[ex.id]=s;
 if(!s.completedAt&&s.runningSince===null)s.runningSince=clock;
 syncSequence(session,ex,clock);
}
export function pauseSequence(session:MobilitySession,ex:MobilityExercise,clock=Date.now()) {
 const s=session.sequences[ex.id];if(!s)return;
 const elapsed=sequenceProgress(ex,s,clock).elapsed;
 syncSequence(session,ex,clock);s.elapsed=elapsed;s.runningSince=null;
}
export function resetSequence(session:MobilitySession,ex:MobilityExercise) {
 session.sequences[ex.id]={elapsed:0,runningSince:null,completedAt:null};
 for(let i=0;i<ex.sets;i++)delete session.sets[`${ex.id}:${i}`];
}
export function sequenceNeedsSync(session:MobilitySession,ex:MobilityExercise,clock=Date.now()) {
 const s=session.sequences[ex.id];if(!s||s.runningSince===null)return false;
 const p=sequenceProgress(ex,s,clock);
 return p.complete||p.seconds.some((seconds,i)=>seconds>=(ex.duration??Infinity)&&!session.sets[`${ex.id}:${i}`]?.done);
}
