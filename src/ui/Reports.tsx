import { useState } from 'react';
import { Check, Minus, X } from 'lucide-react';
import { compareWeek, MODULE_LABELS, reportWeeks, streak, weekReport, weekStart, type ModuleKey, type WeekReport } from '../domain/weeklyReport';
import { cycleForDate, schedule } from '../domain/training';
import { WEEKS } from '../domain/plan';
import { nutritionTotals } from '../domain/nutrition';
import { CARDIO_SESSION_MINUTES, CARDIO_WEEKLY_MINUTES, CARDIO_DAY_NAMES } from '../domain/cardio';
import { HORMONAL_WEEKDAYS, makeDay } from '../domain/daily';
import { Empty, Metric, Panel, formatDate, type PageProps } from './shared';

const DAYS=['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
const fmt=(v:number|null,d=0)=>v===null?'—':v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const signed=(v:number|null,d=0)=>{if(v===null)return '—';const r=Number(v.toFixed(d));return `${r>0?'+':r<0?'−':'±'}${fmt(Math.abs(r),d)}`;};
const MODULES=Object.keys(MODULE_LABELS) as ModuleKey[];

// Barras diárias (uma série). Linha tracejada = meta. Ausência de registro ≠ zero: barra vazia com "—".
export function DayBars({values,target,label,unit,digits=0}:{values:(number|null)[];target?:number|null;label:string;unit:string;digits?:number}){
 const [hover,setHover]=useState<number|null>(null);
 const max=Math.max(1,target??0,...values.map(v=>v??0))*1.12,W=700,H=170,top=14,base=140,bw=60,step=W/7;
 const y=(v:number)=>base-(v/max)*(base-top);
 return <figure className="day-bars"><figcaption>{label}{target!=null&&target>0&&<span className="target-key"><i aria-hidden="true"/>meta {fmt(target,digits)} {unit}</span>}</figcaption>
  <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${values.map((v,i)=>`${DAYS[i]} ${fmt(v,digits)}`).join(', ')}${target?`; meta ${fmt(target,digits)} ${unit}`:''}`}>
   <line x1="0" x2={W} y1={base} y2={base} stroke="var(--line-strong,var(--border))"/>
   {values.map((v,i)=>{const x=i*step+(step-bw)/2,h=v===null?0:Math.max(v>0?3:0,base-y(v));return <g key={i} onPointerEnter={()=>setHover(i)} onPointerLeave={()=>setHover(null)}>
    <rect x={i*step} y={0} width={step} height={H} fill="transparent"/>
    {v!==null&&h>0&&<path d={`M${x} ${base} V${base-h+4} Q${x} ${base-h} ${x+4} ${base-h} H${x+bw-4} Q${x+bw} ${base-h} ${x+bw} ${base-h+4} V${base} Z`} fill="var(--signal)" opacity={hover===null||hover===i?1:.55}/>}
    <text x={x+bw/2} y={v===null?base-6:Math.max(top+10,base-h-6)} textAnchor="middle" fontSize="13" fill="var(--text)" className="num">{fmt(v,digits)}</text>
    <text x={x+bw/2} y={H-8} textAnchor="middle" fontSize="12" fill="var(--muted)">{DAYS[i]}</text>
   </g>;})}
   {target!=null&&target>0&&<><line x1="0" x2={W} y1={y(target)} y2={y(target)} stroke="var(--amber)" strokeDasharray="6 5" strokeWidth="1.5"/></>}
  </svg>
 </figure>;
}

// Tendência do cumprimento semanal ao longo de todo o histórico (uma série).
function TrendBars({weeks,selected}:{weeks:WeekReport[];selected:string}){
 const list=[...weeks].reverse().slice(-26),W=700,H=150,base=118,top=12,step=W/Math.max(list.length,1),bw=Math.min(36,step-4);
 if(!list.length)return null;
 return <figure className="day-bars"><figcaption>Cumprimento do plano por semana (%)</figcaption><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cumprimento por semana: ${list.map(w=>`${formatDate(w.start)} ${fmt(w.overall)}%`).join(', ')}`}>
  {[0,50,100].map(v=><g key={v}><line x1="28" x2={W} y1={base-(v/100)*(base-top)} y2={base-(v/100)*(base-top)} stroke="var(--border)" strokeDasharray={v?'2 4':undefined}/><text x="0" y={base-(v/100)*(base-top)+4} fontSize="11" fill="var(--muted)">{v}</text></g>)}
  {list.map((w,i)=>{const v=w.overall,h=v===null?0:Math.max(v>0?3:0,(v/100)*(base-top)),x=28+i*((W-28)/list.length)+((W-28)/list.length-bw)/2;return <g key={w.start}><title>{`${formatDate(w.start)} a ${formatDate(w.end)}: ${fmt(v)}%`}</title>{h>0&&<rect x={x} y={base-h} width={bw} height={h} rx="3" fill={w.start===selected?'var(--signal)':'var(--moss,#7d8c4f)'} opacity={w.start===selected?1:.6}/>}{w.start===selected&&<text x={x+bw/2} y={base-h-5} textAnchor="middle" fontSize="12" fill="var(--text)">{fmt(v)}%</text>}</g>;})}
  <text x="28" y={H-6} fontSize="11" fill="var(--muted)">{formatDate(list[0].start)}</text><text x={W} y={H-6} textAnchor="end" fontSize="11" fill="var(--muted)">{formatDate(list.at(-1)!.start)}</text>
 </svg></figure>;
}

