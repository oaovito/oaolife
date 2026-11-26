import { db } from './db';
import { decodeBackupPayload, restoreBackup } from './backup';
import { now } from '../domain/training';
import { merge, partition, type Part } from './syncPartition';

// Sincronização automática criptografada (cópia no GitHub via /api/sync).
// O código de recuperação (160 bits aleatórios) gera, por SHA-256, o identificador enviado ao
// servidor, a chave AES-GCM e o sal dos nomes de arquivo. A chave nunca sai do aparelho.
// Arquivo: [versão=1][IV 12 bytes][AES-GCM(gzip(JSON da parte))].

const CODE_KEY='oaolife-sync-code',STATE_KEY='oaolife-sync-state',HASH_KEY='oaolife-sync-hashes',REQUEST_BYTES=3_500_000,ALPHABET='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export interface SyncState {lastSyncAt:string|null;syncedRevision:number;error:string|null;photosExcluded:number}
const blank:SyncState={lastSyncAt:null,syncedRevision:-1,error:null,photosExcluded:0};
const read=<T,>(k:string,fallback:T):T=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v) as T:fallback;}catch{return fallback;}};
const write=(k:string,v:unknown)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{/* armazenamento indisponível */}};
const listeners=new Set<()=>void>();
export const onSyncChange=(fn:()=>void)=>{listeners.add(fn);return ()=>{listeners.delete(fn);};};
export const syncState=():SyncState=>({...blank,...read<Partial<SyncState>>(STATE_KEY,{})});
function setState(patch:Partial<SyncState>){write(STATE_KEY,{...syncState(),...patch});listeners.forEach(f=>f());}

export function generateCode(){const b=crypto.getRandomValues(new Uint8Array(20));let bits=0,value=0,out='';for(const byte of b){value=(value<<8|byte)&0xffff;bits+=8;while(bits>=5){out+=ALPHABET[value>>>bits-5&31];bits-=5;}}return out.match(/.{4}/g)!.join('-');}
export function normalizeCode(input:string){const c=input.toUpperCase().replace(/[^0-9A-Z]/g,'').replace(/O/g,'0').replace(/[IL]/g,'1');if(c.length!==32||[...c].some(ch=>!ALPHABET.includes(ch)))throw Error('Código de recuperação inválido: confira os 32 caracteres.');return c.match(/.{4}/g)!.join('-');}
export const syncCode=()=>read<string|null>(CODE_KEY,null);
export function ensureCode(){let c=syncCode();if(!c){c=generateCode();write(CODE_KEY,c);}return c;}

const hex=(b:Uint8Array)=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
async function digest(text:string){return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));}
export async function deriveKeys(code:string){
 const c=normalizeCode(code).replace(/-/g,'');
 const key=await crypto.subtle.importKey('raw',await digest(`oaolife-key:${c}`),{name:'AES-GCM'},false,['encrypt','decrypt']);
 const salt=hex(await digest(`oaolife-name:${c}`));
 return {id:hex(await digest(`oaolife-id:${c}`)),key,fileName:async(part:string)=>hex(await digest(`${salt}:${part}`))};
}
const toBase64=(arr:Uint8Array)=>{let s='';for(let i=0;i<arr.length;i+=8192)s+=String.fromCharCode(...arr.subarray(i,i+8192));return btoa(s);};
const fromBase64=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function pipe(bytes:Uint8Array<ArrayBuffer>,stream:CompressionStream|DecompressionStream){return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());}
export async function pack(value:unknown,key:CryptoKey){
 const zipped=await pipe(new TextEncoder().encode(JSON.stringify(value)),new CompressionStream('gzip'));
 const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,zipped));
 const out=new Uint8Array(13+cipher.length);out[0]=1;out.set(iv,1);out.set(cipher,13);return out;
}
export async function unpack(bytes:Uint8Array<ArrayBuffer>,key:CryptoKey){
 if(bytes[0]!==1||bytes.length<29)throw Error('Cópia na nuvem em formato desconhecido.');
 let zipped:Uint8Array<ArrayBuffer>;try{zipped=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(1,13)},key,bytes.slice(13)));}catch{throw Error('Código incorreto ou cópia corrompida. Nenhum dado foi alterado.');}
 return JSON.parse(new TextDecoder().decode(await pipe(zipped,new DecompressionStream('gzip'))));
}

