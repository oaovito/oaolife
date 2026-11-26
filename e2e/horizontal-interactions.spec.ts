import { test, expect, type Page } from '@playwright/test';

async function stableWidth(page:Page) {
 const geometry=await page.evaluate(()=>{
  const viewport=document.documentElement.clientWidth;
  const roots=[document.documentElement,document.body,...document.querySelectorAll<HTMLElement>('#root,.app-shell,.main-shell,main')];
  return {
   scroll:roots.filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>({element:el.className||el.tagName,width:el.clientWidth,scroll:el.scrollWidth})),
   outside:[...document.querySelectorAll<HTMLElement>('main button,main input,main select,main textarea,.panel,.toast,[role=group]')]
    .filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden')
    .filter(el=>{const r=el.getBoundingClientRect();return r.left < -1||r.right>viewport+1;})
    .map(el=>({element:el.className||el.tagName,text:el.textContent?.slice(0,60)})),
  };
 });
 expect(geometry).toEqual({scroll:[],outside:[]});
}

test.beforeEach(async({page})=>{
 await page.setViewportSize({width:320,height:700});
 await page.clock.install({time:new Date('2026-11-02T12:00:00-03:00')});
});

test('refeições e água continuam corrigíveis, persistentes e acessíveis offline a 320 px',async({page,context})=>{
 await page.goto('/alimentacao');
 const firstMeal=page.locator('.meal-grid>.meal-card').first();
 await firstMeal.getByRole('button',{name:'Marcar como consumida',exact:true}).click();
 await expect(page.locator('.meal-count')).toContainText('1/4');
 await page.clock.fastForward(300);
 await stableWidth(page);
 await page.getByText('Refeições concluídas — 1/4',{exact:true}).click();
 await page.getByRole('button',{name:'Desfazer consumo',exact:true}).click();
 await expect(page.locator('.meal-count')).toContainText('0/4');
 await stableWidth(page);

 await page.goto('/hidratacao');
 await page.getByLabel('Quantidade personalizada (ml)').fill('275');
 await page.getByRole('button',{name:'Registrar quantidade',exact:true}).first().click();
 await expect(page.getByRole('heading',{name:'275 ml registrados'})).toBeVisible();
 await stableWidth(page);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await context.setOffline(true);
 await page.reload();
 await expect(page.getByRole('heading',{name:'275 ml registrados'})).toBeVisible();
 await page.getByRole('button',{name:'Desfazer último registro'}).click();await page.getByLabel('Quantidade personalizada (ml)').fill('250');
 await page.getByRole('button',{name:'Registrar quantidade',exact:true}).first().click();
 await expect(page.getByRole('heading',{name:'250 ml registrados'})).toBeVisible();
 await stableWidth(page);
 await page.getByRole('heading',{name:'Ao longo do dia',exact:true}).scrollIntoViewIfNeeded();
 expect(await page.locator('.main-shell').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
 await page.reload();
 await expect(page.getByRole('heading',{name:'250 ml registrados'})).toBeVisible();
 await stableWidth(page);
 await context.setOffline(false);
});

test('campos e conclusão de séries funcionam sem ampliar a página em retrato e paisagem',async({page})=>{
 await page.goto('/treino');
 await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();
 const load=page.getByRole('spinbutton',{name:'Carga série 1 Supino vertical',exact:true});
 const reps=page.getByRole('spinbutton',{name:'Repetições série 1 Supino vertical',exact:true});
 await load.fill('52.5');
 await expect(load).toHaveValue('52.5');
 await reps.fill('12');
 await expect(reps).toHaveValue('12');
 await page.getByLabel('Observações série 1 Supino vertical',{exact:true}).fill('ObservaçãoSemEspaços'.repeat(25));
 await stableWidth(page);
 await page.setViewportSize({width:700,height:320});
 await stableWidth(page);
 await page.getByRole('button',{name:'Concluir série 1 de Supino vertical',exact:true}).click();
 await page.setViewportSize({width:320,height:700});
 await page.getByText('Séries registradas (1) · Ver e corrigir',{exact:true}).click();
 await page.getByRole('button',{name:'Concluir série 1 de Supino vertical',exact:true}).click();
 await expect(load).toHaveValue('52.5');
 await expect(reps).toHaveValue('12');
 await stableWidth(page);
 await page.reload();
 await expect(load).toHaveValue('52.5');
 await expect(reps).toHaveValue('12');
});

test('cronômetro de cardio, séries de postura e tema claro mantêm controles visíveis',async({page})=>{
 await page.goto('/cardio');
 await page.getByRole('button',{name:'Iniciar',exact:true}).click();
 await expect(page.getByRole('button',{name:'Pausar',exact:true})).toBeVisible();
 await page.clock.fastForward(2000);
 await page.getByRole('button',{name:'Pausar',exact:true}).click();
 await expect(page.getByRole('timer',{name:'Tempo realizado de cardio'})).toHaveText('00:02');
 await stableWidth(page);
 await page.goto('/mobilidade');
 for(const n of [1,2,3,4])await page.getByRole('button',{name:`Série ${n}`,exact:true}).click();
 await expect(page.getByText('Alongamento para hipercifose · Concluído · Corrigir',{exact:true})).toBeVisible();
 await page.getByText('Alongamento para hipercifose · Concluído · Corrigir',{exact:true}).click();
 await page.getByText('Dor, desconforto e observações (opcional)',{exact:true}).click();
 await stableWidth(page);
 await page.getByRole('navigation').getByRole('button',{name:'Ajustes',exact:true}).click();
 await page.getByRole('combobox',{name:/Tema/}).selectOption('light');
 await page.getByRole('button',{name:'Salvar preferências',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await stableWidth(page);
 await page.getByRole('button',{name:'Revisar exclusão',exact:true}).scrollIntoViewIfNeeded();
 expect(await page.locator('.main-shell').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await stableWidth(page);
});
