import { test, expect, type Page } from '@playwright/test';
test('metas nos sete dias e sessões de cardio somadas no domingo',async({page})=>{
 await open(page,'/cardio?date=2026-10-18');
 for(const [date,minutes] of [['2026-10-12','60'],['2026-10-13','60'],['2026-10-14','30'],['2026-10-15','60'],['2026-10-16','60'],['2026-10-17','30'],['2026-10-18','60']]){
  await page.getByLabel('Consultar data',{exact:true}).fill(date);await expect(page.getByLabel('Planejado neste dia (min)')).toHaveValue(minutes);
 }
 await page.getByLabel('Registro manual realizado (min)').fill('20');await page.getByLabel('Velocidade realizada (km/h)',{exact:true}).fill('5');await page.getByRole('button',{name:'Salvar cardio',exact:true}).click();await expect(page.getByText('REGISTRO PARCIAL',{exact:true})).toBeVisible();
 await page.getByLabel('Modo do registro manual').selectOption('add');await page.getByLabel('Registro manual realizado (min)').fill('40');await page.getByRole('button',{name:'Salvar cardio',exact:true}).click();await expect(page.getByText('Cardio concluído · Concluído · Corrigir',{exact:true})).toBeVisible();
 await expect(page.getByText('60 de 360 min · 16%',{exact:true})).toBeVisible();await page.reload();expect((await savedData(page)).days[0].cardio.elapsed).toBe(3600);
 await nav(page,'Hoje');await expect(page.getByRole('button',{name:/FORÇA Treino/})).toContainText('Não programado');await page.getByRole('button',{name:/FORÇA Treino/}).click();await expect(page.getByRole('button',{name:'Iniciar treino',exact:true})).toHaveCount(0);
});
test('hipercifose alterna, pausa, reabre offline e conclui junto com cardio',async({page,context})=>{
 await open(page,'/cardio');await page.getByLabel('Velocidade realizada (km/h)',{exact:true}).fill('5');await page.getByRole('button',{name:'Salvar cardio',exact:true}).click();await page.getByRole('button',{name:'Iniciar',exact:true}).click();
 await nav(page,'Hoje');await page.getByRole('button',{name:/MOBILIDADE Alongamento/}).click();
 await page.getByRole('button',{name:'Iniciar sequência',exact:true}).click();await expect(page.getByRole('button',{name:'Pausar sequência',exact:true})).toBeVisible();await page.clock.fastForward(60000);await expect(page.getByText('Descansando',{exact:true})).toBeVisible();await expect(page.getByRole('timer',{name:'Tempo restante da etapa'})).toHaveText('01:00');
 await page.getByRole('button',{name:'Pausar sequência',exact:true}).click();await expect(page.getByRole('button',{name:'Continuar sequência',exact:true})).toBeVisible();await page.clock.fastForward(120000);await expect(page.getByRole('timer')).toHaveText('01:00');
 await page.getByRole('button',{name:'Continuar sequência',exact:true}).click();await expect(page.getByRole('button',{name:'Pausar sequência',exact:true})).toBeVisible();await page.clock.fastForward(60000);await expect(page.getByRole('heading',{name:'Série 2/4',exact:true})).toBeVisible();await expect(page.getByText('Alongando',{exact:true})).toBeVisible();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{name:'Série 2/4',exact:true})).toBeVisible();
 const clock=await page.evaluate(()=>Date.now());await page.clock.setSystemTime(clock+300000);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.getByText('Alongamento para hipercifose · Concluído · Corrigir',{exact:true})).toBeVisible();
 const data=await savedData(page),day=data.days[0];expect(Object.values(day.mobility.sets).map((s:any)=>s.seconds)).toEqual([60,60,60,60]);expect(Object.values(day.mobility.sequences)[0]).toMatchObject({elapsed:420,runningSince:null});expect(day.cardio.runningSince).not.toBeNull();expect(day.water).toEqual([0,0,0,0,0,0]);expect(day.meals.flat().some(Boolean)).toBe(false);
 await nav(page,'Hoje');await page.getByText('Blocos concluídos (1) · Ver e corrigir',{exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);await expect(page.getByRole('button',{name:/MOBILIDADE Alongamento/})).toContainText('Concluído');await expect(page.getByRole('button',{name:/FORÇA Treino/})).not.toContainText('Concluído');
 await page.getByRole('button',{name:/MOBILIDADE Alongamento/}).click();await page.getByText('Alongamento para hipercifose · Concluído · Corrigir',{exact:true}).click();await expect(page.getByRole('timer')).toHaveText('00:00');
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
 await page.getByLabel('Horário da refeição 1 (opcional)').fill('07:30');await page.getByLabel('Horário da refeição 5 (opcional)').fill('21:15');await page.getByRole('button',{name:'Confirmar planejamento futuro'}).click();await expect(page.getByText('Planejamento futuro atualizado. Dias já registrados mantêm suas metas.',{exact:true})).toBeVisible();await page.reload();await expect(page.getByLabel('Horário da refeição 1 (opcional)')).toHaveValue('07:30');await expect(page.getByLabel('Horário da refeição 5 (opcional)')).toHaveValue('21:15');
});
test('seis blocos em grade cabem acima da navegação no iPhone',async({page},info)=>{
 await open(page);const cards=page.locator('.home-page>.routine-grid>.routine-card');await expect(cards).toHaveCount(6);
 for(const [width,height] of [[320,568],[375,667],[393,852],[430,932]]){
  await page.setViewportSize({width,height});
  const menu=await page.locator('.sidebar').boundingBox();expect(Math.abs(menu!.y+menu!.height-height)).toBeLessThanOrEqual(1);expect(menu!.height).toBeLessThanOrEqual(68);
  const boxes=await cards.evaluateAll(items=>items.map(item=>{const r=item.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};})),navBox=await page.getByRole('navigation').boundingBox();
  expect(boxes[0].y).toBe(boxes[1].y);expect(boxes[1].x).toBeGreaterThan(boxes[0].x);expect(boxes[2].y).toBeGreaterThan(boxes[0].y);
  expect(Math.max(...boxes.map(b=>b.bottom))).toBeLessThanOrEqual(navBox!.y);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);await page.evaluate(()=>window.scrollTo(0,500));expect(await page.evaluate(()=>scrollY)).toBe(0);
  expect(await cards.evaluateAll(items=>items.flatMap(item=>{const card=item.getBoundingClientRect();return [...item.querySelectorAll('h3,.status')].filter(el=>{const r=el.getBoundingClientRect();return r.bottom>card.bottom||r.right>card.right;}).map(el=>({text:el.textContent,card:card.toJSON(),element:el.getBoundingClientRect().toJSON()}));}))).toEqual([]);
 }
 await page.setViewportSize({width:393,height:852});
 await page.evaluate(()=>{document.documentElement.style.setProperty('--safe-area-top','59px');document.documentElement.style.setProperty('--safe-area-bottom','34px');});
 const safeMenu=await page.locator('.sidebar').boundingBox(),safeNav=await page.getByRole('navigation').boundingBox(),lastCard=await cards.last().boundingBox();
 expect(Math.abs(safeMenu!.y+safeMenu!.height-852)).toBeLessThanOrEqual(1);expect(safeMenu!.height).toBeLessThanOrEqual(102);expect(lastCard!.y+lastCard!.height).toBeLessThanOrEqual(safeMenu!.y);
 expect(Math.abs(852-(safeNav!.y+safeNav!.height)-40)).toBeLessThanOrEqual(1);
 expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 await page.screenshot({path:info.outputPath('home-compact.png'),fullPage:true});
 await nav(page,'Ajustes');await page.getByRole('button',{name:'Revisar exclusão',exact:true}).scrollIntoViewIfNeeded();
 const scrolledMenu=await page.locator('.sidebar').boundingBox();expect(Math.abs(scrolledMenu!.y+scrolledMenu!.height-852)).toBeLessThanOrEqual(1);
 expect(await page.locator('.main-shell').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
 await nav(page,'Hoje');expect(await page.locator('.main-shell').evaluate(el=>el.scrollTop)).toBe(0);
 await page.evaluate(()=>{document.documentElement.style.removeProperty('--safe-area-top');document.documentElement.style.removeProperty('--safe-area-bottom');});
 for(const [width,columns] of [[820,2],[1280,3]]){
  await page.setViewportSize({width,height:1000});const firstRow=await cards.evaluateAll(items=>items.filter(item=>item.getBoundingClientRect().y===items[0].getBoundingClientRect().y).length);expect(firstRow).toBe(columns);
 }
});
test('itens feitos recolhem e permanecem corrigíveis',async({page})=>{
 await open(page,'/alimentacao');await page.getByRole('button',{name:'500 ml de leite integral',exact:true}).first().click();await expect(page.getByRole('button',{name:'500 ml de leite integral',exact:true})).toHaveCount(1);await page.getByText('Alimentos registrados (1) · Ver e corrigir',{exact:true}).click();await expect(page.getByRole('button',{name:'500 ml de leite integral',exact:true})).toHaveCount(2);
 await page.getByRole('button',{name:'500 ml de leite integral',exact:true}).first().click();await expect(page.getByRole('button',{name:'500 ml de leite integral',exact:true}).first()).toHaveAttribute('aria-pressed','false');
 await page.goto('/hidratacao');await page.getByRole('button',{name:'500 ml',exact:true}).first().click();await expect(page.locator('.bottle-complete')).toBeHidden();await page.getByText('Garrafas concluídas (1) · Ver e corrigir',{exact:true}).click();await page.getByLabel('Volume total da garrafa 1 (ml)').fill('200');await page.locator('.bottle-complete').getByRole('button',{name:'Salvar volume personalizado'}).click();await expect(page.getByRole('heading',{name:'0,2 litros registrados'})).toBeVisible();await expect(page.getByLabel('Volume total da garrafa 1 (ml)')).toBeVisible();
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
 await open(page,'/?date=2026-10-16');await expect(page.getByText('Ciclo e acompanhamento',{exact:true})).toHaveCount(0);await expect(page.getByText('Resumo e fechamento do dia',{exact:true})).toHaveCount(0);await nav(page,'Ajustes');await expect(page.getByText('Ciclo e acompanhamento',{exact:true})).toBeVisible();await page.getByText('Resumo e fechamento do dia',{exact:true}).click();await page.getByRole('button',{name:'Concluir dia sem detalhar'}).click();await nav(page,'Hoje');await expect(page.getByRole('button',{name:/MOVIMENTO Cardio/})).not.toContainText('Concluído');await page.reload();await expect(page.getByRole('button',{name:/MOVIMENTO Cardio/})).not.toContainText('Concluído');const data=await savedData(page);expect(data.sessions).toHaveLength(0);expect(data.days[0].water).toEqual([0,0,0,0,0,0]);expect(data.days[0].recorded).toEqual([]);expect(data.days[0].cardio.speed).toBeNull();
 await nav(page,'Ajustes');await page.getByText('Resumo e fechamento do dia',{exact:true}).click();await page.getByRole('button',{name:'Desfazer confirmação do dia'}).click();await nav(page,'Hoje');await expect(page.getByRole('heading',{name:'Feito por hoje.'})).toHaveCount(0);
});
test('registro hormonal é um bloco com plano informado e administrações reais separadas',async({page})=>{
 await open(page);await page.getByRole('button',{name:/REGISTRO Registro hormonal/}).click();
 await expect(page).toHaveURL(/\/hormonal$/);await expect(page.getByText('Nenhuma administração registrada.',{exact:true})).toBeVisible();
 await page.getByText('Ver plano informado e totais semanais',{exact:true}).click();
 await expect(page.getByText(/Segunda administração semanal · dia não informado/).first()).toBeVisible();
 for(const total of [500,400,100,350])await expect(page.getByText(`${total} mg/semana`,{exact:true})).toBeVisible();
 await page.getByLabel('Semana do registro consultada').selectOption('9');await expect(page.getByText('350 mg/semana',{exact:true})).toHaveCount(0);expect((await savedData(page)).hormonalLogs).toEqual([]);
 await page.getByLabel('Substância registrada').selectOption('testosterona-segunda');await page.getByLabel('Quantidade realmente administrada (mg)').fill('8');await page.getByRole('button',{name:'Salvar administração realizada'}).click();await expect(page.getByText('8 mg · semana 9',{exact:false})).toBeVisible();await page.reload();await expect(page.getByText('8 mg · semana 9',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Concluir registro do dia',exact:true}).click();await page.getByRole('button',{name:'Hoje',exact:true}).first().click();await expect(page.locator('.home-page>.routine-grid')).not.toContainText('Registro hormonal');await page.getByText('Blocos concluídos (1) · Ver e corrigir',{exact:true}).click();await page.getByRole('button',{name:/REGISTRO Registro hormonal/}).click();await page.getByRole('button',{name:'Reabrir registro do dia',exact:true}).click();await page.getByRole('button',{name:'Desfazer registro',exact:true}).click();await expect(page.getByText('Nenhuma administração registrada.',{exact:true})).toBeVisible();expect((await savedData(page)).hormonalLogs).toEqual([]);
});

