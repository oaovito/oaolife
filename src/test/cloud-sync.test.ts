import { describe, expect, it } from 'vitest';
import { emptyData, makeDay } from '../domain/daily';
import { anchorTrainingCycle, now } from '../domain/training';
import { migrateV9 } from '../domain/migrations';
import { partition, merge } from '../storage/syncPartition';
import { deriveKeys, generateCode, normalizeCode, pack, unpack } from '../storage/sync';
import { decodeBackupPayload } from '../storage/backup';
import { handleSync } from '../../api/sync';
import { rankFor, RANKS } from '../domain/rank';
import { perfectDays, PERFECT_SINCE } from '../domain/weeklyReport';
import { setMealConsumedAll } from '../../e2e/seed';
import type { AuditRecord } from '../storage/db';

function sample(){
 const data=emptyData();anchorTrainingCycle(data,'2026-11-26');migrateV9(data,'2026-11-26');
 for(const d of ['2026-11-26','2026-11-27'])data.days.push(makeDay(data,d));
 data.measurements.push({id:'m1',date:'2026-11-29',weight:84.6,waist:null,systolic:null,diastolic:null,restingHR:null,body:'',notes:''});
 data.hormonalLogs.push({id:'h1',date:'2026-11-30',week:1,entryId:'e',substance:'Teste',doseMg:1,notes:'',at:'2026-11-30T12:00:00.000Z'});
 data.photos.push({id:'p1',date:'2026-11-27',angle:'Frente',data:'data:image/png;base64,AAAA',notes:''});
 const audit:AuditRecord[]=[{id:'a1',at:'2026-11-26T12:00:00.000Z',revision:1,kind:'k',detail:''},{id:'a2',at:'2026-11-27T12:00:00.000Z',revision:2,kind:'k',detail:''}];
 return {data,audit,outbox:[{id:'o1',at:'2026-11-27T12:00:00.000Z',revision:2,state:'local-only' as const,kind:'k'}]};
}

describe('sincronização: partes por data e fusão sem perdas',()=>{
 it('partition → merge devolve exatamente os mesmos registros',()=>{
  const s=sample(),parts=partition(s);
  expect(parts.map(p=>p.name)).toEqual(['core','day:2026-11-26','day:2026-11-27','day:2026-11-29','day:2026-11-30','photo:p1']);
  const back=merge(JSON.parse(JSON.stringify(parts)));
  expect(back.data).toEqual({...s.data,days:back.data.days});expect(back.data.days).toEqual(s.data.days);
  expect(back.audit).toEqual(s.audit);expect(back.outbox).toEqual(s.outbox);
  expect(()=>decodeBackupPayload({format:'oaolife-backup-9',exportedAt:now(),...back})).not.toThrow();
 });
 it('uma alteração em um dia muda só a parte daquele dia',()=>{
  const s=sample(),before=partition(s).map(p=>JSON.stringify(p));
  s.data.days[1].hydration!.entries.push({id:'w',ml:500,at:'2026-11-27T13:00:00.000Z'});
  const after=partition(s).map(p=>JSON.stringify(p));
  expect(after.filter((p,i)=>p!==before[i]).length).toBe(1);
 });
 it('sem a parte principal não restaura nada',()=>{expect(()=>merge([])).toThrow(/incompleta/);});
});

describe('sincronização: código e criptografia',()=>{
 it('código tem 32 caracteres, normaliza e deriva chaves estáveis',async()=>{
  const code=generateCode();expect(code).toMatch(/^([0-9A-Z]{4}-){7}[0-9A-Z]{4}$/);
  expect(normalizeCode(code.toLowerCase().replace(/-/g,' '))).toBe(code);expect(()=>normalizeCode('ABC')).toThrow();
  const a=await deriveKeys(code),b=await deriveKeys(code);expect(a.id).toBe(b.id);expect(a.id).toMatch(/^[0-9a-f]{64}$/);
  expect(await a.fileName('day:2026-11-26')).toBe(await b.fileName('day:2026-11-26'));expect(await a.fileName('day:2026-11-26')).not.toContain('2026');
  expect((await deriveKeys(generateCode())).id).not.toBe(a.id);
 });
 it('pacote cifrado não contém texto legível e só abre com o código certo',async()=>{
  const {key}=await deriveKeys(generateCode()),other=(await deriveKeys(generateCode())).key;
  const value={substance:'Testosterona',weight:84.6},bytes=await pack(value,key);
  expect(new TextDecoder().decode(bytes)).not.toContain('Testosterona');
  expect(await unpack(bytes,key)).toEqual(value);await expect(unpack(bytes,other)).rejects.toThrow(/Código incorreto/);
 });
});

