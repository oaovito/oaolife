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
 await expect(page.locator('.meal-count')).toContainText('1/5');
 await page.clock.fastForward(300);
 await stableWidth(page);
 await page.getByText('Refeições concluídas — 1/5',{exact:true}).click();
 await page.getByRole('button',{name:'Desfazer consumo',exact:true}).click();
 await expect(page.locator('.meal-count')).toContainText('0/5');
 await stableWidth(page);

 await page.goto('/hidratacao');
 await page.getByLabel('Volume total da garrafa 1 (ml)').fill('275');
 await page.getByRole('button',{name:'Salvar volume personalizado',exact:true}).first().click();
 await expect(page.getByRole('heading',{name:'0,275 litros registrados'})).toBeVisible();
 await stableWidth(page);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await context.setOffline(true);
 await page.reload();
 await expect(page.getByRole('heading',{name:'0,275 litros registrados'})).toBeVisible();
 await page.getByLabel('Volume total da garrafa 1 (ml)').fill('250');
 await page.getByRole('button',{name:'Salvar volume personalizado',exact:true}).first().click();
 await expect(page.getByRole('heading',{name:'0,25 litros registrados'})).toBeVisible();
 await stableWidth(page);
 await page.getByText('Sobre a hidratação',{exact:true}).scrollIntoViewIfNeeded();
 expect(await page.locator('.main-shell').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
 await page.reload();
 await expect(page.getByRole('heading',{name:'0,25 litros registrados'})).toBeVisible();
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

test('cronômetros, confirmação de reinício e tema claro mantêm controles visíveis',async({page})=>{
 await page.goto('/cardio');
 await page.getByRole('button',{name:'Iniciar',exact:true}).click();
 await expect(page.getByRole('button',{name:'Pausar',exact:true})).toBeVisible();
 await page.clock.fastForward(2000);
 await page.getByRole('button',{name:'Pausar',exact:true}).click();
 await expect(page.getByRole('timer',{name:'Tempo realizado de cardio'})).toHaveText('00:02');
 await stableWidth(page);
 await page.goto('/mobilidade');
 await page.getByRole('button',{name:'Iniciar sequência',exact:true}).click();
 await expect(page.getByRole('button',{name:'Pausar sequência',exact:true})).toBeVisible();
 await page.clock.fastForward(2000);
 await page.getByRole('button',{name:'Pausar sequência',exact:true}).click();
 await page.getByRole('button',{name:'Reiniciar sequência',exact:true}).click();
 await expect(page.getByRole('group',{name:'Confirmar reinício'})).toBeVisible();
 await stableWidth(page);
 await page.getByRole('button',{name:'Cancelar',exact:true}).click();
 await expect(page.getByRole('button',{name:'Continuar sequência',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Reiniciar sequência',exact:true}).click();
 await page.getByRole('button',{name:'Confirmar reinício',exact:true}).click();
 await expect(page.getByRole('button',{name:'Iniciar sequência',exact:true})).toBeVisible();
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
