import { test, expect, type Page } from '@playwright/test';
import { makeDay, setMealConsumedAll } from './seed';

async function readState(page:Page){return page.evaluate(()=>new Promise<any>((resolve,reject)=>{const r=indexedDB.open('oaolife');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('state'),get=tx.objectStore('state').get('main');get.onsuccess=()=>resolve(get.result);tx.oncomplete=()=>db.close();};}));}
async function writeState(page:Page,state:any){await page.evaluate(s=>new Promise<void>((resolve,reject)=>{const r=indexedDB.open('oaolife');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(s);tx.oncomplete=()=>{db.close();resolve();};};}),state);}

// Duas semanas de registros reais (16–29/11/2026): segunda semana mais cumprida que a primeira.
async function seed(page:Page,{sundayCardio=true,sundayWeight=true}={}){
 await page.goto('/');await expect(page.locator('.ops-header h1')).toBeVisible();
 const state=await readState(page),data=state.data;
 for(let i=0;i<14;i++){
  const date=new Date(Date.UTC(2026,10,16+i,12)).toISOString().slice(0,10),day=makeDay(data,date);
  const strong=i>=7,weekday=(i+1)%7; // 16/11 é segunda
  if(strong||i%2===0)setMealConsumedAll(day);
  if(day.hydration)day.hydration.entries=[{id:`w${i}`,ml:strong?4000:2500,at:`${date}T12:00:00.000Z`}];
  const cardioDay=day.cardio.planned!==null,isLastSunday=i===13;
  if(cardioDay&&(strong||i%3===0)&&(!isLastSunday||sundayCardio)){day.cardio.elapsed=3600;day.cardio.speed=5;day.cardio.status='complete';}
  if(strong||i%2===1){const ex=day.mobility.protocol!.exercises[0];day.mobility.sequences[ex.id]={elapsed:420,runningSince:null,completedAt:`${date}T12:00:00.000Z`};for(let s=0;s<4;s++)day.mobility.sets[`${ex.id}:${s}`]={done:true,seconds:60,runningSince:null,discomfort:null,pain:null,notes:''};}
  if(weekday===1||weekday===4)day.declarations.hormonal={at:`${date}T12:00:00.000Z`,note:'Teste'};
  data.days=data.days.filter((d:any)=>d.id!==date);data.days.push(day);
 }
 data.measurements.push({id:'m1',date:'2026-11-22',weight:85.4,waist:null,systolic:null,diastolic:null,restingHR:null,body:'',notes:''});
 if(sundayWeight)data.measurements.push({id:'m2',date:'2026-11-29',weight:84.6,waist:null,systolic:null,diastolic:null,restingHR:null,body:'',notes:''});
 await writeState(page,{...state,revision:state.revision+1,data});await page.reload();
}

test.beforeEach(async({page})=>{await page.clock.install({time:new Date('2026-11-29T20:00:00-03:00')});});

test('domingo: pesagem na tela inicial, relatório liberado após o cardio e acessível em Evolução',async({page})=>{
 await seed(page,{sundayWeight:false});
 const weigh=page.getByRole('form',{name:'Pesagem de domingo'});await expect(weigh).toBeVisible();
 await page.getByLabel('Peso de domingo (kg)').fill('84,6');await weigh.getByRole('button',{name:'Registrar'}).click();
 await expect(page.getByLabel('Pesagem de domingo')).toContainText('84,6');
 await expect(page.getByRole('button',{name:/^Registro hormonal:/})).toHaveCount(0);
 if(process.env.SHOTS)await page.screenshot({path:test.info().outputPath('home.png')});await page.getByRole('button',{name:/Relatório da semana disponível/}).click();
 await expect(page.getByRole('tab',{name:'Relatórios'})).toHaveAttribute('aria-selected','true');
 await expect(page.getByText(/RELATÓRIO · 23 de nov\. A 29 de nov\./)).toBeVisible();
 await expect(page.getByRole('table',{name:'Comparação semanal'})).toContainText('Peso de domingo');
 await expect(page.getByRole('table',{name:'Comparação semanal'})).toContainText('84,6');
 await page.reload();expect((await readState(page)).data.measurements.find((m:any)=>m.date==='2026-11-29').weight).toBe(84.6);
 await page.getByRole('tab',{name:'Situação'}).click();await expect(page.getByRole('heading',{name:'Cardio'})).toBeVisible();
 await page.getByRole('tab',{name:'Relatórios'}).click();if(process.env.SHOTS)for(let i=0;i<await page.locator('.panel').count();i++)await page.locator('.panel').nth(i).screenshot({path:test.info().outputPath(`relatorio-${i}.png`)});await page.getByRole('tab',{name:'Situação'}).click();if(process.env.SHOTS)for(let i=0;i<await page.locator('.panel').count();i++)await page.locator('.panel').nth(i).screenshot({path:test.info().outputPath(`situacao-${i}.png`)});const width=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);expect(width).toBeLessThanOrEqual(0);
});

test('relatório da semana só é liberado depois do cardio de domingo',async({page})=>{
 await seed(page,{sundayCardio:false});
 await expect(page.getByRole('button',{name:/Relatório da semana disponível/})).toHaveCount(0);
 await page.goto('/evolucao');await page.getByRole('tab',{name:'Relatórios'}).click();
 await expect(page.getByText(/é liberado depois do cardio de domingo/)).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Semana'})).toContainText('16 de nov. a 22 de nov.');
});