function Mark({v}:{v:boolean|null}){return v===null?<span className="mark idle" aria-label="Não programado"><Minus size={14} aria-hidden="true"/></span>:v?<span className="mark ok" aria-label="Cumprido"><Check size={14} aria-hidden="true"/></span>:<span className="mark miss" aria-label="Não cumprido"><X size={14} aria-hidden="true"/></span>;}

function WeekDetail({weeks,index}:{weeks:WeekReport[];index:number}){
 const w=weeks[index],rows=compareWeek(weeks,index);
 return <>
  <Panel className="report-head"><span className="ops-tag">RELATÓRIO · {formatDate(w.start)} A {formatDate(w.end)}</span><div className="metric-grid">
   <Metric label="Cumprimento do plano" value={fmt(w.overall)} unit="%" emphasis/>
   <Metric label="Cardio cumprido" value={fmt(w.cardioMin)} unit={`/ ${CARDIO_WEEKLY_MINUTES} min`} emphasis/>
   <Metric label="Treinos" value={`${w.sessionsDone}/${w.sessionsPlanned}`} unit={`· ${w.setsDone} séries`}/>
   <Metric label="Peso de domingo" value={fmt(w.weight,1)} unit="kg"/>
  </div></Panel>
  <Panel><h2>Execução por módulo</h2><div className="adherence">{MODULES.map(k=>{const a=w.adherence[k],pct=a.scheduled?a.done/a.scheduled*100:null;return <div key={k} className="adherence-row"><span>{MODULE_LABELS[k]}</span><span className="adherence-track" role="img" aria-label={`${MODULE_LABELS[k]}: ${a.done} de ${a.scheduled}`}><i style={{width:`${pct??0}%`}}/></span><strong className="num">{a.done}/{a.scheduled}</strong></div>;})}</div>
   <div className="day-matrix" role="table" aria-label="Cumprimento por dia"><div role="row"><span role="columnheader"/>{DAYS.map(d=><span role="columnheader" key={d}>{d}</span>)}</div>{MODULES.map(k=><div role="row" key={k}><span role="rowheader">{MODULE_LABELS[k]}</span>{w.days.map(d=><span role="cell" key={d.date}><Mark v={d.done[k]}/></span>)}</div>)}</div>
  </Panel>
  <Panel><h2>Dia a dia</h2>
   <DayBars label="Calorias consumidas (kcal)" unit="kcal" values={w.days.map(d=>d.kcal)} target={w.calorieGoal}/>
   <DayBars label="Proteína consumida (g)" unit="g" values={w.days.map(d=>d.protein)} target={w.proteinGoal}/>
   <DayBars label="Água (ml)" unit="ml" values={w.days.map(d=>d.waterMl)} target={w.days[0].waterGoal}/>
   <DayBars label="Cardio (min)" unit="min" values={w.days.map(d=>d.cardioPlanned===null&&d.cardioMin===0?null:d.cardioMin)} target={CARDIO_SESSION_MINUTES}/>
   <DayBars label="Séries executadas" unit="séries" values={w.days.map(d=>d.setsPlanned?d.setsDone:null)}/>
  </Panel>
  <Panel><h2>Comparação</h2><div className="data-table"><table aria-label="Comparação semanal" className="compare-table"><thead><tr><th>Indicador</th><th>Semana</th><th>Anterior</th><th>Histórico*</th></tr></thead><tbody>{rows.map(r=><tr key={r.key}><th scope="row">{r.label}<small>{r.unit}</small></th><td className="num"><strong>{fmt(r.value,r.digits)}</strong></td><td className="num">{fmt(r.previous,r.digits)}<small>{signed(r.deltaPrev,r.digits)}</small></td><td className="num">{fmt(r.allTime,r.digits)}<small>{signed(r.deltaAll,r.digits)}</small></td></tr>)}</tbody></table></div>
   <TrendBars weeks={weeks} selected={w.start}/>
   <p className="hint">Ausência de registro não conta como zero. *Histórico = média das semanas com relatório liberado; no peso, o primeiro registro. Diferenças em relação à semana selecionada.</p>
  </Panel>
 </>;
}