// GitHub simulado: refs, blobs, árvores e commits em memória.
function fakeGitHub(){
 const blobs=new Map<string,string>(),trees=new Map<string,{path:string;type:string;sha:string;mode:string}[]>(),commits=new Map<string,{tree:string;parents:string[]}>(),refs=new Map<string,string>();let n=0;const sha=()=>`sha${++n}`;
 const calls:string[]=[];
 const build=(base:string|undefined,entries:{path:string;sha:string}[])=>{
  // Expande caminhos "a/b/c" sobre a árvore base.
  const flat=new Map<string,string>();const walk=(t:string,prefix:string)=>{for(const e of trees.get(t)??[]){if(e.type==='tree')walk(e.sha,prefix+e.path+'/');else flat.set(prefix+e.path,e.sha);}};if(base)walk(base,'');
  for(const e of entries)flat.set(e.path,e.sha);
  const make=(prefix:string):string=>{const items=new Map<string,{path:string;type:string;sha:string;mode:string}>();for(const [p,s] of flat){if(!p.startsWith(prefix))continue;const rest=p.slice(prefix.length),[head,...tail]=rest.split('/');if(tail.length)items.set(head,{path:head,type:'tree',sha:'',mode:'040000'});else items.set(head,{path:head,type:'blob',sha:s,mode:'100644'});}
   const list=[...items.values()].map(i=>i.type==='tree'?{...i,sha:make(prefix+i.path+'/')}:i);const id=sha();trees.set(id,list);return id;};
  return make('');
 };
 const f=(async(input:string|URL|Request,init:RequestInit={})=>{
  const url=new URL(String(input)),path=url.pathname.replace(/^\/repos\/[^/]+\/[^/]+/,''),method=init.method??'GET',body=init.body?JSON.parse(String(init.body)):null;calls.push(`${method} ${path}`);
  const ok=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status});
  let m;
  if((m=/^\/git\/ref\/heads\/(.+)$/.exec(path))){const r=refs.get(m[1]);return r?ok({object:{sha:r}}):ok({},404);}
  if(path==='/git/refs'&&method==='POST'){refs.set(body.ref.replace('refs/heads/',''),body.sha);return ok({},201);}
  if((m=/^\/git\/refs\/heads\/(.+)$/.exec(path))&&method==='PATCH'){refs.set(m[1],body.sha);return ok({});}
  if(path==='/git/blobs'&&method==='POST'){const id=sha();blobs.set(id,body.encoding==='base64'?body.content:btoa(body.content));return ok({sha:id},201);}
  if((m=/^\/git\/blobs\/(.+)$/.exec(path)))return ok({content:blobs.get(m[1])});
  if(path==='/git/trees'&&method==='POST')return ok({sha:build(body.base_tree,body.tree)},201);
  if((m=/^\/git\/trees\/(.+)$/.exec(path)))return ok({sha:m[1],tree:trees.get(m[1])});
  if(path==='/git/commits'&&method==='POST'){const id=sha();commits.set(id,{tree:body.tree,parents:body.parents});return ok({sha:id},201);}
  if((m=/^\/git\/commits\/(.+)$/.exec(path)))return ok({tree:{sha:commits.get(m[1])!.tree}});
  return ok({},404);
 }) as typeof fetch;
 return {f,refs,commits,calls};
}
const env={token:'t',repo:'dono/repo',branch:'dados'},id='a'.repeat(64),name1='1'.repeat(64),name2='2'.repeat(64);
const put=(files:{name:string;data:string}[])=>new Request('https://x/api/sync',{method:'PUT',headers:{'x-sync-id':id},body:JSON.stringify({files})});

