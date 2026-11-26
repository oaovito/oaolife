import { useEffect, useState } from 'react';
import { CheckCircle2, Pause, Play, RotateCcw, X } from 'lucide-react';
import type { MobilityExercise, MobilitySession } from '../domain/model';
import { pauseSequence, resetSequence, sequenceProgress, startSequence } from '../domain/mobility';
import { editDay } from '../storage/db';
import { formatSeconds, Progress, type PageProps } from './shared';

export function MobilityTimer({exercise,session,date,run}:{exercise:MobilityExercise;session:MobilitySession;date:string;run:PageProps['run']}) {
 const sequence=session.sequences[exercise.id],running=sequence?.runningSince!=null;
 const [clock,setClock]=useState(Date.now()),[confirmReset,setConfirmReset]=useState(false);
 useEffect(()=>{setClock(Date.now());if(!running)return;const tick=()=>setClock(Date.now());const id=setInterval(tick,250);window.addEventListener('focus',tick);return()=>{clearInterval(id);window.removeEventListener('focus',tick);};},[running,sequence?.elapsed]);
 const p=sequenceProgress(exercise,sequence,clock);
 const change=(action:'start'|'pause'|'reset')=>{const at=Date.now();return run(()=>editDay(date,'Registrar sequência de hipercifose',day=>{
  const ex=day.mobility.protocol?.exercises.find(e=>e.id===exercise.id);if(!ex)throw Error('Aplique o protocolo a este dia antes de iniciar.');
  if(action==='start')startSequence(day.mobility,ex,at);else if(action==='pause')pauseSequence(day.mobility,ex,at);else resetSequence(day.mobility,ex);
 }));};
 return <section aria-label={`Sequência de ${exercise.name}`} className="timer-panel" data-phase={p.complete?'complete':p.resting?'rest':'active'}>
  <span className="eyebrow sequence-status">{p.complete&&<CheckCircle2 size={22} aria-hidden="true"/>}{p.complete?'SEQUÊNCIA CONCLUÍDA':p.resting?'Descansando':'Alongando'}</span>
  <h3>Série {p.index+1}/{exercise.sets}</h3>
  <div className="timer" role="timer" aria-label="Tempo restante da etapa">{formatSeconds(p.remaining)}</div>
  <p>{p.done}/{exercise.sets} séries concluídas · {formatSeconds(p.active)} de {formatSeconds(exercise.sets*(exercise.duration??0))} ativos</p>
  <Progress value={p.elapsed} max={p.total} label="Progresso da sequência"/>
  <p>{formatSeconds(p.elapsed)} / {formatSeconds(p.total)} · {Math.floor(p.elapsed/p.total*100)}%</p>
  <div className="button-row">{!p.complete&&<button className={running?"pause-button":"primary"} onClick={()=>void change(running?'pause':'start')}>{running?<Pause size={20} aria-hidden="true"/>:<Play size={20} aria-hidden="true"/>}{running?'Pausar sequência':p.elapsed?'Continuar sequência':'Iniciar sequência'}</button>}
   {p.elapsed>0&&!confirmReset&&<button className="danger" onClick={()=>setConfirmReset(true)}><RotateCcw size={20} aria-hidden="true"/>Reiniciar sequência</button>}</div>
  {confirmReset&&<div role="group" aria-label="Confirmar reinício"><p>Reiniciar apaga o progresso desta sequência neste dia. Confirmar?</p><div className="button-row"><button className="secondary" onClick={()=>setConfirmReset(false)}><X size={20} aria-hidden="true"/>Cancelar</button><button className="danger" onClick={()=>void change('reset').then(ok=>{if(ok)setConfirmReset(false);})}><RotateCcw size={20} aria-hidden="true"/>Confirmar reinício</button></div></div>}
 </section>;
}
