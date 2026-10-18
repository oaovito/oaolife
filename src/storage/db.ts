import Dexie, { type Table } from 'dexie';
import { appDataSchema, type AppData, type SyncOperation } from '../domain/model';
import { emptyData, makeDay, workoutComplete, summaries, pauseCardio, timedCompletionRequired } from '../domain/daily';
import { makeWorkout, now, today, uid, cycleForDate, schedule, daysBetween } from '../domain/training';
import { progressionFor } from '../domain/progression';
import { MEALS } from '../domain/plan';
import { cardioGoalReached } from '../domain/cardio';
import { pauseSequence, sequenceNeedsSync, syncSequence } from '../domain/mobility';
import { finishCardio } from '../domain/daily';
export interface StateRecord { id:'main'; revision:number; data:AppData }
export interface AuditChange { path:string; before:unknown; after:unknown }
export interface AuditRecord { id:string; at:string; revision:number; kind:string; detail:string; changes?:AuditChange[] }
function auditValue(value:unknown):unknown {if(typeof value==='string'&&value.startsWith('data:image/'))return `[imagem local: ${value.length} caracteres]`;if(Array.isArray(value))return value.map(auditValue);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,auditValue(v)]));return value??null;}
export function diffAudit(before:unknown,after:unknown,path=''):AuditChange[] {
 if(before===after)return [];
 if(before&&after&&typeof before==='object'&&typeof after==='object'&&Array.isArray(before)===Array.isArray(after)){const a=before as Record<string,unknown>,b=after as Record<string,unknown>;return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>diffAudit(a[k],b[k],path?`${path}.${k}`:k));}
 return [{path,before:auditValue(before),after:auditValue(after)}];
}
export class OaoDatabase extends Dexie {
 state!:Table<StateRecord,string>; audit!:Table<AuditRecord,string>; outbox!:Table<SyncOperation,string>;
 constructor(name='oaolife'){super(name);this.version(1).stores({state:'id',audit:'id,at,revision',outbox:'id,at,state'});this.version(2).stores({state:'id',audit:'id,at,revision,kind',outbox:'id,at,state,revision'});this.version(3).stores({state:'id',audit:'id,at,revision,kind',outbox:'id,at,state,revision'}).upgrade(async tx=>{const state=await tx.table('state').get('main');if(state){const data=appDataSchema.parse(state.data);assertIntegrity(data);await tx.table('state').put({...state,data});}});this.version(4).stores({state:'id',audit:'id,at,revision,kind',outbox:'id,at,state,revision'}).upgrade(async tx=>{const state=await tx.table('state').get('main');if(state){const data=appDataSchema.parse(state.data);assertIntegrity(data);await tx.table('state').put({...state,data});}});}
}
export const db=new OaoDatabase();
export function assertIntegrity(data:AppData) {
 for(const items of [data.cycles,data.sessions,data.days,data.measurements,data.photos,data.foods,data.recipes,data.decisions,data.adjustments,data.hormonalLogs]){const ids=items.map(x=>x.id);if(new Set(ids).size!==ids.length)throw Error('Backup contém IDs duplicados.');}
 const cycles=[...data.cycles].sort((a,b)=>a.start.localeCompare(b.start));
 for(let i=1;i<cycles.length;i++)if(daysBetween(cycles[i-1].start,cycles[i].start)<84)throw Error('Ciclos sobrepostos não são permitidos.');
 const cycleIds=new Set(data.cycles.map(c=>c.id));
 const dates=new Set<string>();for(const s of data.sessions){if(!cycleIds.has(s.cycleId))throw Error('Sessão sem ciclo válido.');const k=s.cycleId+':'+s.date;if(dates.has(k))throw Error('Sessão duplicada.');dates.add(k);if(cycleForDate(data,s.date)?.id!==s.cycleId)throw Error('Data da sessão fora do ciclo.');if(s.status==='complete'&&!workoutComplete(s))throw Error('Treino completo com séries pendentes.');if(new Set(s.exercises.map(e=>e.id)).size!==s.exercises.length)throw Error('Exercício duplicado na sessão.');for(const e of s.exercises){if(new Set(e.sets.map(v=>v.id)).size!==e.sets.length)throw Error('Série duplicada.');for(const v of e.sets){if(v.done&&v.skipped)throw Error('Série não pode ser feita e não realizada ao mesmo tempo.');if(v.done&&v.reps===0)throw Error('Repetições devem ser positivas ou não informadas.');}}}
 for(const d of data.days){if(d.cycleId&&!cycleIds.has(d.cycleId))throw Error('Registro diário sem ciclo.');if(d.meals.some((m,i)=>m.length!==MEALS[i].foods.length))throw Error('Quantidade de alimentos incompatível com o plano.');}
 for(const d of data.decisions)if(!data.sessions.some(s=>s.id===d.sessionId&&s.cycleId===d.cycleId&&s.exercises.some(e=>e.id===d.exerciseId)))throw Error('Progressão sem exposição válida.');
 for(const r of data.recipes)for(const i of r.ingredients)if(!data.foods.some(f=>f.id===i.foodId))throw Error('Receita referencia alimento ausente.');
}
export async function initialize(database=db) {
 await database.transaction('rw',database.state,async()=>{const saved=await database.state.get('main');if(!saved){await database.state.add({id:'main',revision:0,data:emptyData()});return;}const parsed=appDataSchema.parse(saved.data);assertIntegrity(parsed);if(JSON.stringify(parsed)!==JSON.stringify(saved.data))await database.state.put({...saved,data:parsed});});
}
export async function mutate(kind:string,detail:string,fn:(data:AppData)=>void,database=db) {
 return database.transaction('rw',database.state,database.audit,database.outbox,async()=>{
 const current=await database.state.get('main');if(!current)throw Error('Banco não inicializado.');
 const data=structuredClone(current.data);fn(data);const valid=appDataSchema.parse(data);assertIntegrity(valid);
 const revision=current.revision+1,id=uid(),at=now();await database.state.put({id:'main',revision,data:valid});
 await database.audit.add({id,at,revision,kind,detail,changes:diffAudit(current.data,valid)});
 await database.outbox.add({id,at,revision,state:'local-only',kind});return valid;
 });
}
export function ensureDay(data:AppData,date:string) { let day=data.days.find(d=>d.id===date);if(!day){day=makeDay(data,date);data.days.push(day);}return day; }
export function editDay(date:string,kind:string,fn:(d:ReturnType<typeof ensureDay>,data:AppData)=>void) {return mutate(kind,date,d=>{if(date>today())throw Error('Você está consultando uma data futura. Registre a execução na data real.');const day=ensureDay(d,date);fn(day,d);const k=kind.toLowerCase();const domain=k.includes('água')?'water':k.includes('alimento')||k.includes('refeição')?'meals':k.includes('cardio')?'cardio':k.includes('hipercifose')||k.includes('protocolo')?'mobility':k.includes('recuperação')?'recovery':null;if(domain&&!day.recorded.includes(domain))day.recorded.push(domain);if(domain&&domain!=='recovery')delete day.declarations[domain];});}
export function openWorkout(date:string) { return mutate('Abrir treino',date,d=>{if(date>today())throw Error('Use a data real para iniciar uma sessão.');const cycle=cycleForDate(d,date);if(d.sessions.some(s=>s.cycleId===cycle?.id&&s.date===date))return;const s=makeWorkout(d,date);if(!s)throw Error('Nenhum treino programado nesta data.');d.sessions.push(s);ensureDay(d,date);}); }
export function finishWorkout(id:string,partialReason='') {
 return mutate('Encerrar treino',id,d=>{const s=d.sessions.find(s=>s.id===id);if(!s)throw Error('Sessão não encontrada.');if(s.status!=='open')throw Error('Sessão já encerrada.');const complete=workoutComplete(s);if(!complete&&!partialReason.trim())throw Error('Informe o motivo do encerramento parcial.');
 s.status=complete?'complete':'partial';s.reason=partialReason.trim();s.closedAt=now();
 for(const ex of s.exercises){const result=progressionFor(d,s,ex);if(result.eligible){d.decisions.push({id:uid(),sessionId:id,cycleId:s.cycleId,exerciseId:ex.id,date:s.date,previous:ex.sets[0].load!,next:result.next!,mode:ex.mode,reason:result.reason,createdAt:now(),undoneAt:null});}}
 });
}
export function reopenWorkout(id:string) {return mutate('Reabrir treino para corrigir',id,d=>{const s=d.sessions.find(s=>s.id===id);if(!s)throw Error('Sessão não encontrada.');s.status='open';s.closedAt=null;for(const p of d.decisions.filter(p=>p.sessionId===id&&!p.undoneAt))p.undoneAt=now();});}
export function startCycle(start:string) {return mutate('Novo ciclo',start,d=>{for(const c of d.cycles)if(Math.abs(daysBetween(c.start,start))<84)throw Error('O ciclo se sobrepõe a outro. Escolha uma data após o fim do ciclo anterior.');d.cycles.push({id:uid(),start,originalVersion:'original-1',createdAt:now(),overrides:{}});});}
export async function requestPersistence() {return navigator.storage?.persist?await navigator.storage.persist():false;}
export function remoteStatus(online:boolean) {return online?'Modo local · backend remoto não configurado':'Offline · registros salvos neste dispositivo';}
export function dayPlan(data:AppData,date:string) {return schedule(cycleForDate(data,date),date);}

