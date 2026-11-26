import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Rotina diária de alimentação e hidratação (26/11/2026).
test('rotina do dia: ordem cronológica, próximo pendente, contadores, reset diário e edição',async({page})=>{
 await page.clock.install({time:new Date('2026-11-27T09:00:00-03:00')});await page.goto('/rotina');
 const items=page.locator('.schedule-item:not([data-kind=training])');await expect(items).toHaveCount(12);
 const training=page.locator('.schedule-item[data-kind=training]');await expect(training).toContainText('08:00');await expect(training).toContainText('Treino');
 await expect(page.locator('.schedule-item').nth(2)).toHaveAttribute('data-kind','training');
 await expect(items.locator('.schedule-time')).toHaveText(['06:00','07:00','08:30','09:30','10:30','11:30','13:00','14:00','15:30','17:00','18:30','19:30']);
 await expect(items.nth(1)).toContainText('Refeição 1 – Líquida');await expect(items.nth(4)).toContainText('Refeição 2 – Sólida');
 await expect(page.locator('.schedule-item[data-next]')).toContainText('06:00');
 await page.getByRole('button',{name:/^Concluir 06:00/}).click();await expect(page.locator('.schedule-progress')).toContainText('500');
 await page.getByRole('button',{name:/^Concluir 07:00/}).click();await expect(page.locator('.schedule-progress')).toContainText('1/4');
 await expect(page.locator('.schedule-item[data-next]')).toContainText('08:00');
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
 await page.reload();await expect(page.getByRole('button',{name:/^Feito 06:00/})).toHaveAttribute('aria-pressed','true');
 await page.goto('/hidratacao');await expect(page.getByRole('heading',{name:'500 ml registrados'})).toBeVisible();
 await page.getByRole('button',{name:'Rotina do dia · horários'}).click();await expect(page.locator('.schedule-item:not([data-kind=training])')).toHaveCount(12);
 await page.locator('.schedule-item[data-kind=training]').getByRole('button').click();await expect(page.getByText('TREINAMENTO · 08:00')).toBeVisible();await page.goto('/rotina');
 await page.clock.setSystemTime(new Date('2026-11-28T09:00:00-03:00'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.locator('.schedule-progress')).toContainText('0/4');await expect(page.locator('.schedule-item[data-next]')).toContainText('06:00');
 await page.getByRole('button',{name:'Editar horários'}).click();await page.getByRole('group',{name:'Item 1',exact:true}).getByLabel('Horário').fill('05:45');
 await page.getByRole('group',{name:'Item 3',exact:true}).getByLabel('Volume (ml)').fill('600');await page.getByRole('button',{name:'Salvar rotina'}).click();
 await expect(page.locator('.schedule-item').first()).toContainText('05:45');await expect(page.locator('.schedule-item[data-kind=water]').nth(1)).toContainText('600 ml');
 await page.getByLabel('Consultar data',{exact:true}).fill('2026-11-27');await expect(page.locator('.schedule-progress')).toContainText('1/4');
});
