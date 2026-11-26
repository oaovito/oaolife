// Sincronização automática no GitHub. Só recebe arquivos já criptografados no aparelho (AES-GCM):
// o servidor nunca vê a chave nem os registros. Cada envio vira um commit que só ACRESCENTA ou
// atualiza arquivos; nada é apagado e o histórico git preserva todas as versões anteriores.
// Nomes de arquivo são hashes opacos (não revelam datas). O token fica só no ambiente da Vercel.
// Ramo padrão: "dados" (órfão, sem o código do app; a Vercel não publica a partir dele).

const API='https://api.github.com',MAX_FILES=200,MAX_BYTES=4_300_000;
export interface Env {token?:string;repo?:string;branch?:string}
type Fetch=typeof fetch;
const HEX=/^[0-9a-f]{64}$/,B64=/^[A-Za-z0-9+/]+={0,2}$/;

const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sha256(text:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
class GitHubError extends Error {constructor(readonly status:number){super(`github ${status}`);}}

function client(env:Env,f:Fetch){
 const base=`${API}/repos/${env.repo}`;
 return async <T,>(path:string,init:RequestInit={}):Promise<T>=>{
  const res=await f(`${base}${path}`,{...init,headers:{authorization:`Bearer ${env.token}`,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28','user-agent':'oaolife-sync',...(init.body?{'content-type':'application/json'}:{}),...init.headers}});
  if(!res.ok)throw new GitHubError(res.status);return res.json() as Promise<T>;
 };
}
type Tree={sha:string;tree:{path:string;type:string;sha:string;mode:string}[]};

async function head(gh:ReturnType<typeof client>,branch:string){
 try{return (await gh<{object:{sha:string}}>(`/git/ref/heads/${branch}`)).object.sha;}
 catch(e){if(!(e instanceof GitHubError)||e.status!==404)throw e;
  // Primeiro envio: cria o ramo de dados sem histórico do código (commit órfão).
  const blob=await gh<{sha:string}>('/git/blobs',{method:'POST',body:JSON.stringify({content:'Dados criptografados do oaolife. Não edite este ramo.\n',encoding:'utf-8'})});
  const tree=await gh<{sha:string}>('/git/trees',{method:'POST',body:JSON.stringify({tree:[{path:'README.md',mode:'100644',type:'blob',sha:blob.sha}]})});
  const commit=await gh<{sha:string}>('/git/commits',{method:'POST',body:JSON.stringify({message:'Inicializar dados oaolife',tree:tree.sha,parents:[]})});
  try{await gh('/git/refs',{method:'POST',body:JSON.stringify({ref:`refs/heads/${branch}`,sha:commit.sha})});return commit.sha;}
  catch(err){if(!(err instanceof GitHubError)||err.status!==422)throw err;return (await gh<{object:{sha:string}}>(`/git/ref/heads/${branch}`)).object.sha;}}
}
async function subtree(gh:ReturnType<typeof client>,treeSha:string,parts:string[]):Promise<Tree|null>{
 let tree=await gh<Tree>(`/git/trees/${treeSha}`);
 for(const p of parts){const next=tree.tree.find(t=>t.path===p&&t.type==='tree');if(!next)return null;tree=await gh<Tree>(`/git/trees/${next.sha}`);}
 return tree;
}

export async function handleSync(req:Request,env:Env,f:Fetch=fetch):Promise<Response>{
 if(!env.token||!env.repo||!/^[\w.-]+\/[\w.-]+$/.test(env.repo))return json(503,{error:'not-configured'});
 const id=req.headers.get('x-sync-id')??'';if(!HEX.test(id))return json(400,{error:'invalid-id'});
 const branch=env.branch||'dados',folder=await sha256(`oaolife-sync:${id}`),gh=client(env,f);
 try{
  if(req.method==='GET'){
   const url=new URL(req.url),wanted=url.searchParams.get('files');
   const commit=await gh<{tree:{sha:string}}>(`/git/commits/${await head(gh,branch)}`);
   const tree=await subtree(gh,commit.tree.sha,['sync',folder]);
   const entries=(tree?.tree??[]).filter(t=>t.type==='blob'&&/^[0-9a-f]{64}\.bin$/.test(t.path)).map(t=>({name:t.path.slice(0,64),sha:t.sha}));
   if(!wanted)return json(200,{files:entries});
   const names=wanted.split(',').filter(n=>HEX.test(n)).slice(0,40),out:Record<string,string>={};
   for(const name of names){const e=entries.find(x=>x.name===name);if(!e)continue;const blob=await gh<{content:string}>(`/git/blobs/${e.sha}`);out[name]=blob.content.replace(/\s/g,'');}
   return json(200,{data:out});
  }
  if(req.method==='PUT'){
   if(Number(req.headers.get('content-length')??0)>MAX_BYTES)return json(413,{error:'too-large'});
   const text=await req.text();if(text.length>MAX_BYTES)return json(413,{error:'too-large'});
   let files:{name:string;data:string}[];
   try{files=(JSON.parse(text) as {files:{name:string;data:string}[]}).files;}catch{return json(400,{error:'invalid-body'});}
   if(!Array.isArray(files)||!files.length||files.length>MAX_FILES||files.some(x=>!HEX.test(x?.name)||typeof x.data!=='string'||!B64.test(x.data)))return json(400,{error:'invalid-files'});
   const blobs=[];for(const file of files)blobs.push({path:`sync/${folder}/${file.name}.bin`,mode:'100644',type:'blob',sha:(await gh<{sha:string}>('/git/blobs',{method:'POST',body:JSON.stringify({content:file.data,encoding:'base64'})})).sha});
   // Atualização sem force: se outro envio chegou antes, refaz sobre o commit mais novo.
   for(let attempt=0;attempt<4;attempt++){
    const parent=await head(gh,branch),commit=await gh<{tree:{sha:string}}>(`/git/commits/${parent}`);
    const tree=await gh<{sha:string}>('/git/trees',{method:'POST',body:JSON.stringify({base_tree:commit.tree.sha,tree:blobs})});
    const next=await gh<{sha:string}>('/git/commits',{method:'POST',body:JSON.stringify({message:`sync ${files.length} arquivo(s)`,tree:tree.sha,parents:[parent]})});
    try{await gh(`/git/refs/heads/${branch}`,{method:'PATCH',body:JSON.stringify({sha:next.sha,force:false})});return json(200,{ok:true,saved:files.length});}
    catch(e){if(!(e instanceof GitHubError)||e.status!==422)throw e;}
   }
   return json(409,{error:'busy'});
  }
  return json(405,{error:'method'});
 }catch(e){return json(502,{error:'storage-unavailable',status:e instanceof GitHubError?e.status:null});}
}

// Repositório: GITHUB_DATA_REPO, ou o próprio repositório do projeto (variáveis de sistema da Vercel).
const env=():Env=>({token:process.env.GITHUB_DATA_TOKEN,repo:process.env.GITHUB_DATA_REPO||(process.env.VERCEL_GIT_REPO_OWNER&&process.env.VERCEL_GIT_REPO_SLUG?`${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`:undefined),branch:process.env.GITHUB_DATA_BRANCH});
export function GET(req:Request){return handleSync(req,env());}
export function PUT(req:Request){return handleSync(req,env());}
