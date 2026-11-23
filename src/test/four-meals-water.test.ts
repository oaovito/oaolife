import { expect,it } from 'vitest';
import { emptyData,makeDay,toggleFood,summaries } from '../domain/daily';
import { activateNutrition,createFiveMealNutrition,knownNutrients,nutritionTotals,setMealConsumed,refreshNutritionPlan } from '../domain/nutrition';
import { activateHydration,addWater,editWater,waterConsumed,waterGoal } from '../domain/hydration';
import { appDataSchema } from '../domain/model';
import { assertIntegrity,initialize,OaoDatabase } from '../storage/db';
import { today } from '../domain/training';
it('quatro refeições com pesos oficiais e subtotal verificado sem preencher dados ausentes',()=>{
 const data=emptyData(),day=makeDay(data,today());data.days.push(day);
 expect(day.nutrition!.plan.map(m=>m.foods.map(f=>f.quantity))).toEqual([[200,300,40,50],[200,250,150,10],[200,300,40,30],[180,200,150,5]]);
 expect(day.nutrition!.plan.filter(m=>m.title.includes('líquida'))).toHaveLength(2);
 for(const key of ['banana','yogurt','milk','whey','beans','strawberry','skyr'])expect(day.nutrition!.plan.flatMap(m=>m.foods.map(f=>f.key))).not.toContain(key);
 const known=knownNutrients(day.nutrition!.plan);expect(known.kcal).toBeCloseTo(1993.2);expect(known.protein).toBeCloseTo(179.13);expect(known.carbs).toBeCloseTo(222.13);expect(known.fat).toBeCloseTo(41.82);
 expect(nutritionTotals(day)!.planned.kcal).toBeNull();expect(nutritionTotals(day)!.consumed.kcal).toBe(0);assertIntegrity(data);
});
it('consumo só conta refeição inteira e rótulos futuros não reescrevem consumo',()=>{
 const data=emptyData(),day=makeDay(data,today());const n=day.nutrition!;
 for(const key of ['greekNatural','skimMilk','vegetables','oliveOil'] as const){const f=n.plan.flatMap(m=>m.foods).find(f=>f.key===key)!;data.nutritionOverrides[key]={...f.reference,nutrients:{kcal:100,protein:10,carbs:10,fat:1},source:'SINTÉTICO — teste',certainty:'confirmado'};}
 refreshNutritionPlan(day,data);toggleFood(day,0,0);expect(nutritionTotals(day)!.consumed.kcal).toBe(0);
 setMealConsumed(day,0,true);expect(nutritionTotals(day)!.consumed.kcal).toBeCloseTo(841.8);const saved=structuredClone(n.consumed[0]);
 data.nutritionOverrides.greekNatural!.nutrients.kcal=500;refreshNutritionPlan(day,data);expect(n.consumed[0]).toEqual(saved);expect(waterConsumed(day)).toBe(0);
 setMealConsumed(day,0,false);expect(nutritionTotals(day)!.consumed.kcal).toBe(0);
});
it('água aceita adição, deduplicação por ID, correção e exclusão sem afetar refeições',()=>{
 const data=emptyData(),day=makeDay(data,today());data.days.push(day);expect(waterGoal(day)).toBe(4000);expect(waterGoal(day)/day.hydration!.bottle).toBe(8);
 for(let i=0;i<5;i++)addWater(day,500,`b${i}`);addWater(day,500,'b0');expect(waterConsumed(day)).toBe(2500);expect(waterConsumed(day)/waterGoal(day)*100).toBe(62.5);expect(waterGoal(day)-waterConsumed(day)).toBe(1500);
 day.hydration!.bottle=600;expect(waterConsumed(day)/day.hydration!.bottle).toBeCloseTo(4.1666666667);editWater(day,'b0',275);expect(waterConsumed(day)).toBe(2275);editWater(day,'b0',0);expect(waterConsumed(day)).toBe(2000);
 expect(day.meals.flat().some(Boolean)).toBe(false);expect(()=>addWater(day,-1)).toThrow();expect(()=>editWater(day,'b1',NaN)).toThrow();assertIntegrity(data);
 const next=makeDay(data,'2026-12-01');expect(waterConsumed(next)).toBe(0);expect(next.nutrition!.consumed.filter(Boolean)).toHaveLength(0);expect(waterConsumed(day)).toBe(2000);
});
it('migração arquiva somente hoje e é idempotente inclusive na reabertura',async()=>{
 const data=emptyData(),day=makeDay(data,today());day.nutrition=createFiveMealNutrition(data);day.meals=day.nutrition.plan.map((m,i)=>i===3?[false]:m.foods.map(()=>false));day.mealTimes=Array(5).fill(null);day.hydration=null;setMealConsumed(day,0,true);day.water[0]=275;
 const past=structuredClone(day);past.id='2026-10-01';data.days=[past,day];const historical=structuredClone(past);const untouched=structuredClone([data.profile,data.sessions,data.decisions,day.cardio,day.mobility]);
 const db=new OaoDatabase(`four-${crypto.randomUUID()}`);try{await db.state.put({id:'main',revision:4,data});await initialize(db);const saved=(await db.state.get('main'))!;expect(saved.data.days[0]).toEqual(historical);const current=saved.data.days[1];expect(current.archivedNutrition).toHaveLength(1);expect(nutritionTotals(current)!.consumed.kcal).toBe(494);expect(waterConsumed(current)).toBe(275);expect(summaries(saved.data,current.id).meals.total).toBe(4);await initialize(db);expect(await db.state.get('main')).toEqual(saved);expect([saved.data.profile,saved.data.sessions,saved.data.decisions,current.cardio,current.mobility]).toEqual(untouched);assertIntegrity(saved.data);}finally{await db.delete();}
 activateNutrition(data,day.id);activateHydration(data,day.id);const snapshot=structuredClone(data);activateNutrition(data,day.id);activateHydration(data,day.id);expect(data).toEqual(snapshot);expect(appDataSchema.parse(data).schemaVersion).toBe(8);
});

it('rejeita backup com histórico de comprimento incompatível',()=>{const data=emptyData(),day=makeDay(data,today());data.days.push(day);day.archivedNutrition.push({nutrition:structuredClone(day.nutrition!),meals:Array.from({length:5},()=>[false,false,false,false]),mealTimes:Array(5).fill(null),declaration:null});expect(appDataSchema.safeParse(data).success).toBe(false);});
