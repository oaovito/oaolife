import type { AppData, PlannedExercise, RecoveryLog, WorkoutSession } from './model';
import { EXERCISES } from './plan';
import { nextExposure } from './training';
export interface ProgressionResult { eligible:boolean; next:number|null; reason:string }
export function evaluateProgression(ex:PlannedExercise,increment:number|undefined,recovery:RecoveryLog|undefined,deload:boolean,upcomingSets:number|null):ProgressionResult {
 const no=(reason:string):ProgressionResult=>({eligible:false,next:null,reason});
 if(deload)return no('Semana de recuperação: manter referência de carga, sem interpretar como regressão.');
 if(!ex.sets.every(s=>s.done))return no('Há séries não executadas. Repetir a referência.');
 if(ex.sets.some(s=>s.load===null||s.reps===null||s.rir===null||s.technique===null||s.range===null))return no('Complete carga, repetições, RIR, técnica e amplitude de cada série.');
 if(ex.sets.some(s=>!s.technique||!s.range))return no('Técnica ou amplitude inadequada: progressão suspensa.');
 if(ex.sets.some(s=>s.reps!<ex.reps[1]||s.rir!<ex.rir[0]))return no('Repetir carga: nem todas as séries atingiram o topo da faixa com RIR compatível.');
 const first=ex.sets[0];
 if(ex.sets.some(s=>s.load!==first.load||s.mode!==first.mode)||first.mode!==ex.mode)return no('Cargas ou modalidades diferentes entre séries: revisar antes de progredir.');
 if(!recovery||recovery.sleep===null||recovery.fatigue===null||recovery.soreness===null||recovery.pain===null)return no('Registre sono, fadiga, recuperação muscular e dor para avaliar a progressão.');
 if(recovery.symptoms)return no('Sintomas de alerta: interrompa o exercício e procure avaliação médica.');
 if(recovery.jointPain||recovery.pain>=4)return no('Dor articular ou relevante: suspender progressão e buscar avaliação.');
 if(recovery.sleep<6||recovery.fatigue>=7||recovery.soreness>=7)return no('Recuperação insuficiente: manter carga e revisar fadiga.');
 if(upcomingSets!==null&&upcomingSets>ex.sets.length)return no('A próxima exposição aumenta as séries. Manter carga para avaliar a recuperação.');
 if(increment===undefined)return no('Configure o incremento real disponível neste equipamento.');
 const current=first.load!;if(current<=0)return no('Defina uma carga de referência positiva.');
 const base=EXERCISES.find(e=>e.id===ex.id)!;
 if(!base.smallStep&&increment/current>0.050001)return no('O incremento disponível supera 5%. Mantenha a carga e revise o equipamento.');
 const next=Math.round((current+increment)*100)/100;
 return {eligible:true,next,reason:`Todas as ${ex.sets.length} séries alcançaram ${ex.reps[1]} repetições, com RIR ≥ ${ex.rir[0]}, técnica e amplitude adequadas. Recuperação registrada. Incremento configurado: ${increment} kg. Próxima referência: ${ex.reps[0]} repetições.`};
}
export function progressionFor(data:AppData,s:WorkoutSession,ex:PlannedExercise) {
 const next=nextExposure(data,s,ex.id);const recovery=data.days.find(d=>d.id===s.date)?.recovery;
 if(next&&(next.week===4||next.week===8))return {eligible:false,next:null,reason:'A próxima exposição está em uma semana de recuperação. Manter a referência de carga.'};
 return evaluateProgression(ex,data.settings.increments[ex.id],recovery,s.week===4||s.week===8,next?.sets??null);
}
export function recoveryInsights(data:AppData,date:string):{objective:string;hypothesis:string}[] {
 const result:{objective:string;hypothesis:string}[]=[];const r=data.days.find(d=>d.id===date)?.recovery;
 if(r?.symptoms)result.push({objective:'Sintomas cardiovasculares ou respiratórios de alerta registrados.',hypothesis:'Interrompa o exercício e procure avaliação médica. Não é possível determinar a causa pelo aplicativo.'});
 if(r?.jointPain)result.push({objective:'Dor articular registrada.',hypothesis:'Suspenda a progressão do movimento e procure avaliação, especialmente se a dor estiver progredindo.'});
 if(r&&(r.fatigue!==null&&r.fatigue>=7||r.soreness!==null&&r.soreness>=7))result.push({objective:'Fadiga ou desconforto muscular ≥ 7/10.',hypothesis:'Pode haver recuperação insuficiente. Revise descanso e técnica; considere reduzir séries dos inferiores entre C1 e C2 com confirmação.'});
 for(const ex of EXERCISES){const exposures=data.sessions.filter(s=>s.date<=date&&s.status!=='open'&&s.week!==4&&s.week!==8).sort((a,b)=>b.date.localeCompare(a.date)).map(s=>s.exercises.find(e=>e.id===ex.id)).filter((e):e is PlannedExercise=>!!e&&e.sets.some(s=>s.done&&s.load!==null&&s.reps!==null&&s.mode===ex.mode)).slice(0,3);if(exposures.length<2)continue;
 const score=(e:PlannedExercise)=>e.sets.filter(s=>s.done&&s.load!==null&&s.reps!==null&&s.mode===ex.mode).reduce((a,s)=>a+s.load!*s.reps!,0)/Math.max(1,e.sets.filter(s=>s.done&&s.load!==null&&s.reps!==null&&s.mode===ex.mode).length);
 if(exposures.length===3&&score(exposures[0])<score(exposures[1])&&score(exposures[1])<score(exposures[2]))result.push({objective:`${ex.name}: queda da carga × repetições por série em três exposições.`,hypothesis:'Revise técnica, descanso e fadiga. Mudanças de volume precisam de confirmação.'});
 else if(exposures.length===3&&score(exposures[0])===score(exposures[1])&&score(exposures[1])===score(exposures[2]))result.push({objective:`${ex.name}: desempenho semelhante em três exposições.`,hypothesis:'Revisar descanso, técnica e recuperação; não aumentar volume automaticamente.'});
 }
 return result;
}