export function WeeklyReports({data,date}:Pick<PageProps,'data'|'date'>){
 const weeks=reportWeeks(data,date).filter(w=>w.released);
 const [selected,setSelected]=useState(weeks[0]?.start??'');
 const current=weekReport(data,weekStart(date),date);
 if(!weeks.length)return <Empty>O primeiro relatório semanal é liberado depois do cardio de domingo. {current.released?'':`Semana atual: ${fmt(current.overall)}% cumprido até agora.`}</Empty>;
 const index=Math.max(0,weeks.findIndex(w=>w.start===selected));
 return <>
  {!current.released&&<Panel><p>O relatório da semana atual ({formatDate(current.start)} a {formatDate(current.end)}) é liberado depois do cardio de domingo. Até agora: <strong className="num">{fmt(current.overall)}%</strong> do plano cumprido.</p></Panel>}
  <Panel><label className="field"><span>Semana</span><select value={weeks[index].start} onChange={e=>setSelected(e.target.value)}>{weeks.map(w=><option key={w.start} value={w.start}>{formatDate(w.start)} a {formatDate(w.end)} · {fmt(w.overall)}%</option>)}</select></label></Panel>
  <WeekDetail weeks={weeks} index={index}/>
 </>;
}

// Situação atual do programa: o que está prescrito e como está sendo cumprido.
export function Overview({data,date}:Pick<PageProps,'data'|'date'>){
 const cycle=cycleForDate(data,date),plan=schedule(cycle,date),week=plan.week?WEEKS[plan.week-1]:null;
 const current=weekReport(data,weekStart(date),date),day=data.days.find(d=>d.id===date)??makeDay(data,date);
 const n=day.nutrition?.version==='four-meals-1'?day.nutrition:null,totals=nutritionTotals(day);
 const weights=data.measurements.filter(m=>m.weight!==null).sort((a,b)=>a.date.localeCompare(b.date)),last=weights.at(-1)??null,first=weights[0]??null;
 const policy={full:'integrais em todas as semanas','full-deload':'integrais, 55% nas semanas 4 e 8',periodized:'percentual semanal do ciclo'}[data.settings.setPolicy];
 const s=(k:ModuleKey)=>streak(data,k,date);
 return <>
  <Panel className="report-head"><span className="ops-tag">SITUAÇÃO ATUAL · {formatDate(date)}</span><div className="metric-grid">
   <Metric label="Semana em curso" value={fmt(current.overall)} unit="% cumprido" emphasis/>
   <Metric label="Ciclo" value={plan.week?`${plan.week}/12`:'—'} unit={week?`· ${week.goal}`:''} emphasis/>
  </div></Panel>
  <Panel><h2>Treino</h2><p>{cycle?<>Semana {plan.week??'—'} de 12{week?` · ${week.goal} · RIR ${week.rir.join('–')}`:''}. Séries: {policy}.</>:'Ciclo não configurado.'}</p><div className="metric-grid"><Metric label="Treinos na semana" value={`${current.sessionsDone}/${current.sessionsPlanned}`}/><Metric label="Séries na semana" value={fmt(current.setsDone)}/><Metric label="Sequência" value={fmt(s('workout'))} unit="treinos"/></div></Panel>
  <Panel><h2>Alimentação</h2><p>Plano de 4 refeições: {fmt(totals?.planned.kcal??null)} kcal e {fmt(totals?.planned.protein??null)} g de proteína por dia. Meta: {fmt(n?.calorieGoal??data.settings.calorieGoal)} kcal · {fmt(n?.proteinGoal??data.settings.proteinGoal)} g.</p><div className="metric-grid"><Metric label="Média na semana" value={fmt(current.kcalAvg)} unit="kcal"/><Metric label="Proteína média" value={fmt(current.proteinAvg)} unit="g"/><Metric label="Sequência" value={fmt(s('meals'))} unit="dias"/></div></Panel>
  <Panel><h2>Hidratação</h2><p>Meta diária de {fmt(data.settings.hydrationTarget)} ml.</p><div className="metric-grid"><Metric label="Média na semana" value={fmt(current.waterAvg)} unit="ml"/><Metric label="Dias cumpridos" value={`${current.adherence.water.done}/${current.adherence.water.scheduled}`}/><Metric label="Sequência" value={fmt(s('water'))} unit="dias"/></div></Panel>
  <Panel><h2>Cardio</h2><p>{CARDIO_DAY_NAMES}: {CARDIO_SESSION_MINUTES} min cada ({CARDIO_WEEKLY_MINUTES} min/semana).</p><div className="metric-grid"><Metric label="Cumprido na semana" value={fmt(current.cardioMin)} unit={`/ ${CARDIO_WEEKLY_MINUTES} min`}/><Metric label="Sessões" value={`${current.cardioSessions.done}/${current.cardioSessions.total}`}/><Metric label="Sequência" value={fmt(s('cardio'))} unit="sessões"/></div></Panel>
  <Panel><h2>Alongamento</h2><p>Hipercifose 4 × 60 s, todos os dias.</p><div className="metric-grid"><Metric label="Dias cumpridos" value={`${current.adherence.mobility.done}/${current.adherence.mobility.scheduled}`}/><Metric label="Sequência" value={fmt(s('mobility'))} unit="dias"/></div></Panel>
  <Panel><h2>Despertar 06:00</h2><p>Horário fixo de acordar, todos os dias.</p><div className="metric-grid"><Metric label="Dias cumpridos" value={`${current.adherence.despertar.done}/${current.adherence.despertar.scheduled}`}/><Metric label="Sequência" value={fmt(s('despertar'))} unit="dias"/></div></Panel>
  <Panel><h2>ManCare</h2><p>Barba aos domingos.</p><div className="metric-grid"><Metric label="Dias cumpridos" value={`${current.adherence.mancare.done}/${current.adherence.mancare.scheduled}`}/><Metric label="Sequência" value={fmt(s('mancare'))} unit="dias"/></div></Panel>
  <Panel><h2>Cuidado Casa</h2><p>Louça e lixo, todos os dias. Aspirador às terças e quintas. Roupa 1 e Roupa 2 às segundas, quartas e sextas.</p><div className="metric-grid"><Metric label="Dias cumpridos" value={`${current.adherence.casa.done}/${current.adherence.casa.scheduled}`}/><Metric label="Sequência" value={fmt(s('casa'))} unit="dias"/></div></Panel>
  <Panel><h2>Peso</h2><p>Pesagem aos domingos. Registro hormonal às {HORMONAL_WEEKDAYS.length===2?'segundas e quintas':''}.</p><div className="metric-grid"><Metric label="Último peso" value={fmt(last?.weight??null,1)} unit={last?`kg · ${formatDate(last.date)}`:'kg'}/><Metric label="Desde o início" value={signed(last&&first?last.weight!-first.weight!:null,1)} unit="kg"/></div></Panel>
 </>;
}
