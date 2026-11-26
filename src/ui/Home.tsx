import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, ChevronRight, ClipboardList, Check, Dumbbell, Droplets, Footprints, Scale, Utensils, Wind } from 'lucide-react';
import { summaries, dayComplete, makeDay } from '../domain/daily';
import { cycleForDate, schedule, makeWorkout } from '../domain/training';
import { ORIGINAL_PLAN, WEEKS } from '../domain/plan';
import { nutritionTotals } from '../domain/nutrition';
import { waterConsumed, waterGoal } from '../domain/hydration';
import { weeklyCardio, CARDIO_WEEKLY_MINUTES } from '../domain/cardio';
import type { BlockKey, BlockSummary } from '../domain/model';
import { isSunday, perfectDays, recordWeight, reportReleased, weekStart } from '../domain/weeklyReport';
import { syncAlert, useSyncState } from './CloudSync';
import { rankFor } from '../domain/rank';
import { Promotion, RankCounter, usePromotion } from './RankBadge';
import { uid, today } from '../domain/training';
import { mutate } from '../storage/db';
import { Segments, type PageProps, type Page } from './shared';

export const PROGRESS_VIEW_KEY='oaolife:progress-view';
export function openReports(go:(p:Page)=>void,view:'reports'|'ranks'='reports'){try{sessionStorage.setItem(PROGRESS_VIEW_KEY,view);}catch{/* sem armazenamento: abre a visão padrão */}go('progress');}

function WeighIn({data,date,run}:Pick<PageProps,'data'|'date'|'run'>){
 const saved=data.measurements.find(m=>m.date===date&&m.weight!==null);const [edit,setEdit]=useState(false);
 if(saved&&!edit)return <section className="weigh-in" aria-label="Pesagem de domingo"><Scale size={18} aria-hidden="true"/><span className="ops-tag">PESAGEM DE DOMINGO</span><strong className="weigh-value">{saved.weight!.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}<span> kg</span></strong><button className="text-button" onClick={()=>setEdit(true)}>Corrigir</button></section>;
 return <form className="weigh-in" aria-label="Pesagem de domingo" onSubmit={e=>{e.preventDefault();const v=Number(String(new FormData(e.currentTarget).get('weight')).replace(',','.'));void run(()=>mutate('Pesagem de domingo',date,d=>{recordWeight(d,date,v,uid());}),'Peso registrado.').then(ok=>{if(ok)setEdit(false);});}}><Scale size={18} aria-hidden="true"/><label className="ops-tag" htmlFor="sunday-weight">PESAGEM DE DOMINGO</label><input id="sunday-weight" name="weight" type="text" inputMode="decimal" pattern="[0-9]{2,3}([,.][0-9])?" placeholder="kg" aria-label="Peso de domingo (kg)" defaultValue={saved?.weight?.toLocaleString('pt-BR')??''} required/><button className="primary">Registrar</button></form>;
}

type Module = { key:BlockKey; code:string; title:string; icon:typeof Dumbbell };
const MODULES:Module[]=[
 {key:'workout',code:'01',title:'Treino',icon:Dumbbell},
 {key:'meals',code:'02',title:'Alimentação',icon:Utensils},
 {key:'water',code:'03',title:'Hidratação',icon:Droplets},
 {key:'cardio',code:'04',title:'Cardio',icon:Footprints},
 {key:'mobility',code:'05',title:'Postura',icon:Wind},
 {key:'hormonal',code:'06',title:'Registro hormonal',icon:ClipboardList},
];
const int=(v:number)=>Math.round(v).toLocaleString('pt-BR');
const liters=(ml:number)=>(ml/1000).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:2});
type Figure={value:string;unit:string;detail:string;remaining:string;progress:number;max:number};
function state(b:BlockSummary){return b.status==='Concluído'?'done':b.status==='Não programado'?'idle':b.status==='Não iniciado'?'pending':b.status==='Pendente de revisão'?'review':'active';}

