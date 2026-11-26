import { activateHydration } from '../domain/hydration';
import { activateMobility } from '../domain/mobility';
import { activateNutrition } from '../domain/nutrition';
import { z } from 'zod';
import { appDataSchema } from '../domain/model';
import { db, assertIntegrity, mutate } from './db';
import { anchorTrainingCycle, now, uid, today } from '../domain/training';
import { migrateV9 } from '../domain/migrations';
const toBase64=(arr:Uint8Array)=>{let s='';for(let i=0;i<arr.length;i+=8192)s+=String.fromCharCode(...arr.subarray(i,i+8192));return btoa(s);};
const fromBase64=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const envelope=z.object({format:z.literal('oaolife-encrypted-1'),iterations:z.literal(310000),salt:z.string().max(64),iv:z.string().max(32),ciphertext:z.string().max(70000000)});
const payload=z.object({format:z.enum(['oaolife-backup-2','oaolife-backup-3','oaolife-backup-4','oaolife-backup-5','oaolife-backup-6','oaolife-backup-7','oaolife-backup-8','oaolife-backup-9']),exportedAt:z.string().datetime(),data:appDataSchema,audit:z.array(z.object({id:z.string(),at:z.string().datetime(),revision:z.number().int().nonnegative(),kind:z.string(),detail:z.string(),changes:z.array(z.object({path:z.string(),before:z.unknown(),after:z.unknown()})).optional()})),outbox:z.array(z.object({id:z.string(),at:z.string().datetime(),revision:z.number().int().nonnegative(),state:z.enum(['local-only','pending','conflict']),kind:z.string()}))});
async function key(password:string,salt:Uint8Array<ArrayBuffer>) { const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']); }
export async function encryptBackup(value:unknown,password:string) {
 if(password.length<12)throw Error('Use uma senha de backup com pelo menos 12 caracteres. Guarde-a: ela não pode ser recuperada.');
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const k=await key(password,salt);
 const bytes=new TextEncoder().encode(JSON.stringify(value));if(bytes.length>50000000)throw Error('Os dados excedem o limite de 50 MB deste formato de backup. Reduza imagens de referência antes de exportar. Não exclua registros sem uma cópia segura.');
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,bytes);
 return JSON.stringify({format:'oaolife-encrypted-1',iterations:310000,salt:toBase64(salt),iv:toBase64(iv),ciphertext:toBase64(new Uint8Array(encrypted))});
}
export async function decryptBackup(content:string,password:string) {
 if(content.length>70001000)throw Error('Backup muito grande (limite aproximado: 50 MB).');
 const e=envelope.parse(JSON.parse(content)),salt=fromBase64(e.salt),iv=fromBase64(e.iv);
 if(salt.length!==16||iv.length!==12)throw Error('Arquivo de backup inválido.');
 let clear:ArrayBuffer;try{clear=await crypto.subtle.decrypt({name:'AES-GCM',iv},await key(password,salt),fromBase64(e.ciphertext));}catch{throw Error('Senha incorreta ou backup corrompido. Nenhum dado foi alterado.');}
 const result=payload.parse(JSON.parse(new TextDecoder().decode(clear)));assertIntegrity(result.data);return result;
}
export async function exportBackup(password:string) {
 const snapshot=await db.transaction('r',db.state,db.audit,db.outbox,async()=>({data:(await db.state.get('main'))!.data,audit:await db.audit.toArray(),outbox:await db.outbox.toArray()}));
 const content=await encryptBackup({format:'oaolife-backup-9',exportedAt:now(),...snapshot},password);
 const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`oaolife-${now().slice(0,10)}.oaolife`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
 await mutate('Backup exportado','Arquivo criptografado gerado; confirme o armazenamento externo.',d=>{d.settings.lastBackup=now();});
}
export async function restoreBackup(value:z.infer<typeof payload>,expectedRevision:number) {
 const valid=payload.parse(value);activateNutrition(valid.data,today());activateHydration(valid.data,today());activateMobility(valid.data,today());anchorTrainingCycle(valid.data,today());migrateV9(valid.data,today());assertIntegrity(valid.data);
 await db.transaction('rw',db.state,db.audit,db.outbox,async()=>{
 const current=await db.state.get('main');if(!current||current.revision!==expectedRevision)throw Error('Os dados mudaram desde a revisão do backup. Revise novamente antes de restaurar.');
 const revision=valid.outbox.reduce((n,o)=>Math.max(n,o.revision),valid.audit.reduce((n,a)=>Math.max(n,a.revision),current.revision))+1;await db.state.put({id:'main',revision,data:valid.data});await db.audit.clear();await db.outbox.clear();
 // Chaves repetidas no histórico importado são rejeitadas pela transação inteira.
 await db.audit.bulkAdd(valid.audit);await db.outbox.bulkAdd(valid.outbox);
 const id=uid(),at=now();await db.audit.add({id,at,revision,kind:'Backup restaurado',detail:`Exportado em ${valid.exportedAt}`});await db.outbox.add({id,at,revision,state:'local-only',kind:'Restauração'});
 });
}