export function confirmDay(date:string) {
 return mutate('Confirmar dia sem detalhes',date,data=>{
  if(date>today())throw Error('Não é possível concluir uma data futura.');
  const day=ensureDay(data,date);
  for(const session of data.sessions.filter(s=>s.date===date&&s.status==='open')) {
   session.status=workoutComplete(session)?'complete':'partial';session.closedAt=now();
   session.reason='Dia confirmado pelo usuário; detalhes não registrados permanecem desconhecidos.';
  }
  if(day.cardio.runningSince!==null)pauseCardio(day.cardio);
  for(const ex of day.mobility.protocol?.exercises??[])if(day.mobility.sequences[ex.id]?.runningSince!=null)pauseSequence(day.mobility,ex);
  for(const set of Object.values(day.mobility.sets))if(set.runningSince!==null){set.seconds+=Math.max(0,(Date.now()-set.runningSince)/1000);set.runningSince=null;}
  const blocks=summaries(data,date);
  for(const key of ['workout','meals','water','cardio','mobility','hormonal'] as const)if(!timedCompletionRequired(day,key)&&blocks[key].status!=='Não programado'&&blocks[key].status!=='Concluído')day.declarations[key]={at:now(),note:'Dia confirmado pelo usuário sem detalhar a execução. Valores reais existentes preservados.'};
 });
}


// Recheck the persisted snapshot inside one transaction so two tabs cannot finish twice.
export async function reconcileTimers(clock=Date.now(),database=db) {
 return database.transaction('rw',database.state,database.audit,database.outbox,async()=>{
  const snapshot=await database.state.get('main');if(!snapshot)return;
  const needs=(day:AppData['days'][number])=>day.cardio.runningSince!==null&&cardioGoalReached(day.cardio,clock)||(day.mobility.protocol?.exercises??[]).some(ex=>sequenceNeedsSync(day.mobility,ex,clock));
  if(!snapshot.data.days.some(needs))return;
  await mutate('Atualizar cronômetros','Etapas concluídas pelo tempo decorrido',data=>{
   for(const day of data.days){
    if(day.cardio.runningSince!==null&&cardioGoalReached(day.cardio,clock))finishCardio(day.cardio,clock);
    for(const ex of day.mobility.protocol?.exercises??[])if(sequenceNeedsSync(day.mobility,ex,clock))syncSequence(day.mobility,ex,clock);
   }
  },database);
 });
}
