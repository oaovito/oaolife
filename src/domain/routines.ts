import type { DailyLog } from './model';

// Blocos de rotina (26/11/2026, proprietário): itens fixos por dia da semana, marcados com um toque.
// Valem a partir de ROUTINES_SINCE; dias anteriores não mudam. Novos itens entram aqui, com a data
// em que passam a valer (`since`), sem alterar dias já registrados.
export const ROUTINES_SINCE='2026-11-26';
export type RoutineBlock='despertar'|'mancare'|'casa';
// Despertar (26/11/2026, proprietário): horário fixo de acordar, 06:00, todos os dias, a partir de 27/11/2026.
export const WAKE_TIME='06:00';
// `legacy`: chaves de um registro anterior que também contam como item concluído (nada é apagado).
export interface RoutineItem {id:string;name:string;weekdays:number[];since:string;legacy?:string[]}
const EVERY_DAY=[0,1,2,3,4,5,6];
// Roupa (27/11/2026, proprietário): segunda, quarta e sexta, duas caixas, "Roupa 1" e "Roupa 2", um toque cada.
// Substitui a Máquina de roupa em etapas (26/11/2026): um dia já registrado com as 5 etapas de uma máquina
// (`roupa.<N>.<etapa>`) conta como Roupa N concluída; os registros antigos permanecem.
export const LEGACY_LAUNDRY_STEPS=['lavar','estender','recolher','dobrar','guardar'] as const;
const laundry=(n:number):RoutineItem=>({id:`roupa${n}`,name:`Roupa ${n}`,weekdays:[1,3,5],since:'2026-11-26',legacy:LEGACY_LAUNDRY_STEPS.map(k=>`roupa.${n}.${k}`)});
export const ROUTINE_BLOCKS:Record<RoutineBlock,{title:string;items:RoutineItem[]}>={
 despertar:{title:'Despertar',items:[{id:'despertar',name:`Despertar ${WAKE_TIME}`,weekdays:EVERY_DAY,since:'2026-11-27'}]},
 mancare:{title:'ManCare',items:[{id:'barba',name:'Barba',weekdays:[0],since:ROUTINES_SINCE}]},
 casa:{title:'Cuidado Casa',items:[
  {id:'louca',name:'Louça',weekdays:EVERY_DAY,since:ROUTINES_SINCE},
  {id:'lixo',name:'Lixo',weekdays:EVERY_DAY,since:ROUTINES_SINCE},
  // Aspirador (26/11/2026): terças e quintas.
  {id:'aspirador',name:'Aspirador',weekdays:[2,4],since:'2026-11-26'},
  laundry(1),laundry(2),
 ]},
};
export const ROUTINE_KEYS=Object.keys(ROUTINE_BLOCKS) as RoutineBlock[];
const weekday=(date:string)=>new Date(date+'T12:00:00Z').getUTCDay();
export function routineItems(block:RoutineBlock,date:string):RoutineItem[]{
 return ROUTINE_BLOCKS[block].items.filter(i=>date>=i.since&&i.weekdays.includes(weekday(date)));
}
export function routineDone(day:DailyLog|undefined,item:RoutineItem){
 return !!day?.routines[item.id]?.done||(!!item.legacy?.length&&item.legacy.every(k=>!!day?.routines[k]?.done));
}
function scheduled(day:DailyLog,block:RoutineBlock,itemId:string){
 const item=routineItems(block,day.id).find(i=>i.id===itemId);if(!item)throw Error('Item fora da rotina deste dia.');return item;
}
// Marca ou desmarca o item. Desmarcar (correção) também desfaz o registro antigo equivalente, sem apagá-lo.
export function toggleRoutine(day:DailyLog,block:RoutineBlock,itemId:string,at:string){
 const item=scheduled(day,block,itemId),done=!routineDone(day,item);
 day.routines[item.id]={done,at:done?at:null};
 if(!done)for(const k of item.legacy??[])if(day.routines[k]?.done)day.routines[k]={done:false,at:null};
}
