import type { DailyLog } from './model';

// Blocos de rotina (26/11/2026, proprietário): itens fixos por dia da semana, marcados com um toque.
// Valem a partir de ROUTINES_SINCE; dias anteriores não mudam. Novos itens entram aqui, com a data
// em que passam a valer (`since`), sem alterar dias já registrados.
export const ROUTINES_SINCE='2026-11-26';
export type RoutineBlock='mancare'|'casa';
export interface RoutineItem {id:string;name:string;weekdays:number[];since:string}
const EVERY_DAY=[0,1,2,3,4,5,6];
export const ROUTINE_BLOCKS:Record<RoutineBlock,{title:string;items:RoutineItem[]}>={
 mancare:{title:'ManCare',items:[{id:'barba',name:'Barba',weekdays:[0],since:ROUTINES_SINCE}]},
 casa:{title:'Cuidado Casa',items:[{id:'louca',name:'Louça',weekdays:EVERY_DAY,since:ROUTINES_SINCE},{id:'lixo',name:'Lixo',weekdays:EVERY_DAY,since:ROUTINES_SINCE}]},
};
export const ROUTINE_KEYS=Object.keys(ROUTINE_BLOCKS) as RoutineBlock[];
const weekday=(date:string)=>new Date(date+'T12:00:00Z').getUTCDay();
export function routineItems(block:RoutineBlock,date:string):RoutineItem[]{
 return ROUTINE_BLOCKS[block].items.filter(i=>date>=i.since&&i.weekdays.includes(weekday(date)));
}
export function routineDone(day:DailyLog|undefined,itemId:string){return !!day?.routines[itemId]?.done;}
// Marca ou desmarca um item programado para o dia.
export function toggleRoutine(day:DailyLog,block:RoutineBlock,itemId:string,at:string){
 if(!routineItems(block,day.id).some(i=>i.id===itemId))throw Error('Item fora da rotina deste dia.');
 const done=!day.routines[itemId]?.done;
 day.routines[itemId]={done,at:done?at:null};
}
