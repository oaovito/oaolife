import type { AppData, DailyLog } from './model';
import type { MealSnapshot, Nutrients, NutritionDay, NutritionReference, Protein, CurrentNutritionDay, PreviousNutritionDay, Serving, FruitKey, Chocolate } from './nutritionSchema';
import { LEGACY_MEALS, MEALS } from './plan';
import references from './nutritionReferences.json';
export const NUTRIENT_KEYS=['kcal','protein','carbs','fat'] as const;
export const DEFAULT_REFERENCES=references as Record<keyof AppData['nutritionOverrides'],NutritionReference>;
export const PROTEINS:Record<Protein,string>={chicken:'Frango',beef:'Carne',fish:'Peixe'};
type NutritionData=Pick<AppData,'nutritionOverrides'>&Partial<Pick<AppData,'foods'>>;
export function nutritionReference(data:NutritionData,key:keyof typeof DEFAULT_REFERENCES):NutritionReference {
 if(data.nutritionOverrides[key])return structuredClone(data.nutritionOverrides[key]!);
 const patterns:Record<typeof key,RegExp[]>={milk:[/leite/,/integral/],bread:[/pao/,/frances/],yogurt:[/iogurte/,/grego/],rice:[/arroz/,/branco|polido/,/cozid/],chicken:[/frango/,/peito/,/cozid|grelhad|assad/],beef:[/patinho/,/grelhad|cozid/],fish:[/tilapia/,/grelhad/],nescau:[/nescau/],toddy:[/toddy/],banana:[/banana/,/prata/],apple:[/maca/,/fuji/],orange:[/laranja/,/pera/]};
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
 return addNutrients(meal.foods.map(f=>Object.fromEntries(NUTRIENT_KEYS.map(key=>[key,f.reference.nutrients[key]===null||f.quantity===null?null:f.reference.nutrients[key]!*f.quantity/f.reference.quantity])) as Nutrients));
}
export function createPreviousNutrition(data:NutritionData,protein:Protein='chicken'):PreviousNutritionDay {
 const ref=(key:keyof typeof DEFAULT_REFERENCES)=>nutritionReference(data,key);
 const food=(key:keyof typeof DEFAULT_REFERENCES,quantity:number,label:string)=>({key,quantity,label,unit:ref(key).unit,reference:ref(key)});
 const bread=ref('bread');
 const breakfast=[food('milk',500,'500 ml de leite integral'),food('bread',2*(bread.gramsPerUnit??50),'2 pães franceses')];
 const yogurt=[food('yogurt',200,'200 g de iogurte Itambé Grego Flocos')];
 const foods=[breakfast,yogurt,breakfast,yogurt,[food('rice',200,'200 g de arroz branco cozido'),food(protein,200,`200 g de ${protein==='chicken'?'peito de frango':protein==='beef'?'carne bovina':'peixe'}`)]];
 return {version:'five-meals-1',protein,plan:foods.map((f,i)=>({title:MEALS[i].title,foods:structuredClone(f)})),consumed:Array(5).fill(null)};
}

