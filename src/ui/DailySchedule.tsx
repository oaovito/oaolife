import { useState } from 'react';
import { Check, ChevronRight, Droplets, Dumbbell, Footprints, Pencil, Save, Utensils } from 'lucide-react';
import { makeDay, summaries } from '../domain/daily';
import { cycleForDate, schedule } from '../domain/training';
import { ORIGINAL_PLAN } from '../domain/plan';
import { cardioTarget } from '../domain/cardio';
import type { Page } from './shared';
import { TRAINING_TIME, cardioTime, scheduleDay, scheduleFor, scheduleProgress, toggleScheduleItem, updateSchedule, type ScheduleItem } from '../domain/dailySchedule';
import { editDay, mutate } from '../storage/db';
import { Field, Metric, PageTitle, Panel, Progress, type PageProps } from './shared';

const ml=(v:number)=>v.toLocaleString('pt-BR');
const clock=(iso:string|null)=>iso?new Date(iso).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'';

// Rotina do dia: lista cronológica de água e refeições, com destaque no próximo pendente.
export function DailySchedule({data,date,run,go}:PageProps){
 const day=data.days.find(d=>d.id===date)??makeDay(data,date),entries=scheduleDay(data.settings,day),p=scheduleProgress(entries,day);
 const plan=schedule(cycleForDate(data,date),date),template=ORIGINAL_PLAN.find(t=>t.id===plan.template);
 // Treino às 08:00 nos dias com musculação; concluído pela própria sessão de treino.
 // Cardio no horário do dia (domingo 09:00; demais 10:00), nos dias com cardio programado.
 const blocks=summaries(data,date),minutes=cardioTarget(date);
 const linked:{id:string;time:string;label:string;done:boolean;page:Page;icon:typeof Dumbbell}[]=[
  ...(template?[{id:'treino',time:TRAINING_TIME,label:`Treino ${template.id} · ${template.title}`,done:blocks.workout.status==='Concluído',page:'workout' as Page,icon:Dumbbell}]:[]),
  ...(minutes!==null?[{id:'cardio',time:cardioTime(date),label:`Cardio · ${minutes} min`,done:blocks.cardio.status==='Concluído',page:'cardio' as Page,icon:Footprints}]:[]),
 ];
 const rows=[...entries.map(e=>({...e,link:null as null|typeof linked[number]})),...linked.map(l=>({...l,link:l}))].sort((a,b)=>a.time.localeCompare(b.time));
 const next=rows.find(r=>!r.done)??null;
 const [editing,setEditing]=useState(false);
 return <><PageTitle eyebrow="ROTINA DO DIA" title="Alimentação e hidratação" back={()=>go('home')}><p>Horários fixos, todos os dias. Cada item é marcado no próprio dia; à meia-noite a rotina recomeça e os dias anteriores ficam no histórico.</p></PageTitle>
  <Panel className="schedule-progress"><div className="metric-grid" aria-live="polite"><Metric label="Água" value={ml(p.waterMl)} unit={`/ ${ml(p.waterGoal)} ml`} emphasis/><Metric label="Refeições" value={`${p.mealsDone}/${p.mealsTotal}`} emphasis/></div>
   <Progress value={p.waterMl} max={p.waterGoal} label="Água consumida no dia"/><Progress value={p.mealsDone} max={p.mealsTotal} label="Refeições concluídas no dia"/></Panel>
  <Panel><h2>Horários</h2><ol className="schedule-list">{rows.map(r=>{const isNext=next?.id===r.id;
   if(r.link){const L=r.link,Icon=L.icon;return <li key={r.id} className="schedule-item" data-kind={L.id==='treino'?'training':'cardio'} data-done={r.done} data-next={isNext||undefined}><time className="schedule-time">{r.time}</time><span className="schedule-label"><Icon size={16} aria-hidden="true"/><span>{r.label}{isNext&&<small className="schedule-next">PRÓXIMO</small>}{r.done&&<small>Concluído</small>}</span></span><button type="button" className={r.done?'secondary schedule-check is-done':'primary schedule-check'} aria-label={`${r.done?'Ver':'Abrir'} ${L.id==='treino'?'treino':'cardio'} ${r.time}`} onClick={()=>go(L.page)}>{r.done?<Check size={18} aria-hidden="true"/>:<ChevronRight size={18} aria-hidden="true"/>}<span>{r.done?'Ver':'Abrir'}</span></button></li>;}
   const e=entries.find(x=>x.id===r.id)!,Icon=e.kind==='water'?Droplets:Utensils;
   return <li key={e.id} className="schedule-item" data-kind={e.kind} data-done={e.done} data-next={isNext||undefined}>
    <time className="schedule-time">{e.time}</time>
    <span className="schedule-label"><Icon size={16} aria-hidden="true"/><span>{e.label}{isNext&&<small className="schedule-next">PRÓXIMO</small>}{e.done&&e.at&&<small>Registrado às {clock(e.at)}</small>}</span></span>
    <button type="button" className={e.done?'secondary schedule-check is-done':'primary schedule-check'} aria-pressed={e.done} aria-label={e.done?`Feito ${e.time} · ${e.label} (toque para desmarcar)`:`Concluir ${e.time} · ${e.label}`} onClick={()=>run(()=>editDay(date,e.kind==='water'?`Rotina: água ${e.time}`:`Rotina: refeição ${e.meal!+1}`,(d,all)=>toggleScheduleItem(all.settings,d,e.id)))}>{e.done?<Check size={18} aria-hidden="true"/>:<span className="routine-box" aria-hidden="true"/>}<span>{e.done?'Feito':'Concluir'}</span></button>
   </li>;})}</ol>
   {!next&&<p className="mission-done"><Check size={18} aria-hidden="true"/>Rotina do dia cumprida.</p>}</Panel>
  <Panel><div className="section-row"><h2>Editar rotina</h2><button className="secondary" aria-expanded={editing} onClick={()=>setEditing(!editing)}><Pencil size={16} aria-hidden="true"/>{editing?'Fechar':'Editar horários'}</button></div>
   {editing&&<ScheduleEditor items={scheduleFor(data.settings)} run={run} done={()=>setEditing(false)}/>}</Panel>
 </>;
}