async function upload(id:string,files:{name:string;data:string}[]){
 const res=await fetch('/api/sync',{method:'PUT',body:JSON.stringify({files}),headers:{'content-type':'application/json','x-sync-id':id}});
 if(res.status===503||res.status===404)throw Error('Cópia na nuvem ainda não ativada no servidor. Os registros continuam salvos neste aparelho.');
 if(!res.ok)throw Error(`Falha ao enviar (${res.status}). Os registros continuam neste aparelho e serão reenviados.`);
}
let running:Promise<void>|null=null,again=false,timer:ReturnType<typeof setTimeout>|undefined;
async function pushOnce(){
 const {id,key,fileName}=await deriveKeys(ensureCode());
 const snap=await db.transaction('r',db.state,db.audit,db.outbox,async()=>({state:(await db.state.get('main'))!,audit:await db.audit.toArray(),outbox:await db.outbox.toArray()}));
 const hashes=read<Record<string,string>>(HASH_KEY,{}),changed:{part:Part;hash:string}[]=[];
 for(const part of partition({data:snap.state.data,audit:snap.audit,outbox:snap.outbox})){const hash=hex(await digest(JSON.stringify(part)));if(hashes[part.name]!==hash)changed.push({part,hash});}
 let batch:{name:string;data:string}[]=[],names:{name:string;hash:string}[]=[],size=0,photosExcluded=0;
 const flush=async()=>{if(!batch.length)return;await upload(id,batch);for(const n of names)hashes[n.name]=n.hash;write(HASH_KEY,hashes);batch=[];names=[];size=0;};
 for(const {part,hash} of changed){
  const data=toBase64(await pack(part,key));
  // Limite por envio: uma foto isolada maior que isso fica só no aparelho, e isso é exibido.
  if(data.length>REQUEST_BYTES){photosExcluded++;continue;}
  if(size+data.length>REQUEST_BYTES||batch.length>=150)await flush();
  batch.push({name:await fileName(part.name),data});names.push({name:part.name,hash});size+=data.length;
 }
 await flush();
 setState({lastSyncAt:now(),syncedRevision:snap.state.revision,error:null,photosExcluded});
}
export function pushNow():Promise<void>{
 // Sem rede não é falha: os registros ficam no aparelho e são enviados quando a conexão voltar.
 if(typeof navigator!=='undefined'&&navigator.onLine===false)return Promise.resolve();
 if(running){again=true;return running;}
 running=pushOnce().catch(e=>{setState({error:(e as Error).message});}).finally(()=>{running=null;if(again){again=false;void pushNow();}});
 return running;
}
export function schedulePush(delay=4000){clearTimeout(timer);timer=setTimeout(()=>void pushNow(),delay);}

export async function fetchRemote(code:string){
 const {id,key}=await deriveKeys(code),headers={'x-sync-id':id};
 const res=await fetch('/api/sync',{headers,cache:'no-store'});
 if(res.status===503)throw Error('Cópia na nuvem ainda não ativada no servidor.');
 if(!res.ok)throw Error(`Não foi possível ler a nuvem (${res.status}).`);
 const {files}=await res.json() as {files:{name:string}[]};if(!files.length)throw Error('Nenhuma cópia encontrada para este código.');
 const parts:Part[]=[];
 for(let i=0;i<files.length;i+=40){
  const r=await fetch(`/api/sync?files=${files.slice(i,i+40).map(f=>f.name).join(',')}`,{headers,cache:'no-store'});if(!r.ok)throw Error(`Não foi possível ler a nuvem (${r.status}).`);
  const {data}=await r.json() as {data:Record<string,string>};for(const content of Object.values(data))parts.push(await unpack(fromBase64(content),key) as Part);
 }
 const merged=merge(parts);
 return {value:decodeBackupPayload({format:'oaolife-backup-9',exportedAt:now(),...merged}),parts};
}
// Restaura a cópia da nuvem. Antes, guarda os dados deste aparelho em db.snapshots.
export async function restoreFromCloud(code:string){
 const normalized=normalizeCode(code),{value,parts}=await fetchRemote(normalized);
 const current=await db.state.get('main');if(!current)throw Error('Banco não inicializado.');
 const at=now();await db.snapshots.put({id:`pre-cloud-${at}`,at,revision:current.revision,reason:'Cópia local antes de restaurar da nuvem',data:current.data});
 await restoreBackup(value,current.revision);
 const hashes:Record<string,string>={};for(const p of parts)hashes[p.name]=hex(await digest(JSON.stringify(p)));
 write(CODE_KEY,normalized);write(HASH_KEY,hashes);setState({error:null,lastSyncAt:at});schedulePush(0);
 return value;
}

let started=false;
export function startSync(){
 if(started)return;started=true;ensureCode();
 db.state.hook('updating',()=>{schedulePush();});
 db.state.hook('creating',()=>{schedulePush();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')void pushNow();else schedulePush(500);});
 window.addEventListener('online',()=>schedulePush(500));
 schedulePush(1500);
}
