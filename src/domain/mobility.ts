import type { AppData, MobilityExercise, MobilityProtocol, MobilitySequence, MobilitySession } from './model';

export const HIPER_KYPHOSIS_ID='hipercifose-parede';
// DADO PESSOAL: condição postural (hipercifose) e protocolo. Migrar para repositório privado (docs/PERSONAL_DATA_INVENTORY.md).
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
// Postura (26/11/2026, proprietário): sem cronômetro. Cada série é marcada pelo usuário.
// Cronômetros antigos ainda em andamento são encerrados preservando o tempo já registrado.
export function stopMobilityTimers(session:MobilitySession,clock=Date.now()):boolean {
 let changed=false;
 for(const ex of session.protocol?.exercises??[])if(session.sequences[ex.id]?.runningSince!=null){const s=session.sequences[ex.id],elapsed=sequenceProgress(ex,s,clock).elapsed;syncSequence(session,ex,clock);s.elapsed=elapsed;s.runningSince=null;changed=true;}
 for(const set of Object.values(session.sets))if(set.runningSince!==null){set.seconds+=Math.max(0,(clock-set.runningSince)/1000);set.runningSince=null;changed=true;}
 return changed;
}
export const mobilityTimersRunning=(session:MobilitySession)=>Object.values(session.sequences).some(s=>s.runningSince!=null)||Object.values(session.sets).some(s=>s.runningSince!==null);
// Marca ou desmarca uma série. Dados opcionais (dor, desconforto, observações) são preservados.
export function toggleMobilitySet(session:MobilitySession,ex:MobilityExercise,index:number,clock=Date.now()) {
 if(!session.protocol?.exercises.some(e=>e.id===ex.id))throw Error('Aplique o protocolo a este dia.');
 if(index<0||index>=ex.sets)throw Error('Série fora do protocolo.');
 stopMobilityTimers(session,clock);
 const key=`${ex.id}:${index}`,set=session.sets[key]??{done:false,seconds:0,runningSince:null,discomfort:null,pain:null,notes:''};
 set.done=!set.done;session.sets[key]=set;
}

// Alongamento diário: dias de hoje em diante sem protocolo (criados quando ele era só A1/B1/A2)
// recebem o protocolo vigente. Idempotente; dias passados e séries registradas não mudam.
export function activateMobility(data:AppData,date:string):boolean {
 let changed=false;
 for(const day of data.days)if(day.id>=date&&!day.mobility.protocol){day.mobility.protocol=currentMobilityProtocol(data.mobility);changed=true;}
 return changed;
}
