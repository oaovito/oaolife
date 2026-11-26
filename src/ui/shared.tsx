import type { ReactNode } from 'react';
import { Check, ChevronLeft, SquareCheck, CheckCircle2 } from 'lucide-react';
import type { AppData } from '../domain/model';
export type Page='home'|'workout'|'meals'|'water'|'cardio'|'mobility'|'hormonal'|'plan'|'progress'|'settings';
export interface PageProps { data:AppData; date:string; run:(action:()=>Promise<unknown>,message?:string)=>Promise<boolean>; go:(page:Page)=>void }
export function Panel({children,className=''}:{children:ReactNode;className?:string}) {return <section className={`panel ${className}`}>{children}</section>;}
export function CompletedItems({children,count,label='Concluídos'}:{children:ReactNode;count:number;label?:string}) {
 return count>0?<details className="completed-items"><summary>{label} ({count}) · Ver e corrigir</summary>{children}</details>:null;
}
export function CompletedTask({children,done,label}:{children:ReactNode;done:boolean;label:string}) {
 return done?<details className="completed-items"><summary>{label} · Concluído · Corrigir</summary>{children}</details>:<>{children}</>;
}
export function PageTitle({eyebrow,title,children,back}:{eyebrow:string;title:string;children?:ReactNode;back?:()=>void}) {return <header className="page-title">{back&&<button className="back quiet" onClick={back}><ChevronLeft size={17}/> Hoje</button>}<p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children}</header>;}
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}) {return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;}
export function Empty({children}:{children:ReactNode}){return <div className="empty">{children}</div>;}
export function CheckButton({done,onClick,children,disabled=false}:{done:boolean;onClick:()=>void;children:ReactNode;disabled?:boolean}){return <button className={`check-row ${done?'checked':''}`} aria-pressed={done} onClick={onClick} disabled={disabled}>{done?<CheckCircle2 size={24} aria-hidden="true"/>:<SquareCheck size={24} aria-hidden="true"/>}<span>{children}</span>{done&&<Check className="check-end" size={16}/>}</button>;}
export function Progress({value,max=100,label}:{value:number;max?:number;label:string}){const n=max?Math.min(100,value/max*100):0;return <div className="progress" role="progressbar" aria-label={label} aria-valuenow={Math.round(n)} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${n}%`}}/></div>;}
export function NumberField({label,value,onChange,min=0,max=999,step='any',unit}:{label:string;value:number|null;onChange:(v:number|null)=>void;min?:number;max?:number;step?:string;unit?:string}) {return <Field label={label}><div className="input-unit"><input aria-label={label} type="number" inputMode="decimal" min={min} max={max} step={step} value={value??''} onChange={e=>{const v=e.target.value;onChange(v===''?null:Number(v));}}/>{unit&&<span>{unit}</span>}</div></Field>;}
export function formatDate(date:string,full=false){return new Intl.DateTimeFormat('pt-BR',full?{weekday:'long',day:'numeric',month:'long'}:{day:'2-digit',month:'short'}).format(new Date(date+'T12:00:00'));}
export function formatSeconds(seconds:number){const s=Math.floor(seconds);return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;}
export function formNumber(form:FormData,key:string){const value=String(form.get(key)||'').trim();return value===''?null:Number(value);}


export function Metric({label,value,unit,emphasis=false}:{label:string;value:ReactNode;unit?:string;emphasis?:boolean}) {
 return <div className={`metric ${emphasis?'metric-emphasis':''}`}><span className="metric-label">{label}</span><div className="metric-value"><strong>{value}</strong>{unit&&<span>{unit}</span>}</div></div>;
}
// Barra segmentada: leitura rápida de progresso em módulos táticos.
export function Segments({value,max,label,count=10}:{value:number;max:number;label:string;count?:number}) {
 const pct=max>0?Math.max(0,Math.min(100,value/max*100)):0,filled=Math.round(pct/100*count);
 return <span className="segments" role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>{Array.from({length:count},(_,i)=><i key={i} className={i<filled?'on':''}/>)}</span>;
}
