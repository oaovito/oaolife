import { LEGACY_MEALS } from '../domain/plan';
import { makeDay, toggleFood } from '../domain/daily';
import { knownNutrients, mealNutrients, nutritionTotals, setMealConsumed } from '../domain/nutrition';
import { editDay } from '../storage/db';
import { FoodDetails, Macros, nutrientText } from './NutritionDetails';
import { CheckButton, Metric, PageTitle, Panel, Progress, type PageProps } from './shared';
const preparation=['Bata no liquidificador. Água ou gelo são opcionais.','Pese frango, arroz e legumes após preparo; contabilize o azeite separadamente.','Bata no liquidificador. Canela ou essência de baunilha sem açúcar são opcionais.','Pese patinho, arroz e legumes após preparo; contabilize o azeite separadamente.'];
export function FourMeals({data,date,run,go}:PageProps){
 const day=data.days.find(d=>d.id===date)??makeDay(data,date),n=day.nutrition!,t=nutritionTotals(day)!,known=knownNutrients(n.plan),goals=day.nutrition?.version==='four-meals-1'?day.nutrition:data.settings;
 const completed=n.consumed.filter(Boolean).length;
 const render=(i:number)=>{const record=n.consumed[i],meal=record?.meal??n.plan[i],value=mealNutrients(meal);return <Panel key={i} className="meal-card">
 <div className="section-heading"><h2>{meal.title}</h2><span>{record?'Consumida':'Pendente'}</span></div>
 <ul className="meal-foods">{meal.foods.map((f,j)=><li key={j}><span>{f.label}</span><strong>{nutrientText(mealNutrients({title:'',foods:[f]}).kcal,'kcal')}</strong></li>)}</ul>
 <p>{preparation[i]}</p>{(i===0||i===2)&&<p>Aveia e leite em pó: pesos secos. Bebidas não entram automaticamente no contador de água.</p>}
 <div className="meal-energy"><strong>{nutrientText(value.kcal,'kcal')}</strong><span>{value.kcal===null?`Subtotal conhecido: ${nutrientText(knownNutrients([meal]).kcal,'kcal')}`:'Referências nutricionais'}</span></div><Macros value={value}/>
 <button className={record?'secondary':'primary completion-button'} onClick={()=>run(()=>editDay(date,'Registrar refeição',d=>setMealConsumed(d,i,!record)),record?'Consumo desfeito.':'Refeição registrada.')}>{record?'Desfazer consumo':'Marcar como consumida'}</button>
 <details className="meal-details"><summary>Porções e referências</summary>{!record&&meal.foods.map((f,j)=><CheckButton key={j} done={day.meals[i][j]} onClick={()=>run(()=>editDay(date,'Registrar alimento',d=>toggleFood(d,i,j)))}>{f.label}</CheckButton>)}<FoodDetails meal={meal}/></details>
 </Panel>;};
 return <><PageTitle eyebrow="ALIMENTAÇÃO" title={completed===4?'Alimentação concluída':'Quatro refeições no seu dia'} back={()=>go('home')}><p>Duas líquidas e duas sólidas. Metas iniciais ajustáveis: 2.500–2.550 kcal e 185–200 g de proteína.</p></PageTitle>
 <Panel className="nutrition-summary"><div className="metric-grid">
 <Metric label="Calorias consumidas" value={nutrientText(t.consumed.kcal,'kcal')} emphasis/>
 <Metric label="Calorias restantes" value={nutrientText(t.consumed.kcal===null?null:Math.max(0,goals.calorieGoal-t.consumed.kcal),'kcal')}/>
 <Metric label="Proteínas consumidas" value={nutrientText(t.consumed.protein)} emphasis/>
 <Metric label="Proteínas restantes" value={nutrientText(t.consumed.protein===null?null:Math.max(0,goals.proteinGoal-t.consumed.protein))}/>
 </div><p>Metas configuradas: {goals.calorieGoal} kcal · {goals.proteinGoal} g de proteína.</p>
 {t.consumed.kcal!==null&&<Progress value={t.consumed.kcal} max={goals.calorieGoal} label="Progresso calórico diário"/>}
 <p className="meal-count"><strong>{completed}/4</strong> refeições concluídas</p><Macros value={t.consumed}/><p>Somente refeições concluídas entram no consumo. Valores desconhecidos não são zeros.</p>
 <details><summary>Plano, diferenças e ajustes propostos</summary><p>Total planejado: {nutrientText(t.planned.kcal,'kcal')}</p><Macros value={t.planned}/>
 <p>Subtotal dos ingredientes com valores conhecidos: {nutrientText(known.kcal,'kcal')}.</p><Macros value={known}/>
 {(['kcal','protein'] as const).map(k=>{const goal=k==='kcal'?goals.calorieGoal:goals.proteinGoal,value=t.planned[k];return <p key={k}>{value===null?`Diferença de ${k==='kcal'?'calorias':'proteínas'} pendente: complete os rótulos e a composição dos legumes.`:`Diferença do plano para a meta: ${Math.abs(value-goal).toLocaleString('pt-BR',{maximumFractionDigits:1})} ${k==='kcal'?'kcal':'g de proteína'} ${value<goal?'abaixo':value>goal?'acima':'(meta atingida)'}.`}</p>;})}
 <p>Proposta: confirme primeiro os rótulos. Se faltar energia, avalie aumentar arroz ou aveia; se faltar proteína, avalie frango ou patinho. Se houver excedente, avalie reduzir a porção correspondente. As quantidades oficiais não são alteradas automaticamente.</p><button className="secondary" onClick={()=>go('settings')}>Ajustar metas e referências</button></details></Panel>
 <div className="meal-grid">{n.plan.map((_,i)=>!n.consumed[i]?render(i):null)}</div>
 <details className="meal-history"><summary>Refeições concluídas — {completed}/4</summary><div className="meal-grid">{n.plan.map((_,i)=>n.consumed[i]?render(i):null)}</div></details>
 {(day.archivedNutrition.length>0||day.previousNutrition)&&<Panel><details><summary>Histórico anterior neste dia</summary>{day.archivedNutrition.map((a,i)=><div key={i}>{a.nutrition.plan.map((m,j)=><div key={j}><h3>{m.title}</h3><p>{a.nutrition.consumed[j]?'Consumida':a.meals[j].some(Boolean)?'Registro parcial':'Não consumida'}</p><p>Porções marcadas: {m.foods.filter((_,k)=>a.meals[j][k]).map(f=>f.label).join('; ')||'nenhuma'}. Horário: {a.mealTimes[j]?new Date(a.mealTimes[j]!).toLocaleTimeString('pt-BR'):'não informado'}.</p><FoodDetails meal={a.nutrition.consumed[j]?.meal??m}/></div>)}{a.declaration&&<p>Conclusão sem detalhes: {a.declaration.note} · {a.declaration.at}</p>}</div>)}{day.previousNutrition&&<div>{LEGACY_MEALS.map((m,i)=><p key={m.id}>{m.title}: {m.foods.filter((_,j)=>day.previousNutrition!.meals[i][j]).join('; ')||'sem consumo detalhado'}. {day.previousNutrition!.mealTimes[i]??''}</p>)}<p>Nutrientes não informados. {day.previousNutrition.declaration?.note}</p></div>}<p>Consumos completos anteriores permanecem no total deste dia. Consulte outros dias pelo calendário.</p></details></Panel>}
 </>;
}
