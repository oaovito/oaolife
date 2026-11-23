import { mealNutrients } from '../domain/nutrition';
import type { MealSnapshot, Nutrients } from '../domain/nutritionSchema';
export const nutrientText=(v:number|null,unit='g')=>v===null?'Não informado':`${v.toLocaleString('pt-BR',{maximumFractionDigits:unit==='kcal'?0:1})} ${unit}`;
export function Macros({value}:{value:Nutrients}) {return <dl className="meal-macros">{([['protein','Proteínas'],['carbs','Carboidratos'],['fat','Gorduras']] as const).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{nutrientText(value[key])}</dd></div>)}</dl>;}
export function FoodDetails({meal}:{meal:MealSnapshot}) {return <>{meal.foods.map((f,j)=><div className="food-reference" key={j}><strong>{f.label}</strong><p>{f.reference.name} · {f.quantity??'Quantidade pendente'} {f.unit} · {nutrientText(mealNutrients({title:'',foods:[f]}).kcal,'kcal')}</p><Macros value={mealNutrients({title:'',foods:[f]})}/><p>{f.reference.note}</p><p className="source-text">{f.reference.source}</p></div>)}</>;}
