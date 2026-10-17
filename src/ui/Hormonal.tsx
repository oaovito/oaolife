import { useState } from 'react';
import { hormonalImportSchema } from '../domain/model';
import { mutate } from '../storage/db';
import { now, today, uid } from '../domain/training';
import { Panel, Field, formNumber, type PageProps } from './shared';
const weekdays=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
export function Hormonal({data,date,run}:PageProps) {
 const [week,setWeek]=useState(1),protocol=data.hormonalProtocol;
 const entries=protocol?.entries.filter(e=>week>=e.fromWeek&&week<=e.toWeek)??[];
 const totals=entries.reduce<Record<string,number>>((a,e)=>({...a,[e.substance]:(a[e.substance]??0)+e.doseMg*(e.frequency==='daily'?7:1)}),{});
 return <Panel><details><summary>Registro hormonal</summary>
  <p>Registro pessoal informado por você. O plano declarado e as administrações realizadas são separados. Não há marcação automática nem orientação de dose; acompanhe o uso com o profissional responsável.</p>
  {!protocol?<><p>Importe o arquivo do seu registro. Ele será lido e salvo somente neste dispositivo.</p><Field label="Importar registro hormonal informado (.json)"><input type="file" accept="application/json,.json" onChange={e=>{
   const file=e.target.files?.[0];if(!file)return;
   void run(async()=>{if(file.size>100000)throw Error('Arquivo muito grande.');const value=hormonalImportSchema.parse(JSON.parse(await file.text()));await mutate('Importar registro hormonal','Protocolo informado; nenhuma administração confirmada',d=>{if(d.hormonalProtocol)throw Error('Já existe um registro hormonal neste dispositivo.');d.hormonalProtocol=value.protocol;});},'Registro informado importado. Nenhuma dose foi marcada como tomada.');e.target.value='';
  }}/></Field></>:<>
   <h3>{protocol.name} · {protocol.weeks} semanas</h3>
   <Field label="Semana do registro consultada"><select value={week} onChange={e=>setWeek(Number(e.target.value))}>{Array.from({length:protocol.weeks},(_,i)=><option key={i} value={i+1}>Semana {i+1}</option>)}</select></Field>
   <p>Esta seleção não define a semana atual do treino nem presume a data inicial do uso.</p>
   {entries.map(e=><div key={e.id} className="history-item"><strong>{e.substance}</strong><span>{e.doseMg} mg · {e.frequency==='daily'?'Diariamente':e.weekday===null?'Segunda administração semanal · dia não informado':weekdays[e.weekday]}<br/>Semanas {e.fromWeek}–{e.toWeek} · encerramento informado ao final da semana {e.toWeek}</span></div>)}
   <h3>Totais semanais informados</h3><div className="volume-grid">{Object.entries(totals).map(([name,dose])=><div key={name}><span>{name}</span><strong>{dose} mg/semana</strong></div>)}</div>
   <p>Totais do registro declarado, não doses efetivamente administradas.</p>
   <details><summary>Registrar administração realizada</summary><form key={`${date}:${week}`} onSubmit={e=>{
    e.preventDefault();const form=e.currentTarget,f=new FormData(form);
    void run(()=>mutate('Registrar administração hormonal','Informação fornecida pelo usuário',d=>{
     const selected=d.hormonalProtocol?.entries.find(v=>v.id===f.get('entry')),actualDate=String(f.get('date'));
     if(!selected)throw Error('Selecione a substância.');if(actualDate>today())throw Error('Use a data real, sem registrar administrações futuras.');
     const dose=formNumber(f,'dose');if(dose===null||dose<=0)throw Error('Informe a quantidade realmente administrada.');
     d.hormonalLogs.push({id:uid(),date:actualDate,week,entryId:selected.id,substance:selected.substance,doseMg:dose,notes:String(f.get('notes')||''),at:now()});
    }),'Administração registrada localmente.').then(ok=>{if(ok)form.reset();});
   }}><Field label="Substância registrada"><select name="entry" required><option value="">Selecione</option>{protocol.entries.map(e=><option key={e.id} value={e.id}>{e.substance} · {e.frequency==='daily'?'oral diário':e.weekday===null?'segundo dia não informado':weekdays[e.weekday]}</option>)}</select></Field><div className="form-grid"><Field label="Data da administração"><input name="date" type="date" defaultValue={date} max={today()} required/></Field><Field label="Quantidade realmente administrada (mg)"><input name="dose" type="number" inputMode="decimal" min="0.01" max="10000" step="any" required/></Field></div><Field label="Observações da administração"><textarea name="notes" maxLength={5000}/></Field><button type="submit" className="secondary">Salvar administração realizada</button></form></details>
   <h3>Administrações registradas</h3>{data.hormonalLogs.length?data.hormonalLogs.map(log=><div key={log.id} className="history-item"><strong>{log.date} · {log.substance}</strong><span>{log.doseMg} mg · semana {log.week}<br/>{log.notes}<button className="text-button" onClick={()=>run(()=>mutate('Desfazer administração hormonal',log.id,d=>{d.hormonalLogs=d.hormonalLogs.filter(v=>v.id!==log.id);}),'Registro desfeito; alteração mantida na auditoria local.')}>Desfazer registro</button></span></div>):<p>Nenhuma administração registrada.</p>}
  </>}
 </details></Panel>;
}
