import { useState } from 'react';
import { Check, RotateCcw, Save } from 'lucide-react';
import { INFORMED_HORMONAL_PLAN, planForDay, registerHormonalDay } from '../domain/hormonal';
import { cycleForDate, schedule } from '../domain/training';
import { ensureDay, mutate } from '../storage/db';
import { now, today, uid } from '../domain/training';
import { PageTitle, CompletedTask, Panel, Field, formNumber, type PageProps } from './shared';
const weekdays=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
export function Hormonal({data,date,run,go}:PageProps) {
 const [week,setWeek]=useState(1),protocol=data.hormonalProtocol??INFORMED_HORMONAL_PLAN;
 const complete=!!data.days.find(day=>day.id===date)?.declarations.hormonal;
 const entries=protocol.entries.filter(e=>week>=e.fromWeek&&week<=e.toWeek);
 const totals=entries.reduce<Record<string,number>>((a,e)=>({...a,[e.substance]:(a[e.substance]??0)+e.doseMg*(e.frequency==='daily'?7:1)}),{});
 const weekday=new Date(date+'T12:00:00Z').getUTCDay(),[model,setModel]=useState(weekday===4?4:1),dayModel=weekday===1||weekday===4?weekday:model;
 const cycleWeek=schedule(cycleForDate(data,date),date).week??1,logWeek=Math.min(protocol.weeks,cycleWeek);
 const items=planForDay(protocol,dayModel,logWeek),logged=data.hormonalLogs.filter(l=>l.date===date);
 const pending=items.filter(e=>!logged.some(l=>l.entryId===e.id));
 const [edit,setEdit]=useState(false);
 const save=(doses:{entryId:string;doseMg:number}[])=>run(()=>mutate('Registrar aplicação do dia',date,d=>{d.hormonalProtocol??=structuredClone(INFORMED_HORMONAL_PLAN);if(date>today())throw Error('Use a data real, sem registrar administrações futuras.');registerHormonalDay(d,date,logWeek,doses,uid,now());ensureDay(d,date).declarations.hormonal={at:now(),note:'Aplicação do dia registrada.'};}),'Aplicação registrada.').then(ok=>{if(ok)setEdit(false);});
 return <><PageTitle eyebrow="SUA ROTINA" title="Registro hormonal" back={()=>go('home')}><p>Segunda e quinta, conforme o plano informado. Registro com um toque; edite só quando houver exceção.</p></PageTitle>
 <Panel className="hormonal-quick"><h2>{weekday===1||weekday===4?`${weekdays[weekday]} · aplicação do dia`:'Exceção · fora de segunda e quinta'}</h2>
  {!(weekday===1||weekday===4)&&<Field label="Modelo da aplicação"><select value={model} onChange={e=>setModel(Number(e.target.value))}><option value={1}>Modelo de segunda</option><option value={4}>Modelo de quinta</option></select></Field>}
  <ul className="dose-list">{items.map(e=>{const l=logged.find(v=>v.entryId===e.id);return <li key={e.id}><span>{e.substance}</span><strong className="num">{l?l.doseMg:e.doseMg} mg</strong>{l&&<Check size={16} aria-label="Registrado"/>}</li>;})}</ul>
  {date<=today()&&pending.length>0&&!edit&&<div className="button-row"><button className="primary completion-button" onClick={()=>save(pending.map(e=>({entryId:e.id,doseMg:e.doseMg})))}><Check size={20} aria-hidden="true"/>Registrar aplicação</button><button className="secondary" onClick={()=>setEdit(true)}>Ajustar doses</button></div>}
  {edit&&<form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void save(pending.filter(v=>f.get(`use-${v.id}`)==='on').map(v=>({entryId:v.id,doseMg:Number(String(f.get(`dose-${v.id}`)).replace(',','.'))})));}}>{pending.map(e=><div key={e.id} className="dose-edit"><label><input type="checkbox" name={`use-${e.id}`} defaultChecked/>{e.substance}</label><Field label={`${e.substance} (mg)`}><input name={`dose-${e.id}`} type="text" inputMode="decimal" defaultValue={e.doseMg} required/></Field></div>)}<div className="button-row"><button className="primary">Salvar aplicação</button><button type="button" className="secondary" onClick={()=>setEdit(false)}>Cancelar</button></div></form>}
  {pending.length===0&&items.length>0&&<p>Aplicação do dia registrada. Para corrigir, desfaça o item em Administrações registradas.</p>}
 </Panel>
 <Panel><p>{data.hormonalLogs.filter(log=>log.date===date).length} administração(ões) registrada(s) nesta data. Concluir o bloco fecha seu registro do dia, sem marcar doses automaticamente.</p>{date<=today()&&<button className={complete?"secondary":"primary completion-button"} onClick={()=>run(()=>mutate(complete?'Reabrir registro hormonal':'Concluir registro hormonal',date,d=>{const day=ensureDay(d,date);if(complete)delete day.declarations.hormonal;else day.declarations.hormonal={at:now(),note:'Registro do dia encerrado pelo usuário; não confirma doses ausentes.'};}),complete?'Registro reaberto.':'Registro do dia concluído.')}>{complete?<RotateCcw size={20} aria-hidden="true"/>:<Check size={20} aria-hidden="true"/>}{complete?'Reabrir registro do dia':'Concluir registro do dia'}</button>}</Panel>
 <CompletedTask done={complete} label="Registro hormonal"><Panel>
   <h3>{protocol.name} · {protocol.weeks} semanas</h3>
   <Field label="Semana do registro consultada"><select value={week} onChange={e=>setWeek(Number(e.target.value))}>{Array.from({length:protocol.weeks},(_,i)=><option key={i} value={i+1}>Semana {i+1}</option>)}</select></Field>
   <p>Esta seleção não define a semana atual do treino nem presume a data inicial do uso.</p>
   <details><summary>Ver plano informado e totais semanais</summary>{entries.map(e=><div key={e.id} className="history-item"><strong>{e.substance}</strong><span>{e.doseMg} mg · {e.frequency==='daily'?'Diariamente':e.weekday===null?'Segunda administração semanal · dia não informado':weekdays[e.weekday]}<br/>Semanas {e.fromWeek}–{e.toWeek} · encerramento informado ao final da semana {e.toWeek}</span></div>)}
   <h3>Totais semanais informados</h3><div className="volume-grid">{Object.entries(totals).map(([name,dose])=><div key={name}><span>{name}</span><strong>{dose} mg/semana</strong></div>)}</div>
   <p>Totais do registro declarado, não doses efetivamente administradas.</p></details>
   <details open><summary>Registrar administração realizada</summary><form key={`${date}:${week}`} onSubmit={e=>{
    e.preventDefault();const form=e.currentTarget,f=new FormData(form);
    void run(()=>mutate('Registrar administração hormonal','Informação fornecida pelo usuário',d=>{
     d.hormonalProtocol??=structuredClone(INFORMED_HORMONAL_PLAN);
     const selected=d.hormonalProtocol.entries.find(v=>v.id===f.get('entry')),actualDate=String(f.get('date'));
     if(!selected)throw Error('Selecione a substância.');if(actualDate>today())throw Error('Use a data real, sem registrar administrações futuras.');
     const dose=formNumber(f,'dose');if(dose===null||dose<=0)throw Error('Informe a quantidade realmente administrada.');
     delete ensureDay(d,actualDate).declarations.hormonal;
     d.hormonalLogs.push({id:uid(),date:actualDate,week,entryId:selected.id,substance:selected.substance,doseMg:dose,notes:String(f.get('notes')||''),at:now()});
    }),'Administração registrada localmente.').then(ok=>{if(ok)form.reset();});
   }}><Field label="Substância registrada"><select name="entry" required><option value="">Selecione</option>{protocol.entries.map(e=><option key={e.id} value={e.id}>{e.substance} · {e.frequency==='daily'?'oral diário':e.weekday===null?'segundo dia não informado':weekdays[e.weekday]}</option>)}</select></Field><div className="form-grid"><Field label="Data da administração"><input name="date" type="date" defaultValue={date} max={today()} required/></Field><Field label="Quantidade realmente administrada (mg)"><input name="dose" type="number" inputMode="decimal" min="0.01" max="10000" step="any" required/></Field></div><Field label="Observações da administração"><textarea name="notes" maxLength={5000}/></Field><button type="submit" className="secondary"><Save size={20} aria-hidden="true"/>Salvar administração realizada</button></form></details>
   <h3>Administrações registradas</h3>{data.hormonalLogs.length?data.hormonalLogs.map(log=><div key={log.id} className="history-item"><strong>{log.date} · {log.substance}</strong><span>{log.doseMg} mg · semana {log.week}<br/>{log.notes}<button className="text-button" onClick={()=>run(()=>mutate('Desfazer administração hormonal',log.id,d=>{d.hormonalLogs=d.hormonalLogs.filter(v=>v.id!==log.id);delete ensureDay(d,log.date).declarations.hormonal;}),'Registro desfeito; alteração mantida na auditoria local.')}>Desfazer registro</button></span></div>):<p>Nenhuma administração registrada.</p>}
 </Panel></CompletedTask></>;
}