describe('função /api/sync (GitHub)',()=>{
 it('sem token não aceita envio; id inválido é recusado',async()=>{
  expect((await handleSync(put([]),{})).status).toBe(503);
  expect((await handleSync(new Request('https://x/api/sync',{headers:{'x-sync-id':'x'}}),env,fakeGitHub().f)).status).toBe(400);
 });
 it('cria o ramo de dados, acrescenta commits e nunca apaga arquivos anteriores',async()=>{
  const gh=fakeGitHub();
  expect((await handleSync(put([{name:name1,data:btoa('um')}]),env,gh.f)).status).toBe(200);
  expect((await handleSync(put([{name:name2,data:btoa('dois')}]),env,gh.f)).status).toBe(200);
  expect((await handleSync(put([{name:name1,data:btoa('um v2')}]),env,gh.f)).status).toBe(200);
  // órfão + 3 envios = 4 commits encadeados
  let head=gh.refs.get('dados')!,count=0;while(head){count++;head=gh.commits.get(head)!.parents[0];}expect(count).toBe(4);
  const list=await (await handleSync(new Request('https://x/api/sync',{headers:{'x-sync-id':id}}),env,gh.f)).json();
  expect(list.files.map((f:{name:string})=>f.name).sort()).toEqual([name1,name2]);
  const got=await (await handleSync(new Request(`https://x/api/sync?files=${name1},${name2}`,{headers:{'x-sync-id':id}}),env,gh.f)).json();
  expect(atob(got.data[name1])).toBe('um v2');expect(atob(got.data[name2])).toBe('dois');
  expect(gh.calls.some(c=>c.startsWith('DELETE'))).toBe(false);
 });
 it('recusa corpo inválido',async()=>{
  expect((await handleSync(put([{name:'x',data:'!'}]),env,fakeGitHub().f)).status).toBe(400);
 });
});

describe('contador de dias cumpridos e patentes',()=>{
 it('promove a cada 10 dias, sem limite',()=>{
  expect(rankFor(0)).toMatchObject({name:'Recruta',klass:'recruit',inLevel:0,nextAt:10});
  expect(rankFor(9).name).toBe('Recruta');expect(rankFor(10)).toMatchObject({name:'Soldado',klass:'enlisted',marks:1});
  expect(rankFor(105)).toMatchObject({name:'Capitão',klass:'officer',inLevel:5});
  expect(rankFor((RANKS.length-1)*10).klass).toBe('marshal');expect(rankFor(5000).name).toMatch(/^Marechal ★\d+$/);
 });
 it('conta só dias com todo o programa concluído, desde 26/11/2026',()=>{
  const data=emptyData();anchorTrainingCycle(data,PERFECT_SINCE);migrateV9(data,PERFECT_SINCE);
  expect(perfectDays(data,'2026-11-28')).toEqual({total:0,streak:0,best:0});
  const day=makeDay(data,'2026-11-26');setMealConsumedAll(day);data.days.push(day);
  // Sem os demais blocos concluídos, o dia não conta.
  expect(perfectDays(data,'2026-11-26').total).toBe(0);
  const complete=(date:string)=>{const d=data.days.find(x=>x.id===date)??(()=>{const n=makeDay(data,date);data.days.push(n);return n;})();setMealConsumedAll(d);
   if(d.hydration)d.hydration.entries=[{id:`w${date}`,ml:5000,at:`${date}T12:00:00.000Z`}];
   if(d.cardio.planned!==null){d.cardio.elapsed=3600;d.cardio.speed=5;d.cardio.status='complete';}
   const ex=d.mobility.protocol!.exercises[0];d.mobility.sequences[ex.id]={elapsed:420,runningSince:null,completedAt:`${date}T12:00:00.000Z`};for(let s=0;s<ex.sets;s++)d.mobility.sets[`${ex.id}:${s}`]={done:true,seconds:60,runningSince:null,discomfort:null,pain:null,notes:''};
   for(const k of ['workout','hormonal'] as const)d.declarations[k]={at:`${date}T12:00:00.000Z`,note:'Teste'};};
  complete('2026-11-26');complete('2026-11-27');complete('2026-11-29');
  expect(perfectDays(data,'2026-11-29')).toEqual({total:3,streak:1,best:2});
  // Hoje incompleto não zera a sequência de ontem.
  expect(perfectDays(data,'2026-11-28')).toEqual({total:2,streak:2,best:2});
  // Datas antes de 26/11/2026 não contam.
  complete('2026-11-25');expect(perfectDays(data,'2026-11-29').total).toBe(3);
 });
});