function ScheduleEditor({items,run,done}:{items:ScheduleItem[];run:PageProps['run'];done:()=>void}){
 const [draft,setDraft]=useState(()=>structuredClone(items));
 const set=(i:number,patch:Partial<ScheduleItem>)=>setDraft(list=>list.map((item,j)=>j===i?{...item,...patch}:item));
 const waterTotal=draft.reduce((n,i)=>n+(i.kind==='water'?i.ml??0:0),0),meals=draft.filter(i=>i.kind==='meal').length;
 return <form className="schedule-editor" onSubmit={e=>{e.preventDefault();void run(()=>mutate('Editar rotina diária','Horário, volume e tipo dos itens',d=>updateSchedule(d.settings,draft)),'Rotina salva.').then(ok=>{if(ok)done();});}}>
  {draft.map((item,i)=><fieldset key={item.id} className="schedule-edit-row"><legend>Item {i+1}</legend>
   <Field label="Horário"><input type="time" required value={item.time} onChange={e=>set(i,{time:e.target.value})}/></Field>
   <Field label="Tipo"><select value={item.kind} onChange={e=>set(i,e.target.value==='water'?{kind:'water',ml:item.ml??500}:{kind:'meal',ml:null})}><option value="water">Água</option><option value="meal">Refeição</option></select></Field>
   {item.kind==='water'&&<Field label="Volume (ml)"><input type="number" inputMode="numeric" min={50} max={2000} step={50} required value={item.ml??''} onChange={e=>set(i,{ml:e.target.value===''?null:Number(e.target.value)})}/></Field>}
  </fieldset>)}
  <p>A Refeição 2 é às 11:30 todos os dias. Água marcada no mesmo horário passa para o intervalo seguinte (12:15).</p>
  <p className={meals!==4?'cardio-note':''}>Água programada: {ml(waterTotal)} ml · refeições: {meals}/4 (plano alimentar fixo: 2 líquidas e 2 sólidas, na ordem do dia).</p>
  <button className="primary" type="submit"><Save size={18} aria-hidden="true"/>Salvar rotina</button>
 </form>;
}
