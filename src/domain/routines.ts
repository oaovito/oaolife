import type { DailyLog } from './model';

// Blocos de rotina (26/11/2026, proprietário): itens fixos por dia da semana, marcados com um toque.
// Valem a partir de ROUTINES_SINCE; dias anteriores não mudam. Novos itens entram aqui, com a data
// em que passam a valer (`since`), sem alterar dias já registrados.
export const ROUTINES_SINCE='2026-11-26';
export type RoutineBlock='mancare'|'casa';
export interface RoutineStep {key:string;label:string}
// `steps`: item com etapas em ordem fixa; só conclui com todas. Sem `steps`, o item é uma etapa única.
export interface RoutineItem {id:string;name:string;weekdays:number[];since:string;steps?:RoutineStep[]}
const EVERY_DAY=[0,1,2,3,4,5,6];
// Máquina de roupa (26/11/2026): segunda, quarta e sexta; duas máquinas, cada uma lavar → estender →
// recolher → dobrar → guardar. Cada etapa é registrada em `routines` sob `roupa.<máquina>.<etapa>`.
export const LAUNDRY_LOADS=2;
export const LAUNDRY_STEPS=[['lavar','Lavar'],['estender','Estender'],['recolher','Recolher'],['dobrar','Dobrar'],['guardar','Guardar']] as const;
const laundrySteps:RoutineStep[]=Array.from({length:LAUNDRY_LOADS},(_,m)=>LAUNDRY_STEPS.map(([k,l])=>({key:`roupa.${m+1}.${k}`,label:`Máquina ${m+1} · ${l}`}))).flat();
export const ROUTINE_BLOCKS:Record<RoutineBlock,{title:string;items:RoutineItem[]}>={
 mancare:{title:'ManCare',items:[{id:'barba',name:'Barba',weekdays:[0],since:ROUTINES_SINCE}]},
 casa:{title:'Cuidado Casa',items:[
  {id:'louca',name:'Louça',weekdays:EVERY_DAY,since:ROUTINES_SINCE},
  {id:'lixo',name:'Lixo',weekdays:EVERY_DAY,since:ROUTINES_SINCE},
  {id:'roupa',name:'Máquina de roupa',weekdays:[1,3,5],since:'2026-11-26',steps:laundrySteps},
 ]},
};
export const ROUTINE_KEYS=Object.keys(ROUTINE_BLOCKS) as RoutineBlock[];
const weekday=(date:string)=>new Date(date+'T12:00:00Z').getUTCDay();
export function routineItems(block:RoutineBlock,date:string):RoutineItem[]{
 return ROUTINE_BLOCKS[block].items.filter(i=>date>=i.since&&i.weekdays.includes(weekday(date)));
}
export const routineSteps=(item:RoutineItem):RoutineStep[]=>item.steps??[{key:item.id,label:item.name}];
export function routineProgress(day:DailyLog|undefined,item:RoutineItem){
 const steps=routineSteps(item),done=steps.filter(s=>!!day?.routines[s.key]?.done).length;
 return {done,total:steps.length,next:steps.find(s=>!day?.routines[s.key]?.done)??null,last:[...steps].reverse().find(s=>!!day?.routines[s.key]?.done)??null};
}
export function routineDone(day:DailyLog|undefined,item:RoutineItem){const p=routineProgress(day,item);return p.done===p.total;}
function scheduled(day:DailyLog,block:RoutineBlock,itemId:string){
 const item=routineItems(block,day.id).find(i=>i.id===itemId);if(!item)throw Error('Item fora da rotina deste dia.');return item;
}
// Item simples: marca ou desmarca. Item com etapas: registra a próxima etapa pendente, na ordem fixa;
// com todas registradas, o toque desfaz a última (correção).
export function toggleRoutine(day:DailyLog,block:RoutineBlock,itemId:string,at:string){
 const item=scheduled(day,block,itemId);
 if(!item.steps){const done=!day.routines[item.id]?.done;day.routines[item.id]={done,at:done?at:null};return;}
 const p=routineProgress(day,item);
 if(p.next)day.routines[p.next.key]={done:true,at};else if(p.last)day.routines[p.last.key]={done:false,at:null};
}
// Desfaz a última etapa registrada de um item com etapas.
export function undoRoutineStep(day:DailyLog,block:RoutineBlock,itemId:string){
 const last=routineProgress(day,scheduled(day,block,itemId)).last;if(last)day.routines[last.key]={done:false,at:null};
}
