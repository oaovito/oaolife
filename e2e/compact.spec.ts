import { test, expect, type Page } from '@playwright/test';
test('dias fixos de cardio (60 min; quarta e sábado sem) e sessões somadas no domingo',async({page})=>{
 await open(page,'/cardio?date=2026-10-18');
 for(const [date,minutes] of [['2026-10-12','60'],['2026-10-13','60'],['2026-10-14',''],['2026-10-15','60'],['2026-10-16','60'],['2026-10-17',''],['2026-10-18','60']]){
  await page.getByLabel('Consultar data',{exact:true}).fill(date);if(minutes)await expect(page.getByLabel('Planejado neste dia (min)')).toHaveValue(minutes);else await expect(page.getByRole('heading',{name:'Sem cardio neste dia',level:1})).toBeVisible();
 }
 await page.getByLabel('Registro manual realizado (min)').fill('20');await page.getByLabel('Velocidade realizada (km/h)',{exact:true}).fill('5');await page.getByRole('button',{name:'Salvar cardio',exact:true}).click();await expect(page.getByText('REGISTRO PARCIAL',{exact:true})).toBeVisible();
 await page.getByLabel('Modo do registro manual').selectOption('add');await page.getByLabel('Registro manual realizado (min)').fill('40');await page.getByRole('button',{name:'Salvar cardio',exact:true}).click();await expect(page.getByText('Cardio concluído · Concluído · Corrigir',{exact:true})).toBeVisible();
 await expect(page.locator('.weekly-cardio')).toContainText('20% ·');await page.reload();expect((await savedData(page)).days[0].cardio.elapsed).toBe(3600);
 await nav(page,'Hoje');await expect(page.getByRole('button',{name:/^Treino:/})).toHaveCount(0);
});
test('hipercifose alterna, pausa, reabre offline e conclui junto com cardio',async({page,context})=>{
 await open(page,'/cardio');await page.getByLabel('Velocidade realizada (km/h)',{exact:true}).fill('5');await page.getByRole('button',{name:'Salvar cardio',exact:true}).click();await page.getByRole('button',{name:'Iniciar',exact:true}).click();
 await nav(page,'Hoje');await page.getByRole('button',{name:/^Postura:/}).click();
 await page.getByRole('button',{name:'Iniciar sequência',exact:true}).click();await expect(page.getByRole('button',{name:'Pausar sequência',exact:true})).toBeVisible();await page.clock.fastForward(60000);await expect(page.getByText('Descansando',{exact:true})).toBeVisible();await expect(page.getByRole('timer',{name:'Tempo restante da etapa'})).toHaveText('01:00');
 await page.getByRole('button',{name:'Pausar sequência',exact:true}).click();await expect(page.getByRole('button',{name:'Continuar sequência',exact:true})).toBeVisible();await page.clock.fastForward(120000);await expect(page.getByRole('timer')).toHaveText('01:00');
 await page.getByRole('button',{name:'Continuar sequência',exact:true}).click();await expect(page.getByRole('button',{name:'Pausar sequência',exact:true})).toBeVisible();await page.clock.fastForward(60000);await expect(page.getByRole('heading',{name:'Série 2/4',exact:true})).toBeVisible();await expect(page.getByText('Alongando',{exact:true})).toBeVisible();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{name:'Série 2/4',exact:true})).toBeVisible();
 const clock=await page.evaluate(()=>Date.now());await page.clock.setSystemTime(clock+300000);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.getByText('Alongamento para hipercifose · Concluído · Corrigir',{exact:true})).toBeVisible();
 const data=await savedData(page),day=data.days[0];expect(Object.values(day.mobility.sets).map((s:any)=>s.seconds)).toEqual([60,60,60,60]);expect(Object.values(day.mobility.sequences)[0]).toMatchObject({elapsed:420,runningSince:null});expect(day.cardio.runningSince).not.toBeNull();expect(day.water).toEqual([0,0,0,0,0,0]);expect(day.meals.flat().some(Boolean)).toBe(false);
 await nav(page,'Hoje');await page.getByText('Concluídos (1) · ver e corrigir',{exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);await expect(page.getByRole('button',{name:/^Postura:/})).toContainText('Concluído');await expect(page.getByRole('button',{name:/^Treino:/})).not.toContainText('Concluído');
 await page.getByRole('button',{name:/^Postura:/}).click();await page.getByText('Alongamento para hipercifose · Concluído · Corrigir',{exact:true}).click();await expect(page.getByRole('timer')).toHaveText('00:00');
 await page.getByRole('button',{name:'Reiniciar sequência',exact:true}).click();await page.getByRole('button',{name:'Cancelar',exact:true}).click();expect(Object.values((await savedData(page)).days[0].mobility.sequences)[0]).toMatchObject({elapsed:420});
 await page.getByRole('button',{name:'Reiniciar sequência',exact:true}).click();await page.getByRole('button',{name:'Confirmar reinício',exact:true}).click();await expect(page.getByRole('button',{name:'Iniciar sequência',exact:true})).toBeVisible();expect((await savedData(page)).days[0].mobility.sets).toEqual({});
 await context.setOffline(false);
});
async function open(page:Page,path='/'){await page.clock.install({time:new Date('2026-10-19T12:00:00-03:00')});await page.goto(path);}
async function nav(page:Page,name:string){await page.getByRole('navigation').getByRole('button',{name,exact:true}).click();}
async function savedData(page:Page){return page.evaluate(()=>new Promise<any>((resolve,reject)=>{const request=indexedDB.open('oaolife');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('state'),get=tx.objectStore('state').get('main');get.onsuccess=()=>resolve(get.result.data);tx.oncomplete=()=>db.close();};}));}
test('horários cabem nos campos de 320 a 430 px e persistem',async({page})=>{
 await open(page,'/ajustes');for(const width of [320,360,393,430]){await page.setViewportSize({width,height:852});await expect(page.getByLabel('Horário da refeição 1 (opcional)')).toBeVisible();
 const overflowing=await page.locator('.field input').evaluateAll(inputs=>inputs.filter(input=>{const r=input.getBoundingClientRect(),p=input.closest('.field')!.getBoundingClientRect();return r.width>p.width+1||r.right>innerWidth||r.left<0;}).length);expect(overflowing).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.getByLabel('Horário da refeição 1 (opcional)').fill('07:30');await page.getByLabel('Horário da refeição 4 (opcional)').fill('21:15');await page.getByRole('button',{name:'Confirmar planejamento futuro'}).click();await expect(page.getByText('Planejamento futuro atualizado. Dias já registrados mantêm suas metas.',{exact:true})).toBeVisible();await page.reload();await expect(page.getByLabel('Horário da refeição 1 (opcional)')).toHaveValue('07:30');await expect(page.getByLabel('Horário da refeição 4 (opcional)')).toHaveValue('21:15');
});
test('seis módulos cabem acima da navegação no iPhone 16 e rolam sem cortes em telas menores',async({page},info)=>{
 await open(page);const cards=page.locator('.home-page .module-grid>.module');await expect(cards).toHaveCount(6);
 for(const [width,height,fits] of [[320,568,false],[375,667,false],[393,852,true],[430,932,true]] as const){
  await page.setViewportSize({width,height});
  const menu=await page.locator('.sidebar').boundingBox();expect(Math.abs(menu!.y+menu!.height-height)).toBeLessThanOrEqual(1);expect(menu!.height).toBeLessThanOrEqual(72);
  const boxes=await cards.evaluateAll(items=>items.map(item=>{const r=item.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};})),navBox=await page.getByRole('navigation').boundingBox();
  expect(boxes[0].y).toBe(boxes[1].y);expect(boxes[1].x).toBeGreaterThan(boxes[0].x);expect(boxes[2].y).toBeGreaterThan(boxes[0].y);
  if(fits)expect(Math.max(...boxes.map(b=>b.bottom))).toBeLessThanOrEqual(navBox!.y);
  else{await cards.last().scrollIntoViewIfNeeded();const last=await cards.last().boundingBox();expect(last!.y+last!.height).toBeLessThanOrEqual(navBox!.y+1);await page.locator('.main-shell').evaluate(el=>el.scrollTop=0);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await cards.evaluateAll(items=>items.flatMap(item=>{const card=item.getBoundingClientRect();return [...item.querySelectorAll('.module-title,.module-figure strong')].filter(el=>{const r=el.getBoundingClientRect();return r.bottom>card.bottom||r.right>card.right+0.5;}).map(el=>({text:el.textContent}));}))).toEqual([]);
 }
 await page.setViewportSize({width:393,height:852});
 await page.evaluate(()=>{document.documentElement.style.setProperty('--safe-area-top','59px');document.documentElement.style.setProperty('--safe-area-bottom','34px');});
 const safeMenu=await page.locator('.sidebar').boundingBox(),safeNav=await page.getByRole('navigation').boundingBox(),lastCard=await cards.last().boundingBox();
 expect(Math.abs(safeMenu!.y+safeMenu!.height-852)).toBeLessThanOrEqual(1);expect(safeMenu!.height).toBeLessThanOrEqual(106);expect(lastCard!.y+lastCard!.height).toBeLessThanOrEqual(safeMenu!.y);
 expect(Math.abs(852-(safeNav!.y+safeNav!.height)-40)).toBeLessThanOrEqual(1);
 await page.screenshot({path:info.outputPath('home-compact.png'),fullPage:true});
 await nav(page,'Ajustes');await page.getByRole('button',{name:'Revisar exclusão',exact:true}).scrollIntoViewIfNeeded();
 const scrolledMenu=await page.locator('.sidebar').boundingBox();expect(Math.abs(scrolledMenu!.y+scrolledMenu!.height-852)).toBeLessThanOrEqual(1);
 expect(await page.locator('.main-shell').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
 await nav(page,'Hoje');expect(await page.locator('.main-shell').evaluate(el=>el.scrollTop)).toBe(0);
 await page.evaluate(()=>{document.documentElement.style.removeProperty('--safe-area-top');document.documentElement.style.removeProperty('--safe-area-bottom');});
 for(const [width,columns] of [[820,3],[1280,3]]){
  await page.setViewportSize({width,height:1000});const firstRow=await cards.evaluateAll(items=>items.filter(item=>item.getBoundingClientRect().y===items[0].getBoundingClientRect().y).length);expect(firstRow).toBe(columns);
 }
});
test('itens feitos recolhem e permanecem corrigíveis',async({page})=>{
 await open(page,'/alimentacao');const firstMeal=page.locator('.meal-card').first();await firstMeal.getByText('Porções e referências',{exact:true}).click();await firstMeal.getByRole('button',{name:'200 g de iogurte grego natural',exact:true}).click();await expect(firstMeal.getByRole('button',{name:'200 g de iogurte grego natural',exact:true})).toHaveAttribute('aria-pressed','true');await firstMeal.getByText('Porções e referências',{exact:true}).click();await expect(firstMeal.getByRole('button',{name:'200 g de iogurte grego natural',exact:true})).toBeHidden();await firstMeal.getByText('Porções e referências',{exact:true}).click();await firstMeal.getByRole('button',{name:'200 g de iogurte grego natural',exact:true}).click();await expect(firstMeal.getByRole('button',{name:'200 g de iogurte grego natural',exact:true})).toHaveAttribute('aria-pressed','false');
 await page.goto('/hidratacao');await page.getByRole('button',{name:'Adicionar 500 ml',exact:true}).click();await page.getByText('Histórico diário de líquidos (1)',{exact:true}).click();await page.getByLabel(/Volume do registro/).fill('200');await page.getByRole('button',{name:'Salvar correção',exact:true}).click();await expect(page.getByRole('heading',{name:'200 ml registrados'})).toBeVisible();
});
test('conclui sem detalhes, pula séries e destaca as instruções',async({page},info)=>{
 await open(page,'/plano');await page.getByLabel(/Semana do ciclo em/).selectOption('3');await page.getByRole('button',{name:'Confirmar semana e iniciar ciclo'}).click();await expect(page.getByRole('heading',{name:'Ciclo atual · semana 3/12'})).toBeVisible();await page.goto('/treino');await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();
 const first=page.locator('.exercise').first();await expect(first.locator('.prominent')).toContainText('RIR');expect(await first.locator('.prominent strong').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(18);
 await page.screenshot({path:info.outputPath('workout-guidance.png'),fullPage:true});
 await first.getByRole('button',{name:/Concluir série 1 de/}).click();await first.getByRole('button',{name:/Não realizar série 2 de/}).click();await first.getByRole('button',{name:'Concluir exercício',exact:true}).click();await expect(page.locator('.exercise-list>.exercise').first()).not.toContainText('Supino vertical');
 await page.getByLabel('Motivo do encerramento parcial').fill('Somente parte da sessão foi realizada.');await page.getByRole('button',{name:'Encerrar como parcial'}).click();await expect(page.getByText('Treino parcial',{exact:true})).toBeVisible();await page.reload();const data=await savedData(page),sets=data.sessions[0].exercises[0].sets;expect(sets[0].done).toBe(true);expect(sets[0].load).toBeNull();expect(sets[0].rir).toBeNull();expect(sets[1].skipped).toBe(true);expect(sets[1].done).toBe(false);expect(data.decisions).toHaveLength(0);
 await page.getByRole('button',{name:'Corrigir registros'}).click();await page.getByText('Exercícios registrados (1) · Ver e corrigir',{exact:true}).click();await page.locator('.completed-items .exercise-disclosure>summary').first().click();await page.getByText(/Séries registradas \(\d+\) · Ver e corrigir/).first().click();await page.getByRole('button',{name:'Não realizar série 2 de Supino vertical',exact:true}).click();await expect(page.getByRole('button',{name:'Concluir série 2 de Supino vertical',exact:true})).toBeVisible();
});
test('cardio exige 60 minutos, esteira e velocidade informada de pelo menos 5',async({page})=>{
 await open(page,'/cardio');await expect(page.getByLabel('Planejado neste dia (min)')).toHaveValue('60');for(const [minutes,speed] of [['59','5'],['60',''],['60','4.9']]){await page.getByLabel('Registro manual realizado (min)').fill(minutes);await page.getByLabel('Velocidade realizada (km/h)',{exact:true}).fill(speed);await page.getByRole('button',{name:'Salvar cardio',exact:true}).click();await expect(page.getByText('REGISTRO PARCIAL',{exact:true})).toBeVisible();}
 await page.getByLabel('Registro manual realizado (min)').fill('60');await page.getByLabel('Velocidade realizada (km/h)',{exact:true}).fill('5');await page.getByRole('button',{name:'Salvar cardio',exact:true}).click();await expect(page.getByText('Cardio concluído · Concluído · Corrigir',{exact:true})).toBeVisible();await page.reload();await page.getByText('Cardio concluído · Concluído · Corrigir',{exact:true}).click();await expect(page.getByLabel('Velocidade realizada (km/h)',{exact:true})).toHaveValue('5');expect((await savedData(page)).days[0].cardio.elapsed).toBe(3600);
});
test('dia anterior conclui por declaração e mantém valores desconhecidos',async({page})=>{
 await open(page,'/?date=2026-10-16');await expect(page.getByText('Ciclo e acompanhamento',{exact:true})).toHaveCount(0);await expect(page.getByText('Resumo e fechamento do dia',{exact:true})).toHaveCount(0);await nav(page,'Ajustes');await expect(page.getByText('Ciclo e acompanhamento',{exact:true})).toBeVisible();await page.getByText('Resumo e fechamento do dia',{exact:true}).click();await page.getByRole('button',{name:'Concluir dia sem detalhar'}).click();await nav(page,'Hoje');await expect(page.getByRole('button',{name:/^Cardio:/})).not.toContainText('Concluído');await page.reload();await expect(page.getByRole('button',{name:/^Cardio:/})).not.toContainText('Concluído');const data=await savedData(page);expect(data.sessions).toHaveLength(0);expect(data.days[0].water).toEqual([0,0,0,0,0,0]);expect(data.days[0].recorded).toEqual([]);expect(data.days[0].cardio.speed).toBeNull();
 await nav(page,'Ajustes');await page.getByText('Resumo e fechamento do dia',{exact:true}).click();await page.getByRole('button',{name:'Desfazer confirmação do dia'}).click();await nav(page,'Hoje');await expect(page.getByRole('heading',{name:'Feito por hoje.'})).toHaveCount(0);
});
test('registro hormonal: plano informado pré-preenchido, um toque registra e só aparece seg/qui',async({page})=>{
 await open(page);await page.getByRole('button',{name:/^Registro hormonal:/}).click();
 await expect(page).toHaveURL(/\/hormonal$/);const quick=page.locator('.hormonal-quick');
 for(const dose of ['Testosterona','Decanoato de nandrolona','Enantato de trembolona'])await expect(quick).toContainText(dose);
 await quick.getByRole('button',{name:'Registrar aplicação',exact:true}).click();
 await expect.poll(async()=>(await savedData(page)).hormonalLogs.length).toBe(3);
 await page.reload();expect((await savedData(page)).hormonalLogs.map((l:any)=>l.doseMg).sort((a:number,b:number)=>a-b)).toEqual([50,200,500]);
 await nav(page,'Hoje');await expect(page.locator('.module-grid')).not.toContainText('Registro hormonal');
 await page.getByLabel('Consultar data',{exact:true}).fill('2026-10-18');await expect(page.getByRole('button',{name:/^Registro hormonal:/})).toHaveCount(0);
});


test('PWA instalada recupera altura omitida pelo WebKit e reposiciona menu após teclado',async({page})=>{
 await page.setViewportSize({width:393,height:852});
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'standalone',{configurable:true,get:()=>true});Object.defineProperty(navigator,'userAgent',{configurable:true,get:()=> 'Mozilla/5.0 (iPhone)'});
  Object.defineProperty(window,'innerHeight',{configurable:true,get:()=>793});Object.defineProperty(screen,'width',{configurable:true,get:()=>393});Object.defineProperty(screen,'height',{configurable:true,get:()=>852});
  let visibleHeight=759;const viewport=window.visualViewport!;Object.defineProperty(viewport,'height',{configurable:true,get:()=>visibleHeight});
  window.addEventListener('test-keyboard-open',()=>{visibleHeight=480;viewport.dispatchEvent(new Event('resize'));});window.addEventListener('test-keyboard-close',()=>{visibleHeight=759;viewport.dispatchEvent(new Event('resize'));});
 });
 await open(page);
 await page.evaluate(()=>{document.documentElement.style.setProperty('--safe-area-top','59px');document.documentElement.style.setProperty('--safe-area-bottom','34px');window.dispatchEvent(new Event('pageshow'));});
 const menuBottom=()=>page.locator('.sidebar').evaluate(el=>Math.round(el.getBoundingClientRect().bottom));
 await expect.poll(menuBottom).toBe(852);await expect(page.locator('html')).toHaveAttribute('data-ios-installed','true');
 const navBox=await page.getByRole('navigation').boundingBox();expect(Math.abs(852-(navBox!.y+navBox!.height)-40)).toBeLessThanOrEqual(1);
 await nav(page,'Ajustes');await page.getByLabel('Altura (cm)',{exact:true}).focus();await page.evaluate(()=>window.dispatchEvent(new Event('test-keyboard-open')));
 await expect.poll(menuBottom).toBe(480);await expect(page.locator('html')).toHaveAttribute('data-keyboard-open','true');
 await page.evaluate(()=>window.dispatchEvent(new Event('test-keyboard-close')));await expect.poll(menuBottom).toBe(852);
 await nav(page,'Hoje');await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await expect.poll(menuBottom).toBe(852);
 const last=await page.locator('.module').last().boundingBox(),menu=await page.locator('.sidebar').boundingBox();expect(last!.y+last!.height).toBeLessThanOrEqual(menu!.y);
 await page.evaluate(()=>window.scrollTo(0,500));expect(await page.evaluate(()=>scrollY)).toBe(0);
});

test('ação principal de cada bloco aparece sem rolagem no iPhone 16',async({page},info)=>{
 test.skip(info.project.name==='desktop');
 await page.clock.install({time:new Date('2026-11-30T12:00:00-03:00')});
 for(const [path,name] of [['/treino','Iniciar treino'],['/cardio','Iniciar'],['/mobilidade','Iniciar sequência'],['/alimentacao','Marcar como consumida'],['/hormonal','Registrar aplicação'],['/hidratacao','Adicionar 500 ml']] as const){
  await page.goto(path);const button=page.getByRole('button',{name,exact:true}).first();await expect(button).toBeVisible();
  const box=await button.boundingBox(),nav=await page.getByRole('navigation').boundingBox();
  expect(box!.y+box!.height,`${path}: ${name}`).toBeLessThanOrEqual(nav!.y);expect(await page.evaluate(()=>document.querySelector('.main-shell')?.scrollTop??scrollY)).toBe(0);
 }
});
