import type { AppData, DailyLog } from './model';
import type { MealSnapshot, Nutrients, NutritionDay, NutritionReference, Protein } from './nutritionSchema';
import { LEGACY_MEALS, MEALS } from './plan';
import references from './nutritionReferences.json';
export const NUTRIENT_KEYS=['kcal','protein','carbs','fat'] as const;
export const DEFAULT_REFERENCES=references as Record<keyof AppData['nutritionOverrides'],NutritionReference>;
export const PROTEINS:Record<Protein,string>={chicken:'Frango',beef:'Carne',fish:'Peixe'};
type NutritionData=Pick<AppData,'nutritionOverrides'>&Partial<Pick<AppData,'foods'>>;
export function nutritionReference(data:NutritionData,key:keyof typeof DEFAULT_REFERENCES):NutritionReference {
 if(data.nutritionOverrides[key])return structuredClone(data.nutritionOverrides[key]!);
 const patterns:Record<typeof key,RegExp[]>={milk:[/leite/,/integral/],bread:[/pao/,/frances/],yogurt:[/itambe/,/grego/,/flocos/],rice:[/arroz/,/branco|polido/,/cozid/],chicken:[/frango/,/peito/,/cozid|grelhad|assad/],beef:[/patinho/,/grelhad|cozid/],fish:[/tilapia/,/grelhad/]};
 const base=DEFAULT_REFERENCES[key];
 const registered=[...(data.foods??[])].reverse().find(f=>{
  const name=(f.name+' '+f.brand).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return f.certainty==='confirmado'&&!!f.source.trim()&&f.unit===base.unit&&patterns[key].every(p=>p.test(name))&&NUTRIENT_KEYS.every(k=>f[k]!==null);
 });
 if(registered)return {...structuredClone(base),name:registered.name,quantity:registered.quantity,nutrients:{kcal:registered.kcal,protein:registered.protein,carbs:registered.carbs,fat:registered.fat},source:registered.source,certainty:'confirmado',note:'Referência confirmada do cadastro nutricional deste dispositivo. '+(key==='bread'?'Peso unitário de referência: 50 g; ajuste se necessário.':'')};
 return structuredClone(base);
}

export function addNutrients(values:Nutrients[]):Nutrients {
 return Object.fromEntries(NUTRIENT_KEYS.map(key=>[key,values.some(v=>v[key]===null)?null:values.reduce((sum,v)=>sum+(v[key]??0),0)])) as Nutrients;
}
export function mealNutrients(meal:MealSnapshot):Nutrients {
 return addNutrients(meal.foods.map(f=>Object.fromEntries(NUTRIENT_KEYS.map(key=>[key,f.reference.nutrients[key]===null?null:f.reference.nutrients[key]!*f.quantity/f.reference.quantity])) as Nutrients));
}
export function createNutrition(data:NutritionData,protein:Protein='chicken'):NutritionDay {
 const ref=(key:keyof typeof DEFAULT_REFERENCES)=>nutritionReference(data,key);
 const food=(key:keyof typeof DEFAULT_REFERENCES,quantity:number,label:string)=>({key,quantity,label,unit:ref(key).unit,reference:ref(key)});
 const bread=ref('bread');
 const breakfast=[food('milk',500,'500 ml de leite integral'),food('bread',2*(bread.gramsPerUnit??50),'2 pães franceses')];
 const yogurt=[food('yogurt',200,'200 g de iogurte Itambé Grego Flocos')];
 const foods=[breakfast,yogurt,breakfast,yogurt,[food('rice',200,'200 g de arroz branco cozido'),food(protein,200,`200 g de ${protein==='chicken'?'peito de frango':protein==='beef'?'carne bovina':'peixe'}`)]];
 return {version:'five-meals-1',protein,plan:foods.map((f,i)=>({title:MEALS[i].title,foods:structuredClone(f)})),consumed:Array(5).fill(null)};
}
export function mealsForDay(day:DailyLog) {
 return day.nutrition?day.nutrition.plan.map((m,i)=>({id:`m${i+1}`,title:m.title,foods:(day.nutrition!.consumed[i]?.meal??m).foods.map(f=>f.label)})):LEGACY_MEALS;
}
export function setMealConsumed(day:DailyLog,index:number,consumed:boolean,at=new Date().toISOString()) {
 if(index<0||index>=5)throw Error('Refeição inválida.');
 if(day.meals[index].every(Boolean)===consumed)return;
 day.meals[index]=day.meals[index].map(()=>consumed);day.mealTimes[index]=consumed?at:null;
 syncMealRecord(day,index,at);
}
export function syncMealRecord(day:DailyLog,index:number,at=new Date().toISOString()) {
 if(!day.nutrition)return;
 if(day.meals[index].every(Boolean))day.nutrition.consumed[index]??={at,meal:structuredClone(day.nutrition.plan[index])};
 else day.nutrition.consumed[index]=null;
}
export function chooseProtein(day:DailyLog,protein:Protein,data:NutritionData) {
 if(!day.nutrition)throw Error('O plano histórico não pode ser substituído.');
 const next=createNutrition(data,protein);day.nutrition.protein=protein;day.nutrition.plan[4]=next.plan[4];
 // A recorded meal owns its snapshot, independently of subsequent planning.
 if(!day.nutrition.consumed[4]){day.meals[4]=[false,false];day.mealTimes[4]=null;}
}
export function nutritionTotals(day:DailyLog) {
 if(!day.nutrition)return null;
 const planned=addNutrients(day.nutrition.plan.map(mealNutrients));
 const archivedUnknown=!!day.previousNutrition&&(day.previousNutrition.meals.some(m=>m.some(Boolean))||!!day.previousNutrition.declaration);
 const consumed=archivedUnknown?{kcal:null,protein:null,carbs:null,fat:null}:addNutrients(day.nutrition.consumed.flatMap(r=>r?[mealNutrients(r.meal)]:[]));
 const knownPlanned=day.nutrition.plan.reduce((n,m)=>n+(mealNutrients(m).kcal??0),0);
 const knownConsumed=day.nutrition.consumed.reduce((n,r)=>n+(r?mealNutrients(r.meal).kcal??0:0),0);
 const complete=planned.kcal!==null&&consumed.kcal!==null;
 return {planned,consumed,knownPlanned,knownConsumed,archivedUnknown,remaining:complete?Math.max(0,planned.kcal!-consumed.kcal!):null,excess:complete?Math.max(0,consumed.kcal!-planned.kcal!):null,progress:complete?(planned.kcal!>0?consumed.kcal!/planned.kcal!*100:0):null,done:day.nutrition.consumed.filter(Boolean).length};
}
// Existing days keep the old plan. Only today's active plan is replaced, with
// its original checklist/timestamps/declaration archived alongside the new one.
export function activateNutrition(data:AppData,date:string) {
 const day=data.days.find(d=>d.id===date);if(!day||day.nutrition)return;
 day.previousNutrition={meals:structuredClone(day.meals),mealTimes:[...day.mealTimes],declaration:day.declarations.meals??null};
 day.nutrition=createNutrition(data);day.meals=day.nutrition.plan.map(m=>m.foods.map(()=>false));day.mealTimes=Array(5).fill(null);delete day.declarations.meals;
}