export function serving(data:NutritionData,key:keyof typeof DEFAULT_REFERENCES,quantity:number|null,label?:string):Serving {
 const reference=nutritionReference(data,key);
 return {key,quantity,unit:reference.unit,reference,label:label??`${quantity??'Quantidade a informar'} ${reference.unit} de ${reference.name}`};
}
export function createNutrition(data:NutritionData,protein:Protein='chicken'):CurrentNutritionDay {
 const chocolateGrams=nutritionReference(data,'nescau').gramsPerUnit;
 return {version:'five-meals-2',protein,lunchProtein:'chicken',chocolate:'nescau',chocolateGrams,fruitPlan:null,fruitEntries:[],plan:[
  {title:'Refeição 1',foods:[serving(data,'yogurt',200),serving(data,'bread',2*(nutritionReference(data,'bread').gramsPerUnit??50),'2 pães franceses')]},
  {title:'Refeição 2',foods:[serving(data,'chicken',200),serving(data,'rice',200)]},
  {title:'Refeição 3',foods:[serving(data,'milk',500,'500 ml de leite integral'),serving(data,'nescau',chocolateGrams,'1 colher de sopa de Nescau')]},
  {title:'Refeição 4',foods:[]},
  {title:'Refeição 5',foods:[serving(data,protein,200),serving(data,'rice',200)]},
 ],consumed:Array(5).fill(null)};
}
export function mealsForDay(day:DailyLog) {
 return day.nutrition?day.nutrition.plan.map((m,i)=>({id:`m${i+1}`,title:m.title,foods:(day.nutrition!.consumed[i]?.meal??m).foods.map(f=>f.label)})):LEGACY_MEALS;
}
function current(day:DailyLog):CurrentNutritionDay {
 if(day.nutrition?.version!=='five-meals-2')throw Error('Esta operação pertence ao plano atual. O histórico foi preservado.');
 return day.nutrition;
}
export function setMealConsumed(day:DailyLog,index:number,consumed:boolean,at=new Date().toISOString()) {
 if(index<0||index>=5)throw Error('Refeição inválida.');
 if(day.meals[index].every(Boolean)===consumed)return;
 const n=day.nutrition;
 if(n?.version==='five-meals-2'&&index===3){
  if(consumed&&!n.fruitEntries.length)throw Error('Registre as frutas consumidas antes de concluir.');
  n.fruitEntries.forEach(f=>{f.counted=consumed;});
 }
 day.meals[index]=day.meals[index].map(()=>consumed);day.mealTimes[index]=consumed?at:null;
 syncMealRecord(day,index,at);
}
export function syncMealRecord(day:DailyLog,index:number,at=new Date().toISOString()) {
 const n=day.nutrition;if(!n)return;
 if(day.meals[index].every(Boolean)) {
  const meal=n.version==='five-meals-2'&&index===3?{title:'Refeição 4',foods:n.fruitEntries.filter(f=>f.counted).map(f=>f.serving)}:n.plan[index];
  n.consumed[index]??={at,meal:structuredClone(meal)};
 }else n.consumed[index]=null;
}
export function chooseProtein(day:DailyLog,protein:Protein,data:NutritionData,index:1|4=4) {
 const n=day.nutrition;if(!n)throw Error('Plano histórico sem seletor.');
 if(n.version==='five-meals-1'){
  if(index!==4)throw Error('Este plano histórico não possui seletor na refeição 2.');
  n.protein=protein;n.plan[4]=createPreviousNutrition(data,protein).plan[4];
 }else{
  if(index===1)n.lunchProtein=protein;else n.protein=protein;
  n.plan[index]={title:`Refeição ${index+1}`,foods:[serving(data,protein,200),serving(data,'rice',200)]};
 }
 if(!n.consumed[index]){day.meals[index]=[false,false];day.mealTimes[index]=null;}
}
export function chooseChocolate(day:DailyLog,chocolate:Chocolate,data:NutritionData,grams=nutritionReference(data,chocolate).gramsPerUnit) {
 const n=current(day);if(grams!==null&&(!Number.isFinite(grams)||grams<=0))throw Error('Informe um peso positivo para a colher.');
 n.chocolate=chocolate;n.chocolateGrams=grams;n.plan[2]={title:'Refeição 3',foods:[serving(data,'milk',500,'500 ml de leite integral'),serving(data,chocolate,grams,`1 colher de sopa de ${chocolate==='nescau'?'Nescau':'Toddy'}${grams===null?'':` (${grams} g)`}`)]};
 if(!n.consumed[2]){day.meals[2]=[false,false];day.mealTimes[2]=null;}
}
export function addFruit(day:DailyLog,data:NutritionData,key:FruitKey,quantity:number,unit:'g'|'unidade',planned=false,id:string=crypto.randomUUID(),at=new Date().toISOString()) {
 const n=current(day);if(!Number.isFinite(quantity)||quantity<=0)throw Error('Informe uma quantidade positiva.');
 if(!planned&&n.consumed[3])throw Error('Desfaça a conclusão para corrigir as frutas.');
 const ref=nutritionReference(data,key);if(unit==='unidade'&&!ref.gramsPerUnit)throw Error('Informe o peso em gramas ou cadastre o peso unitário.');
 const grams=unit==='g'?quantity:quantity*ref.gramsPerUnit!;
 const food=serving(data,key,grams,`${quantity} ${unit==='g'?'g':quantity===1?'unidade':'unidades'} de ${ref.name}${unit==='unidade'?` (${grams} g de referência)`:''}`);
 if(planned){n.fruitPlan??=[];n.fruitPlan.push(food);n.plan[3].foods=structuredClone(n.fruitPlan);}
 else if(!n.fruitEntries.some(f=>f.id===id)){n.fruitEntries.push({id,at,serving:food,counted:true});}
}
export function removeFruit(day:DailyLog,id:string) {
 const n=current(day);if(n.consumed[3])throw Error('Desfaça a conclusão para corrigir as frutas.');
 n.fruitEntries=n.fruitEntries.filter(f=>f.id!==id);
}
export function clearFruitPlan(day:DailyLog) {const n=current(day);n.fruitPlan=null;n.plan[3].foods=[];}
export function refreshNutritionPlan(day:DailyLog,data:NutritionData) {
 const n=day.nutrition;if(!n||n.version!=='five-meals-2')return;
 const checks=structuredClone(day.meals),times=[...day.mealTimes];
 const base=createNutrition(data,n.protein);n.plan[0]=base.plan[0];
 chooseProtein(day,n.lunchProtein,data,1);chooseProtein(day,n.protein,data,4);chooseChocolate(day,n.chocolate,data,n.chocolateGrams);
 day.meals=checks;day.mealTimes=times;
 // Fruit quantities and their references stay explicit; they are never inferred.
}
function consumedMeals(n:NutritionDay):MealSnapshot[] {
 const result=n.consumed.flatMap((r,i)=>r&&!(n.version==='five-meals-2'&&i===3)?[r.meal]:[]);
 if(n.version==='five-meals-2')result.push({title:'Frutas registradas',foods:n.fruitEntries.filter(f=>f.counted).map(f=>f.serving)});
 return result;
}
export function nutritionTotals(day:DailyLog) {
 const n=day.nutrition;if(!n)return null;
 const fruitUnplanned=n.version==='five-meals-2'&&n.fruitPlan===null;
 const subtotal=addNutrients(n.plan.map(mealNutrients));
 const unknown={kcal:null,protein:null,carbs:null,fat:null};
 const planned=fruitUnplanned?{...unknown}:subtotal;
 const archivedUnknown=!!day.previousNutrition&&(day.previousNutrition.meals.some(m=>m.some(Boolean))||!!day.previousNutrition.declaration);
 const allConsumed=[...consumedMeals(n),...day.archivedNutrition.flatMap(a=>consumedMeals(a.nutrition))];
 const consumed=archivedUnknown?{...unknown}:addNutrients(allConsumed.map(mealNutrients));
 const knownPlanned=n.plan.flatMap(m=>m.foods).reduce((sum,f)=>sum+(mealNutrients({title:'',foods:[f]}).kcal??0),0);
 const knownConsumed=allConsumed.flatMap(m=>m.foods).reduce((sum,f)=>sum+(mealNutrients({title:'',foods:[f]}).kcal??0),0);
 const complete=planned.kcal!==null&&consumed.kcal!==null;
 return {planned,subtotal,consumed,knownPlanned,knownConsumed,archivedUnknown,fruitUnplanned,remaining:complete?Math.max(0,planned.kcal!-consumed.kcal!):null,excess:complete?Math.max(0,consumed.kcal!-planned.kcal!):null,progress:complete?(planned.kcal!>0?consumed.kcal!/planned.kcal!*100:0):null,done:n.consumed.filter(Boolean).length};
}
export function activateNutrition(data:AppData,date:string) {
 const day=data.days.find(d=>d.id===date);if(!day||day.nutrition?.version==='five-meals-2')return;
 if(day.nutrition)day.archivedNutrition.push({nutrition:structuredClone(day.nutrition),meals:structuredClone(day.meals),mealTimes:[...day.mealTimes],declaration:day.declarations.meals??null});
 else day.previousNutrition??={meals:structuredClone(day.meals),mealTimes:[...day.mealTimes],declaration:day.declarations.meals??null};
 day.nutrition=createNutrition(data);day.meals=MEALS.map(m=>m.foods.map(()=>false));day.mealTimes=Array(5).fill(null);delete day.declarations.meals;
}
