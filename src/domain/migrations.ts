import { applyCardioPlan, cardioTarget } from './cardio';
import type { AppData } from './model';
import type { Serving } from './nutritionSchema';
import { NUTRIENT_KEYS, nutritionReference } from './nutrition';
import { now, reshapeOpenSession } from './training';

// Migração 9 (26/11/2026). Idempotente: identificada pelo ajuste MIGRATION_9.
// 1. Meta calórica padrão anterior (2525) passa à meta solicitada (2000) para hoje e dias futuros.
//    Dias passados mantêm a meta registrada.
// 2. Referências nutricionais desconhecidas do plano de quatro refeições são completadas
//    com TACO/TBCA. Quantidades prescritas nunca são alteradas.
// 3. Sessões abertas de hoje em diante recebem o número de séries do plano vigente,
//    sem apagar séries com qualquer dado.
export const MIGRATION_9='migration-9-2026-11-26';
const LEGACY_DEFAULT_CALORIES=2525;
export function migrationPending(data:AppData){return !data.adjustments.some(a=>a.id===MIGRATION_9);}
function complete(data:AppData,food:Serving):Serving {
 const missing=NUTRIENT_KEYS.some(k=>food.reference.nutrients[k]===null);if(!missing)return food;
 const next=nutritionReference(data,food.key);
 if(next.unit!==food.unit||NUTRIENT_KEYS.some(k=>next.nutrients[k]===null))return food;
 return {...food,reference:next};
}
export function completeNutritionReferences(data:AppData,day:AppData['days'][number]):boolean {
 const n=day.nutrition;if(n?.version!=='four-meals-1')return false;
 const before=JSON.stringify(n);
 n.plan=n.plan.map(m=>({...m,foods:m.foods.map(f=>complete(data,f))}));
 n.consumed=n.consumed.map(r=>r&&{...r,meal:{...r.meal,foods:r.meal.foods.map(f=>complete(data,f))}});
 return JSON.stringify(n)!==before;
}
export function migrateV9(data:AppData,date:string):boolean {
 if(!migrationPending(data))return false;
 const changes:string[]=[];
 if(data.settings.calorieGoal===LEGACY_DEFAULT_CALORIES){data.settings.calorieGoal=2000;changes.push('meta calórica 2525 → 2000 kcal');}
 for(const day of data.days){
  if(day.id>=date&&day.nutrition?.version==='four-meals-1'&&day.nutrition.calorieGoal===LEGACY_DEFAULT_CALORIES)day.nutrition.calorieGoal=data.settings.calorieGoal;
  if(completeNutritionReferences(data,day))changes.push(`referências nutricionais ${day.id}`);
 }
 for(const session of data.sessions)if(session.date>=date&&reshapeOpenSession(data,session))changes.push(`séries ${session.date}`);
 // Cardio rígido (seg, ter, qui, sex, dom · 60 min = 300 min/semana): dias de hoje em diante ainda não concluídos
 // recebem a nova meta; tempo, velocidade e observações registrados são preservados.
 for(const day of data.days)if(day.id>=date&&day.cardio.planVersion==='weekly-360'&&day.cardio.status!=='complete'&&day.cardio.planned!==cardioTarget(day.id)){applyCardioPlan(day.cardio,day.id);changes.push(`cardio ${day.id}`);}
 data.adjustments.push({id:MIGRATION_9,at:now(),kind:'Atualização 9',detail:changes.length?changes.join('; '):'Sem alterações de dados necessárias.'});
 return true;
}
