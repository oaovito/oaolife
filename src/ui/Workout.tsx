import { useState } from 'react';
import { Check, Copy, Dumbbell, History, Play, RotateCcw } from 'lucide-react';
import type { CompletedSet, PlannedExercise, WorkoutSession } from '../domain/model';
import { cycleForDate, schedule, makeWorkout, now } from '../domain/training';
import { ORIGINAL_PLAN, LOAD_LABEL, WEEKS } from '../domain/plan';
import { progressionFor } from '../domain/progression';
import { mutate, openWorkout, finishWorkout, reopenWorkout } from '../storage/db';
import { workoutComplete } from '../domain/daily';
import { PageTitle, Panel, Empty, Field, Progress, CompletedItems, type PageProps } from './shared';

function SetRow({value,exercise,session,previous,run,index,expanded}:{value:CompletedSet;exercise:PlannedExercise;session:WorkoutSession;previous:CompletedSet|undefined;run:PageProps['run'];index:number;expanded:boolean}) {
 const readonly=session.status!=='open';
 const update=(patch:Partial<CompletedSet>)=>run(()=>mutate('Editar série',`${session.date} · ${exercise.name} · ${index+1}`,data=>{
  const s=data.sessions.find(s=>s.id===session.id)!;
  if(s.status!=='open')throw Error('Reabra a sessão para corrigir os registros.');
  const set=s.exercises.find(e=>e.id===exercise.id)!.sets.find(v=>v.id===value.id)!;
  Object.assign(set,patch);
  const day=data.days.find(d=>d.id===s.date);if(day)delete day.declarations.workout;
 }));
 return <div className={`set-row ${value.done?'set-done':''}`}>
  <div className="set-heading"><strong>Série {index+1}</strong><span>{value.done?'Feita':value.skipped?'Não realizada':''}</span>
   {!readonly&&<div className="set-actions"><button className={`set-check ${value.done?'is-done':''}`} aria-pressed={value.done} aria-label={`Concluir série ${index+1} de ${exercise.name}`} onClick={()=>update({done:!value.done,skipped:false})}><Check size={16}/>{value.done?'Desfazer':'Concluir'}</button>
   <button className="quiet" aria-label={`Não realizar série ${index+1} de ${exercise.name}`} aria-pressed={value.skipped} onClick={()=>update({done:false,skipped:!value.skipped})}>{value.skipped?'Reabrir':'Não realizada'}</button></div>}
  </div>
  <details className="set-details" open={expanded}><summary>Detalhes opcionais da série {index+1}</summary>
   {previous&&<button className="quiet" disabled={readonly} aria-label={`Copiar série anterior para série ${index+1} de ${exercise.name}`} onClick={()=>update({load:previous.load,reps:previous.reps,rir:previous.rir,mode:previous.mode,technique:previous.technique,range:previous.range})}><Copy size={14}/> Copiar anterior</button>}
   <div className="set-inputs">{(['load','reps','rir'] as const).map(key=><Field key={key} label={key==='load'?'Carga (kg)':key==='reps'?'Repetições':'RIR real'}><input disabled={readonly} aria-label={`${key==='load'?'Carga':key==='reps'?'Repetições':'RIR'} série ${index+1} ${exercise.name}`} type="number" inputMode={key==='reps'?'numeric':'decimal'} min={key==='reps'?1:0} max={key==='load'?2000:key==='reps'?300:10} step={key==='reps'?'1':'any'} placeholder="Não informado" value={value[key]??''} onChange={e=>update({[key]:e.target.value===''?null:Number(e.target.value)})}/></Field>)}<Field label="Modalidade"><select disabled={readonly} value={value.mode} aria-label={`Modalidade série ${index+1} ${exercise.name}`} onChange={e=>update({mode:e.target.value as CompletedSet['mode']})}>{Object.entries(LOAD_LABEL).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></Field></div>
   <div className="set-quality">{(['technique','range'] as const).map(key=><Field key={key} label={key==='technique'?'Técnica':'Amplitude'}><select aria-label={`${key==='technique'?'Técnica':'Amplitude'} série ${index+1} ${exercise.name}`} disabled={readonly} value={value[key]===null?'':String(value[key])} onChange={e=>update({[key]:e.target.value===''?null:e.target.value==='true'})}><option value="">Não informada</option><option value="true">Adequada</option><option value="false">Precisa melhorar</option></select></Field>)}</div>
   <Field label={`Observações série ${index+1} ${exercise.name}`}><textarea disabled={readonly} maxLength={5000} value={value.notes} onChange={e=>update({notes:e.target.value})}/></Field>
  </details>
 </div>;
}

export function Workout({data,date,run,go}:PageProps) {
 const cycle=cycleForDate(data,date),plan=schedule(cycle,date);
 const session=data.sessions.find(s=>s.cycleId===cycle?.id&&s.date===date),preview=makeWorkout(data,date);
 const template=ORIGINAL_PLAN.find(t=>t.id===plan.template),[reason,setReason]=useState('');
 const sets=session?.exercises.flatMap(e=>e.sets)??[],done=sets.filter(s=>s.done).length,skipped=sets.filter(s=>s.skipped).length;
 const resolved=(ex:PlannedExercise)=>ex.sets.every(s=>s.done||s.skipped);
 const next=session?.exercises.find(ex=>!resolved(ex))?.id;
 const exerciseAction=(ex:PlannedExercise,action:'complete'|'skip')=>run(()=>mutate(action==='complete'?'Concluir exercício':'Não realizar exercício',`${date} · ${ex.name}`,d=>{
  const s=d.sessions.find(s=>s.id===session!.id)!;if(s.status!=='open')throw Error('Reabra a sessão para corrigir os registros.');
  const exercise=s.exercises.find(e=>e.id===ex.id)!;
  for(const value of exercise.sets)if(!value.done&&!value.skipped){value.done=action==='complete';value.skipped=action==='skip';}
  const day=d.days.find(d=>d.id===date);if(day)delete day.declarations.workout;
 }),'Exercício registrado. Detalhes não informados permanecem em branco.');
 const renderExercise=(ex:PlannedExercise,i:number)=>{
  const decision=progressionFor(data,session!,ex),finished=ex.sets.filter(s=>s.done||s.skipped),nextSet=ex.sets.find(s=>!s.done&&!s.skipped)?.id;
  const history=data.sessions.filter(s=>s.date<date).sort((a,b)=>b.date.localeCompare(a.date)).flatMap(s=>s.exercises.filter(e=>e.id===ex.id).map(e=>({date:s.date,exercise:e})));
  const last=history.flatMap(h=>h.exercise.sets).find(s=>s.done&&s.load!==null&&s.mode===ex.mode);
  return <Panel key={ex.id} className="exercise"><details className="exercise-disclosure" open={ex.id===next}>
   <summary><span className="exercise-number">{String(i+1).padStart(2,'0')}</span><span>{ex.name}<small>{ex.sets.filter(s=>s.done).length}/{ex.sets.length} séries feitas{ex.sets.some(s=>s.skipped)?' · execução parcial':''}</small></span></summary>
   <div className="exercise-meta prominent"><span><small>SÉRIES × REPS</small><strong>{ex.sets.length} × {ex.reps.join('–')}</strong></span><span><small>RIR</small><strong>{ex.rir.join('–')}</strong></span><span><small>DESCANSO</small><strong>{ex.rest}</strong></span></div>
   <div className="load-summary"><span>Referência <strong>{ex.reference??'A definir'}{ex.reference!==null?` ${LOAD_LABEL[ex.mode]}`:''}</strong></span><span>Sugerida <strong>{ex.suggested??'A definir'}{ex.suggested!==null?` ${LOAD_LABEL[ex.mode]}`:''}</strong></span><span>Última executada <strong>{last?.load??'Sem registro'}{last?` ${LOAD_LABEL[last.mode]}`:''}</strong></span></div>
   {ex.fst&&<p className="notice">FST-7 adaptado: até quatro séries, descanso de 30–45 s, sem séries extras.</p>}{ex.notes&&<p className="notice">{ex.notes}</p>}
   {session!.status==='open'&&!resolved(ex)&&<div className="button-row"><button className="primary" onClick={()=>exerciseAction(ex,'complete')}>Concluir exercício</button><button className="secondary" onClick={()=>exerciseAction(ex,'skip')}>Não realizar restantes</button></div>}
   {ex.sets.map((s,j)=>!s.done&&!s.skipped?<SetRow key={s.id} value={s} index={j} previous={ex.sets[j-1]} exercise={ex} session={session!} run={run} expanded={s.id===nextSet}/>:null)}
   <CompletedItems count={finished.length} label="Séries registradas">{ex.sets.map((s,j)=>s.done||s.skipped?<SetRow key={s.id} value={s} index={j} previous={ex.sets[j-1]} exercise={ex} session={session!} run={run} expanded={false}/>:null)}</CompletedItems>
   <details className="history"><summary><History size={15}/> Histórico e progressão</summary><p>{decision.reason}</p>
    {data.decisions.filter(d=>d.sessionId===session!.id&&d.exerciseId===ex.id&&!d.undoneAt).map(p=><div key={p.id} className="notice"><strong>Próxima exposição: {p.next} {LOAD_LABEL[p.mode]}</strong><p>{p.reason}</p><button className="secondary" onClick={()=>run(()=>mutate('Desfazer progressão',p.id,d=>{d.decisions.find(v=>v.id===p.id)!.undoneAt=now();}),'Progressão desfeita.')}>Desfazer</button></div>)}
    {history.length?history.slice(0,5).map(h=><div key={h.date} className="history-item"><strong>{h.date}</strong><span>{h.exercise.sets.filter(s=>s.done).map(s=>`${s.load===null?'Carga não informada':`${s.load} ${LOAD_LABEL[s.mode]}`} · ${s.reps??'—'} repetições · RIR ${s.rir??'—'}`).join(' / ')||'Sem séries executadas'}</span></div>):<p>Sem exposições anteriores registradas.</p>}
   </details>
  </details></Panel>;
 };
 return <><PageTitle eyebrow="TREINAMENTO" title={plan.template?`${plan.template} · ${template?.title}`:'Descanso'} back={()=>go('home')}><p>{plan.week?`Semana ${plan.week} · ${WEEKS[plan.week-1].goal}`:'Configure a semana da periodização para iniciar séries.'}</p></PageTitle>
  {!plan.template?<Empty>Hoje é dia de descanso.</Empty>:<>
   {!plan.week&&<Panel><h3>Qual é a sua semana no ciclo?</h3><button className="primary" onClick={()=>go('plan')}>Configurar periodização</button></Panel>}
   {!session&&<Panel><div className="section-heading"><h3>Planejamento {plan.week?'do dia':'original'}</h3><span>{preview?preview.exercises.reduce((n,e)=>n+e.sets.length,0):template!.exercises.reduce((n,e)=>n+e.sets,0)} séries</span></div><div className="plan-exercises">{(preview?.exercises||template!.exercises).map(e=><div key={e.id}><strong>{e.name}</strong><span>{Array.isArray(e.sets)?e.sets.length:e.sets} × {e.reps.join('–')} · {e.reference??'A definir'}{e.reference!==null?` ${LOAD_LABEL[e.mode]}`:''}</span></div>)}</div>{plan.week&&<button className="primary" onClick={()=>run(()=>openWorkout(date),'Treino aberto. Você pode concluir sem preencher detalhes opcionais.')}><Play size={17}/>Iniciar treino</button>}</Panel>}
   {session&&<><Panel><div className="section-heading"><strong>{session.status==='open'?'Sessão em andamento':session.status==='complete'?'Treino concluído':'Treino parcial'}</strong><span>{done}/{sets.length} séries</span></div><Progress value={done} max={sets.length} label="Séries executadas"/><p>{skipped>0?`${skipped} séries não realizadas. `:''}{session.reason||'Conclua séries ou exercícios com um toque. Os detalhes são opcionais; a progressão exige dados completos.'}</p>{session.status!=='open'&&<button className="secondary" onClick={()=>run(()=>reopenWorkout(session.id),'Sessão reaberta. As sugestões desta sessão foram desfeitas.')}><RotateCcw size={16}/> Corrigir registros</button>}</Panel>
    <div className="exercise-list">{session.exercises.map((ex,i)=>!resolved(ex)?renderExercise(ex,i):null)}</div>
    <CompletedItems count={session.exercises.filter(resolved).length} label="Exercícios registrados">{session.exercises.map((ex,i)=>resolved(ex)?renderExercise(ex,i):null)}</CompletedItems>
    {session.status==='open'&&<Panel><h3>{workoutComplete(session)?'Todas as séries registradas.':'Encerrar sessão'}</h3>{!workoutComplete(session)&&<Field label="Motivo do encerramento parcial"><textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={5000} placeholder="Opcional quando as séries restantes foram marcadas como não realizadas."/></Field>}<button className="primary" onClick={()=>run(()=>finishWorkout(session.id,reason||(!sets.some(s=>!s.done&&!s.skipped)?'Séries não realizadas indicadas pelo usuário.':'')),workoutComplete(session)?'Treino concluído.':'Treino encerrado como parcial. Apenas séries feitas foram contabilizadas.')}><Check size={17}/>{workoutComplete(session)?'Concluir treino':'Encerrar como parcial'}</button></Panel>}
   </>}
  </>}
 </>;
}
