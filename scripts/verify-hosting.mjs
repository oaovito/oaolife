// Somente verificações de recursos públicos; não envia registros pessoais.
const address=process.argv[2];
if(!address||!address.startsWith('https://'))throw Error('Informe uma URL HTTPS real retornada pela hospedagem.');
const base=new URL(address);base.pathname='/';base.search='';base.hash='';
async function get(path,type){const response=await fetch(new URL(path,base),{redirect:'follow',signal:AbortSignal.timeout(20000)});if(response.status!==200)throw Error(`${path}: HTTP ${response.status}`);if(type&&!response.headers.get('content-type')?.includes(type))throw Error(`${path}: tipo de conteúdo incorreto`);if(!response.url.startsWith('https://'))throw Error('Redirecionamento sem HTTPS.');return response;}
const home=await get('/','text/html'),html=await home.text();if(!html.includes('oaolife'))throw Error('Página não contém oaolife.');
for(const path of ['/treino','/alimentacao','/hidratacao','/cardio','/mobilidade','/hormonal','/plano','/evolucao','/ajustes'])await get(path,'text/html');
const manifest=await (await get('/manifest.webmanifest')).json();if(manifest.name!=='oaolife'||manifest.display!=='standalone')throw Error('Manifest inválido.');
for(const icon of manifest.icons){const response=await get('/'+icon.src.replace(/^\//,''),'image/png');const bytes=new Uint8Array(await response.arrayBuffer());if(bytes[0]!==137||bytes[1]!==80)throw Error('Ícone inválido.');}
const sw=await get('/sw.js','javascript');if(!/no-cache|no-store/.test(sw.headers.get('cache-control')||''))throw Error('Service Worker sem revalidação adequada.');
if(!home.headers.get('content-security-policy')||home.headers.get('x-content-type-options')!=='nosniff')throw Error('Headers de segurança ausentes.');
const missing=await fetch(new URL('/assets/oaolife-arquivo-inexistente.js',base));if(missing.status!==404)throw Error('Arquivo estático ausente não retorna 404.');
console.log(JSON.stringify({url:base.href,html:true,routes:true,manifest:true,icons:true,serviceWorker:true,headers:true,missingAsset404:true},null,2));
