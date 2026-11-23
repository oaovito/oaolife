import type { AppData, DailyLog } from './model';
export const waterConsumed=(day:DailyLog)=>day.water.reduce((a,v)=>a+v,0)+(day.hydration?.entries.reduce((a,e)=>a+e.ml,0)??0);
export const waterGoal=(day:DailyLog)=>day.hydration?.target??day.waterTargets.reduce((a,v)=>a+v,0);
export function activateHydration(data:AppData,date:string){const day=data.days.find(d=>d.id===date);if(day&&!day.hydration)day.hydration={version:'liquids-1',target:data.settings.hydrationTarget,bottle:data.settings.bottleVolume,entries:[]};}
export function addWater(day:DailyLog,ml:number,id:string=crypto.randomUUID(),at=new Date().toISOString()){
 if(!day.hydration)throw Error('Registro histórico: use os controles das garrafas.');
 if(!Number.isFinite(ml)||ml<=0||ml>5000)throw Error('Informe um volume entre 0 e 5.000 ml.');
 if(!day.hydration.entries.some(e=>e.id===id))day.hydration.entries.push({id,ml,at});
}
export function editWater(day:DailyLog,id:string,ml:number){
 if(!Number.isFinite(ml)||ml<0||ml>5000)throw Error('Volume inválido.');
 if(!day.hydration)throw Error('Registro não encontrado.');
 if(ml===0)day.hydration.entries=day.hydration.entries.filter(e=>e.id!==id);
 else {const e=day.hydration.entries.find(e=>e.id===id);if(!e)throw Error('Registro não encontrado.');e.ml=ml;}
}
