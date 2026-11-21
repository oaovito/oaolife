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
