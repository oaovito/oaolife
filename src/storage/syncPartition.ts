import type { AppData } from '../domain/model';
import type { AuditRecord } from './db';
import type { SyncOperation } from '../domain/model';

// Divide o estado em partes pequenas e estáveis: "core" (configurações, planos, ciclos),
// uma parte por data civil (dia, treino, medidas, registros hormonais, auditoria) e uma por foto.
// Assim cada sincronização envia só o que mudou, e o histórico remoto só cresce.

export type Outbox={id:string;at:string;revision:number;state:SyncOperation['state'];kind:string};
export interface Snapshot {data:AppData;audit:AuditRecord[];outbox:Outbox[]}
export interface Part {name:string;data:Record<string,unknown[]>|Partial<AppData>;audit?:AuditRecord[];outbox?:Outbox[]}

const BY_DATE={days:'id',sessions:'date',measurements:'date',hormonalLogs:'date',decisions:'date'} as const;
type DatedKey=keyof typeof BY_DATE;
const DATED=Object.keys(BY_DATE) as DatedKey[];

export function partition(s:Snapshot):Part[]{
 const core:Partial<AppData>={...s.data};for(const k of [...DATED,'photos'] as const)delete core[k];
 const parts=new Map<string,Part>();const day=(date:string)=>{const name=`day:${date}`;let p=parts.get(name);if(!p){p={name,data:{}};parts.set(name,p);}return p;};
 for(const key of DATED)for(const item of s.data[key] as unknown as Record<string,string>[]){const p=day(item[BY_DATE[key]]);((p.data as Record<string,unknown[]>)[key]??=[]).push(item);}
 for(const a of s.audit)(day(a.at.slice(0,10)).audit??=[]).push(a);
 for(const o of s.outbox)(day(o.at.slice(0,10)).outbox??=[]).push(o);
 const out:Part[]=[{name:'core',data:core},...[...parts.values()].sort((a,b)=>a.name.localeCompare(b.name))];
 for(const photo of s.data.photos)out.push({name:`photo:${photo.id}`,data:{photos:[photo]}});
 return out;
}

export function merge(parts:Part[]):Snapshot{
 const core=parts.find(p=>p.name==='core');if(!core)throw Error('Cópia na nuvem incompleta: configuração principal ausente. Nenhum dado foi alterado.');
 const data={...core.data,photos:[],...Object.fromEntries(DATED.map(k=>[k,[]]))} as unknown as AppData;const audit:AuditRecord[]=[],outbox:Outbox[]=[];
 for(const p of parts){if(p.name==='core')continue;for(const [k,items] of Object.entries(p.data))if(k in BY_DATE||k==='photos')(data[k as DatedKey|'photos'] as unknown[]).push(...(items as unknown[]));audit.push(...p.audit??[]);outbox.push(...p.outbox??[]);}
 const byDate=(key:string)=>(a:Record<string,string>,b:Record<string,string>)=>a[key].localeCompare(b[key]);
 for(const k of DATED)(data[k] as unknown as Record<string,string>[]).sort(byDate(BY_DATE[k]));
 audit.sort((a,b)=>a.revision-b.revision||a.at.localeCompare(b.at));outbox.sort((a,b)=>a.revision-b.revision||a.at.localeCompare(b.at));
 return {data,audit,outbox};
}
