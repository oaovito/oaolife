import { test, expect, type Page } from '@playwright/test';

const routes=['','alimentacao','treino','cardio','mobilidade','hidratacao','evolucao','ajustes','plano','hormonal'];
async function assertFits(page:Page) {
 const layout=await page.evaluate(()=>{
  const shell=document.querySelector<HTMLElement>('.main-shell')!;
  const outside=[...document.querySelectorAll<HTMLElement>('main *, .topbar *, .sidebar, .toast, .completion-feedback')].filter(el=>{
   if(!el.getClientRects().length||el.closest('.file-hidden'))return false;
   const r=el.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>innerWidth+1);
  }).map(el=>`${el.tagName}.${el.className}: ${el.textContent?.slice(0,60)}`);
  // Also catch clipped overflowing children: hiding overflow alone is not a fix.
  const clipped=[...document.querySelectorAll<HTMLElement>('.exercise-meta.prominent>span,.calorie-numbers>div,.meal-macros>div,.panel button')]
   .filter(el=>el.getClientRects().length&&el.scrollWidth>el.clientWidth+1).map(el=>`${el.className}: ${el.textContent}`);
  return {document:document.documentElement.scrollWidth<=document.documentElement.clientWidth,shell:shell.scrollWidth<=shell.clientWidth,outside,clipped};
 });
 expect(layout).toEqual({document:true,shell:true,outside:[],clipped:[]});
 await page.evaluate(()=>{window.scrollTo(200,scrollY);document.querySelector('.main-shell')!.scrollLeft=200;});
 expect(await page.evaluate(()=>[scrollX,document.querySelector('.main-shell')!.scrollLeft])).toEqual([0,0]);
}

for(const width of [320,375,390,430,1440])test(`páginas e detalhes cabem em ${width}px sem deslocamento lateral`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.clock.install({time:new Date('2026-11-23T12:00:00-03:00')});
 for(const route of routes){await test.step(route||'Hoje',async()=>{
  await page.goto('/'+route);await expect(page.locator('main h1')).toBeVisible();
  if(route==='treino')await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();
  await assertFits(page);
  await page.locator('main details').evaluateAll(els=>els.forEach(el=>(el as HTMLDetailsElement).open=true));
  await assertFits(page);
 });}
});

test('gestos horizontais e diagonais não deslocam a página; gesto vertical rola',async({page,context,browserName,isMobile})=>{
 // CDP supplies real touch input; dispatchEvent(TouchEvent) cannot scroll a browser.
 test.skip(browserName!=='chromium'||!isMobile,'Real touch injection requires Chromium CDP; WebKit layout and controls are covered separately.');
 await page.setViewportSize({width:390,height:844});await page.goto('/ajustes');await expect(page.locator('main h1')).toBeVisible();
 const cdp=await context.newCDPSession(page);
 async function swipe(x:number,y:number,dx:number,dy:number){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/12,y:y+dy*i/12}]});await page.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(180);
 }
 for(const [x,dx,dy] of [[350,-290,0],[35,290,0],[345,-280,-180],[12,280,-120]]){
  await swipe(x,650,dx,dy);await assertFits(page);
 }
 await page.locator('.main-shell').evaluate(el=>el.scrollTop=0);
 await swipe(200,680,0,-400);
 expect(await page.locator('.main-shell').evaluate(el=>el.scrollTop)).toBeGreaterThan(30);
 await assertFits(page);
});

test('fontes alternativas preservam títulos, status e cabeçalho offline em telas pequenas',async({page,context})=>{
 await page.clock.install({time:new Date('2026-11-02T12:00:00-03:00')});
 await page.goto('/');await expect(page.locator('.routine-card')).toHaveCount(6);
 // DejaVu Sans reproduces the wider fallback metrics used by Linux WebKit CI.
 await page.addStyleTag({content:':root{font-family:"DejaVu Sans",sans-serif}'});
 for(const [width,height] of [[320,568],[375,667],[390,700],[430,932]]){
  await page.setViewportSize({width,height});await assertFits(page);
  expect(await page.locator('.routine-card').evaluateAll(cards=>cards.flatMap(card=>{
   const bounds=card.getBoundingClientRect();
   return [...card.querySelectorAll('h3,.status,.routine-value')].filter(el=>{
    const r=el.getBoundingClientRect();return r.left<bounds.left||r.right>bounds.right||r.top<bounds.top||r.bottom>bounds.bottom;
   }).map(el=>el.textContent);
  }))).toEqual([]);
 }
 await page.setViewportSize({width:320,height:700});await page.goto('/hidratacao');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await context.setOffline(true);await page.reload();await expect(page.locator('.offline-banner')).toBeVisible();
 await page.addStyleTag({content:':root{font-family:"DejaVu Sans",sans-serif}'});
 await assertFits(page);
 await page.getByRole('button',{name:'Dia anterior',exact:true}).click();
 await expect(page.getByRole('banner').getByRole('button',{name:'Hoje',exact:true})).toBeVisible();await assertFits(page);
 await context.setOffline(false);
});
