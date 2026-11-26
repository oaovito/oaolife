// Montagem de dados de teste com as funções reais do domínio (sem fabricar estrutura à mão).
import { makeDay as domainMakeDay } from '../src/domain/daily';
import { setMealConsumed } from '../src/domain/nutrition';
import type { AppData, DailyLog } from '../src/domain/model';
export function makeDay(data:AppData,date:string){return domainMakeDay(data,date);}
export function setMealConsumedAll(day:DailyLog){day.meals.forEach((_,i)=>setMealConsumed(day,i,true,`${day.id}T12:00:00.000Z`));}