export function Home({data,date,go,run}:PageProps){
 const [showDone,setShowDone]=useState<string|null>(null);
 const blocks=summaries(data,date),day=data.days.find(d=>d.id===date)??makeDay(data,date);
 const cycle=cycleForDate(data,date),plan=schedule(cycle,date),template=ORIGINAL_PLAN.find(t=>t.id===plan.template);
 const session=data.sessions.find(s=>s.date===date&&s.cycleId===cycle?.id),preview=session?null:makeWorkout(data,date);
 const totals=nutritionTotals(day),goals=day.nutrition?.version==='four-meals-1'?day.nutrition:data.settings;
 const consumed=waterConsumed(day),target=waterGoal(day),week=weeklyCardio(data,date);
 const scheduled=MODULES.filter(m=>blocks[m.key].status!=='Não programado'),done=scheduled.filter(m=>blocks[m.key].status==='Concluído');
 const complete=dayComplete(blocks),next=scheduled.find(m=>blocks[m.key].status!=='Concluído');

 const figure=(key:BlockKey):Figure=>{
  const b=blocks[key];
  if(key==='workout'){
   if(!plan.template)return {value:'—',unit:'Descanso',detail:'Recuperação da musculação',remaining:'Sem séries hoje',progress:0,max:0};
   const sets=session?session.exercises.flatMap(e=>e.sets):[],total=session?sets.length:preview?preview.exercises.reduce((n,e)=>n+e.sets.length,0):template!.exercises.reduce((n,e)=>n+e.sets,0),made=sets.filter(s=>s.done).length,left=sets.length?sets.filter(s=>!s.done&&!s.skipped).length:total;
   const current=session?.exercises.find(e=>e.sets.some(s=>!s.done&&!s.skipped));
   return {value:`${made}`,unit:`/ ${total} séries`,detail:`${plan.template} · ${current?current.name:template!.title}`,remaining:b.status==='Concluído'?'Sessão encerrada':`Restam ${left} séries`,progress:made,max:total};
  }
  if(key==='meals'){
   const kcal=totals?.consumed.kcal??null,protein=totals?.consumed.protein??null,meals=day.meals.filter(m=>m.every(Boolean)).length;
   return {value:kcal===null?'—':int(kcal),unit:`/ ${int(goals.calorieGoal)} kcal`,detail:`Proteína ${protein===null?'—':int(protein)} / ${int(goals.proteinGoal)} g · ${meals}/${day.meals.length} refeições`,remaining:kcal===null?'Restante indisponível':kcal>=goals.calorieGoal?'Meta calórica atingida':`Faltam ${int(goals.calorieGoal-kcal)} kcal`,progress:kcal??0,max:goals.calorieGoal};
  }
  if(key==='water')return {value:liters(consumed),unit:`/ ${liters(target)} L`,detail:`${int(consumed)} ml registrados`,remaining:consumed>=target?'Meta do dia atingida':`Faltam ${int(target-consumed)} ml`,progress:consumed,max:target};
  if(key==='cardio'){const todayMin=day.cardio.elapsed/60+(day.cardio.runningSince?((Date.now()-day.cardio.runningSince)/60000):0),planned=day.cardio.planned;
   if(planned===null)return {value:'—',unit:'',detail:`Sem cardio hoje · semana ${int(week.credited)} / ${CARDIO_WEEKLY_MINUTES} min`,remaining:`${week.sessions.done}/${week.sessions.total} sessões`,progress:week.credited,max:CARDIO_WEEKLY_MINUTES};
   return {value:int(todayMin),unit:`/ ${planned} min`,detail:`Semana ${int(week.credited)} / ${CARDIO_WEEKLY_MINUTES} min · ${week.sessions.done}/${week.sessions.total} sessões`,remaining:b.status==='Concluído'?'Sessão de hoje cumprida':`Faltam ${int(Math.max(0,planned-todayMin))} min hoje`,progress:Math.min(todayMin,planned),max:planned};}
  if(key==='mobility')return b.status==='Não programado'?{value:'—',unit:'',detail:'Não programado hoje',remaining:'Sem pendências',progress:0,max:0}:{value:`${b.done}`,unit:`/ ${b.total} séries`,detail:'Hipercifose · 60 s por série',remaining:b.done>=b.total?'Protocolo concluído':`Restam ${b.total-b.done} séries`,progress:b.done,max:b.total};
  return {value:b.status==='Em andamento'||b.status==='Concluído'?'OK':'—',unit:'',detail:b.subtitle,remaining:b.status==='Concluído'?'Registrado':'Registro pendente',progress:b.status==='Concluído'?1:0,max:1};
 };

 const alerts:string[]=[],sync=useSyncState(),syncWarning=syncAlert(sync);
 const perfect=useMemo(()=>perfectDays(data,date),[data,date]),rank=useMemo(()=>rankFor(perfect.total),[perfect.total]);
 const {promotion,close:closePromotion}=usePromotion(rank,date===today());
 if(day.cardio.runningSince!==null)alerts.push('Cronômetro de cardio em andamento.');
 if(Object.values(day.mobility.sequences).some(s=>s.runningSince!==null))alerts.push('Sequência de postura em andamento.');

 const card=(m:Module)=>{const b=blocks[m.key],f=figure(m.key),Icon=m.icon,s=state(b);
  return <button key={m.key} className={`module module-${m.key}`} data-state={s} onClick={()=>go(m.key as Page)} aria-label={`${m.title}: ${b.status}. ${f.value} ${f.unit}. ${f.remaining}`}>
   <span className="module-head"><Icon size={16} aria-hidden="true"/><span className="module-code">{m.code}</span><span className="module-title">{m.title}</span><span className="module-status">{s==='done'&&<Check size={12} aria-hidden="true"/>}{b.status}</span></span>
   <span className="module-figure"><strong>{f.value}</strong>{f.unit&&<span>{f.unit}</span>}</span>
   <span className="module-detail">{f.detail}</span>
   <Segments value={f.progress} max={f.max} label={`Progresso de ${m.title}`}/>
   <span className="module-foot"><span>{f.remaining}</span><ChevronRight size={16} aria-hidden="true"/></span>
  </button>;};

 const open=showDone===date;
 return <div className="home-page command">
  <header className="ops-header"><span className="ops-tag">{new Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit',month:'short'}).format(new Date(date+'T12:00:00')).replace(/\./g,'')}{plan.template&&plan.week?` · Semana ${plan.week} · ${WEEKS[plan.week-1].goal} · RIR ${WEEKS[plan.week-1].rir.join('–')}`:plan.template?' · Configure a semana no Plano':''}</span><h1>{plan.template?<><span className="ops-code">{plan.template}</span> {template?.title}</>:'Descanso da musculação'}</h1></header>
  <RankCounter rank={rank} {...perfect} warning={syncWarning} onWarning={()=>go('settings')} onOpen={()=>openReports(go,'ranks')}/>
  {promotion&&<Promotion rank={promotion} day={promotion.startDay} onClose={closePromotion}/>}
  <section className="mission" aria-label="Situação do dia">
   <div className="mission-status"><span className="ops-tag">{complete?'MISSÃO CUMPRIDA':'STATUS DA MISSÃO'}</span><strong className="mission-count">{done.length}<span>/{scheduled.length}</span></strong><span className="mission-label">módulos concluídos</span></div>
   <div className="mission-track" aria-hidden="true">{scheduled.map(m=><i key={m.key} data-state={state(blocks[m.key])} title={m.title}/>)}</div>
   {next?<button className="primary next-action" onClick={()=>go(next.key as Page)}><span><small>PRÓXIMA AÇÃO</small>{next.title} · {figure(next.key).remaining}</span><ChevronRight size={20} aria-hidden="true"/></button>:<p className="mission-done"><Check size={18} aria-hidden="true"/>Missão do dia cumprida. Nada pendente.</p>}
  </section>
  {isSunday(date)&&<WeighIn data={data} date={date} run={run}/>}
  {reportReleased(data,weekStart(date),date)&&isSunday(date)&&<button className="secondary report-ready" onClick={()=>openReports(go)}><BarChart3 size={18} aria-hidden="true"/>Relatório da semana disponível<ChevronRight size={18} aria-hidden="true"/></button>}
  {alerts.length>0&&<ul className="alerts" aria-label="Alertas">{alerts.map(a=><li key={a}><AlertTriangle size={15} aria-hidden="true"/><span>{a}</span></li>)}</ul>}
  <div className="module-grid" id="daily-routine">{MODULES.filter(m=>blocks[m.key].status!=='Não programado'&&(open||blocks[m.key].status!=='Concluído')).map(card)}</div>
  {done.length>0&&<button className="secondary completed-toggle" aria-expanded={open} aria-controls="daily-routine" onClick={()=>setShowDone(open?null:date)}><Check size={16} aria-hidden="true"/>{open?'Ocultar módulos concluídos':`Concluídos (${done.length}) · ver e corrigir`}</button>}
 </div>;
}
