import { test, expect, type Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const nav=async(page:Page,name:string)=>page.getByRole('navigation').getByRole('button',{name,exact:true}).click();
async function stored(page:Page){return page.evaluate(()=>new Promise<any>((resolve,reject)=>{const r=indexedDB.open('oaolife');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('state'),get=tx.objectStore('state').get('main');get.onsuccess=()=>resolve(get.result.data);tx.oncomplete=()=>db.close();};}));}
async function withUpdate(page:Page,verify:()=>Promise<void>){
 const path=resolve('dist/sw.js'),original=await readFile(path,'utf-8');
 try{
  await writeFile(path,original+`\n// update regression ${Date.now()}\n`);
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r!.update();});
  await expect(page.locator('.update-banner')).toContainText('Uma nova versão está pronta.');
  await verify();
 }finally{await writeFile(path,original);}
}
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-02T12:00:00-03:00')});
 await page.goto('/');await expect(page.locator('.main-shell')).toBeVisible();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 // An online reload also covers browsers that have not claimed this first client yet.
 await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
});

test('botão visível atualiza com treino e cronômetros salvos, sem perder dados',async({page,context})=>{
 await page.setViewportSize({width:320,height:700});
 await page.goto('/hidratacao');await page.getByRole('button',{name:'Adicionar 500 ml',exact:true}).click();await expect(page.getByRole('heading',{name:'500 ml registrados'})).toBeVisible();
 await page.goto('/treino');await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();await page.getByRole('button',{name:/Concluir série 1 de/}).first().click();
 await page.goto('/cardio');await page.getByRole('button',{name:'Iniciar',exact:true}).click();await expect(page.getByRole('button',{name:'Pausar',exact:true})).toBeVisible();
 await page.goto('/mobilidade');await page.getByRole('button',{name:'Iniciar sequência',exact:true}).first().click();
 await nav(page,'Hoje');await page.clock.fastForward(5000);
 await withUpdate(page,async()=>{
  const button=page.locator('.update-banner').getByRole('button',{name:'Atualizar agora',exact:true});await expect(button).toBeEnabled();
  for(const width of [320,375,390,430,1440]){await page.setViewportSize({width,height:700});expect(await page.locator('.main-shell').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);const box=await button.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);}
  await page.setViewportSize({width:320,height:700});await nav(page,'Ajustes');
  await page.getByLabel('Altura (cm)',{exact:true}).fill('179');await expect(button).toBeDisabled();await expect(page.getByRole('button',{name:'Aplicar atualização com segurança'})).toBeDisabled();
  await page.getByRole('button',{name:'Salvar preferências'}).click();await expect(button).toBeEnabled();
  const before=await stored(page);await nav(page,'Hoje');
  await Promise.all([page.waitForEvent('load'),button.click()]);await expect(page.locator('.main-shell')).toBeVisible();await expect(page.locator('.update-banner')).toHaveCount(0);
  const after=await stored(page);expect(after.sessions).toEqual(before.sessions);expect(after.profile.height).toBe(179);
  const previous=before.days.find((d:any)=>d.id==='2026-11-02'),current=after.days.find((d:any)=>d.id==='2026-11-02');
  expect(current.hydration).toEqual(previous.hydration);expect(current.cardio.runningSince).toBe(previous.cardio.runningSince);expect(current.cardio.runningSince).not.toBeNull();
  expect(current.mobility.sequences).toEqual(previous.mobility.sequences);
  await context.setOffline(true);await page.reload();await expect(page.locator('.offline-banner')).toBeVisible();
  await page.goto('/hidratacao');await expect(page.getByRole('heading',{name:'500 ml registrados'})).toBeVisible();
  await page.goto('/treino');await expect(page.getByText('Sessão em andamento',{exact:true})).toBeVisible();
  await page.goto('/cardio');await expect(page.getByRole('button',{name:'Pausar',exact:true})).toBeVisible();await context.setOffline(false);
 });
});

test('rascunho de encerramento protege atualização sem esconder o botão',async({page})=>{
 await page.goto('/treino');await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();
 await withUpdate(page,async()=>{
  const button=page.locator('.update-banner').getByRole('button',{name:'Atualizar agora',exact:true});await expect(button).toBeEnabled();
  await page.getByLabel('Motivo do encerramento parcial').fill('Preciso sair antes do fim do treino.');await expect(page.getByLabel('Motivo do encerramento parcial')).toHaveValue('Preciso sair antes do fim do treino.');await expect(button).toBeDisabled();
  await expect(page.locator('.update-banner')).toContainText('Salve os campos alterados antes de atualizar.');
  await page.getByRole('button',{name:'Encerrar como parcial',exact:true}).click();await expect(page.getByText('Treino parcial',{exact:true})).toBeVisible();await expect(button).toBeEnabled();
 });
});

test('Ajustes permite verificar atualização manualmente e informa falta de conexão',async({page,context})=>{
 await nav(page,'Ajustes');const button=page.getByRole('button',{name:'Verificar atualizações',exact:true});await expect(button).toBeEnabled();
 await button.click();await expect(page.getByRole('status')).toContainText('Verificação concluída. Nenhuma nova versão disponível.');
 await context.setOffline(true);await expect(page.locator('.offline-banner')).toBeVisible();await button.click();await expect(page.getByRole('alert')).toContainText('Sem internet para verificar atualizações.');
 await context.setOffline(false);await button.click();await expect(page.getByRole('status')).toContainText('Verificação concluída. Nenhuma nova versão disponível.');await expect(page.getByRole('alert')).toHaveCount(0);
});

test('atualização em outra aba preserva rascunho e permite recarga explícita',async({page,context})=>{
 await nav(page,'Ajustes');await page.getByLabel('Altura (cm)',{exact:true}).fill('179');
 await withUpdate(page,async()=>{
  const other=await context.newPage();
  try{
   await other.goto('/');await expect(other.locator('.update-banner')).toBeVisible();
   const changed=page.evaluate(()=>new Promise<void>(resolve=>navigator.serviceWorker.addEventListener('controllerchange',()=>resolve(),{once:true})));
   await Promise.all([other.waitForEvent('load'),other.getByRole('button',{name:'Atualizar agora',exact:true}).click()]);await changed;
   await expect(page.getByLabel('Altura (cm)',{exact:true})).toHaveValue('179');
   await expect(page.locator('.update-banner').getByRole('button')).toBeDisabled();
   await page.getByRole('button',{name:'Salvar preferências',exact:true}).click();
   const button=page.getByRole('button',{name:'Aplicar atualização com segurança',exact:true});await expect(button).toBeEnabled();
   await Promise.all([page.waitForEvent('load'),button.click()]);await expect(page.getByLabel('Altura (cm)',{exact:true})).toHaveValue('179');await expect(page.locator('.update-banner')).toHaveCount(0);
  }finally{await other.close();}
 });
});
