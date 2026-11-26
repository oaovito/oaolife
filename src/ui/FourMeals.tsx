import { LEGACY_MEALS } from '../domain/plan';
import { makeDay, toggleFood } from '../domain/daily';
import { knownNutrients, mealNutrients, nutritionTotals, setMealConsumed } from '../domain/nutrition';
import { editDay } from '../storage/db';
import { FoodDetails, Macros, nutrientText } from './NutritionDetails';
import { CheckButton, Metric, PageTitle, Panel, Progress, type PageProps } from './shared';
const fmt=(v:number|null,digits=0)=>v===null?'—':v.toLocaleString('pt-BR',{maximumFractionDigits:digits});
const preparation=['Bata no liquidificador. Água ou gelo são opcionais.','Pese frango e arroz após preparo. Sem azeite e sem legumes.','Bata no liquidificador. Canela ou essência de baunilha sem açúcar são opcionais.','Pese patinho e arroz após preparo. Sem azeite e sem legumes.'];
export function FourMeals({data,date,run,go}:PageProps){
 const day=data.days.find(d=>d.id===date)??makeDay(data,date),n=day.nutrition!,t=nutritionTotals(day)!,known=knownNutrients(n.plan),goals=day.nutrition?.version==='four-meals-1'?day.nutrition:data.settings;
 const completed=n.consumed.filter(Boolean).length;
 const render=(i:number)=>{const record=n.consumed[i],meal=record?.meal??n.plan[i],value=mealNutrients(meal);return <Panel key={i} className="meal-card">
 <div className="section-heading"><h2>{meal.title}</h2><span>{record?'Consumida':'Pendente'}</span></div>
 <button className={record?'secondary':'primary completion-button start-action'} onClick={()=>run(()=>editDay(date,'Registrar refeição',d=>setMealConsumed(d,i,!record)),record?'Consumo desfeito.':'Refeição registrada.')}>{record?'Desfazer consumo':'Marcar como consumida'}</button>
 <ul className="meal-foods">{meal.foods.map((f,j)=><li key={j}><span>{f.label}</span><strong>{nutrientText(mealNutrients({title:'',foods:[f]}).kcal,'kcal')}</strong></li>)}</ul>
 <p>{preparation[i]}</p>{(i===0||i===2)&&<p>Aveia e leite em pó: pesos secos. Bebidas não entram automaticamente no contador de água.</p>}
 <div className="meal-energy"><strong>{nutrientText(value.kcal,'kcal')}</strong><span>{value.kcal===null?`Subtotal conhecido: ${nutrientText(knownNutrients([meal]).kcal,'kcal')}`:'Referências nutricionais'}</span></div><Macros value={value}/>
 <details className="meal-details"><summary>Porções e referências</summary>{!record&&meal.foods.map((f,j)=><CheckButton key={j} done={day.meals[i][j]} onClick={()=>run(()=>editDay(date,'Registrar alimento',d=>toggleFood(d,i,j)))}>{f.label}</CheckButton>)}<FoodDetails meal={meal}/></details>
 </Panel>;};
 return <><PageTitle eyebrow="ALIMENTAÇÃO" title={completed===4?'Alimentação concluída':'Quatro refeições. Sem exceção.'} back={()=>go('home')}><p>Duas refeições líquidas e duas sólidas, quantidades fixas. Valores TACO/TBCA.</p></PageTitle>
 <div className="meal-grid">{n.plan.map((_,i)=>!n.consumed[i]?render(i):null)}</div>
 <Panel className="nutrition-summary"><div className="metric-grid">
 <Metric label="Calorias consumidas" value={nutrientText(t.consumed.kcal,'kcal')} emphasis/>
 <Metric label="Calorias restantes" value={nutrientText(t.consumed.kcal===null?null:Math.max(0,goals.calorieGoal-t.consumed.kcal),'kcal')}/>
 <Metric label="Proteínas consumidas" value={nutrientText(t.consumed.protein)} emphasis/>
 <Metric label="Proteínas restantes" value={nutrientText(t.consumed.protein===null?null:Math.max(0,goals.proteinGoal-t.consumed.protein))}/>
 </div><p>Metas configuradas: {goals.calorieGoal} kcal · {goals.proteinGoal} g de proteína.</p>
 {t.consumed.kcal!==null&&<Progress value={t.consumed.kcal} max={goals.calorieGoal} label="Progresso calórico diário"/>}
 <p className="meal-count"><strong>{completed}/4</strong> refeições concluídas</p><Macros value={t.consumed}/>
 {t.planned.kcal!==null&&<div className="plan-balance" aria-label="Plano versus meta"><div><small>Plano do dia</small><strong>{fmt(t.planned.kcal)}</strong><small>kcal</small></div><div><small>Meta</small><strong>{fmt(goals.calorieGoal)}</strong><small>kcal</small></div><div className={t.planned.kcal>goals.calorieGoal?'over':t.planned.kcal<goals.calorieGoal?'under':''}><small>Diferença</small><strong>{t.planned.kcal>goals.calorieGoal?'+':t.planned.kcal<goals.calorieGoal?'−':''}{fmt(Math.abs(t.planned.kcal-goals.calorieGoal))}</strong><small>kcal</small></div></div>}
 <table className="meal-table"><caption className="sr-only">Nutrientes por refeição</caption><thead><tr><th scope="col">Refeição</th><th scope="col">kcal</th><th scope="col">Prot.</th><th scope="col">Carb.</th><th scope="col">Gord.</th></tr></thead><tbody>{n.plan.map((m,i)=>{const v=mealNutrients(n.consumed[i]?.meal??m);return <tr key={i}><td className={n.consumed[i]?'done':''}>{n.consumed[i]?'✓ ':''}R{i+1} · {i%2===0?'líquida':'sólida'}</td><td>{fmt(v.kcal)}</td><td>{fmt(v.protein,1)}</td><td>{fmt(v.carbs,1)}</td><td>{fmt(v.fat,1)}</td></tr>;})}</tbody><tfoot><tr><td>Total do plano</td><td>{fmt(t.planned.kcal)}</td><td>{fmt(t.planned.protein,1)}</td><td>{fmt(t.planned.carbs,1)}</td><td>{fmt(t.planned.fat,1)}</td></tr></tfoot></table><p>Somente refeições concluídas entram no consumo. Valores desconhecidos não são zeros.</p>
 <details><summary>Plano, diferenças e ajustes propostos</summary><p>Total planejado: {nutrientText(t.planned.kcal,'kcal')}</p><Macros value={t.planned}/>
 <p>Subtotal dos ingredientes com valores conhecidos: {nutrientText(known.kcal,'kcal')}.</p><Macros value={known}/>
 {(['kcal','protein'] as const).map(k=>{const goal=k==='kcal'?goals.calorieGoal:goals.proteinGoal,value=t.planned[k];return <p key={k}>{value===null?`Diferença de ${k==='kcal'?'calorias':'proteínas'} pendente: complete os rótulos e a composição dos legumes.`:`Diferença do plano para a meta: ${Math.abs(value-goal).toLocaleString('pt-BR',{maximumFractionDigits:1})} ${k==='kcal'?'kcal':'g de proteína'} ${value<goal?'abaixo':value>goal?'acima':'(meta atingida)'}.`}</p>;})}
 <p>Proposta: confirme primeiro os rótulos. Se faltar energia, avalie aumentar arroz ou aveia; se faltar proteína, avalie frango ou patinho. Se houver excedente, avalie reduzir a porção correspondente. As quantidades oficiais não são alteradas automaticamente.</p><button className="secondary" onClick={()=>go('settings')}>Ajustar metas e referências</button></details></Panel>
 <details className="meal-history"><summary>Refeições concluídas — {completed}/4</summary><div className="meal-grid">{n.plan.map((_,i)=>n.consumed[i]?render(i):null)}</div></details>
 {(day.archivedNutrition.length>0||day.previousNutrition)&&<Panel><details><summary>Histórico anterior neste dia</summary>{day.archivedNutrition.map((a,i)=><div key={i}>{a.nutrition.plan.map((m,j)=><div key={j}><h3>{m.title}</h3><p>{a.nutrition.consumed[j]?'Consumida':a.meals[j].some(Boolean)?'Registro parcial':'Não consumida'}</p><p>Porções marcadas: {m.foods.filter((_,k)=>a.meals[j][k]).map(f=>f.label).join('; ')||'nenhuma'}. Horário: {a.mealTimes[j]?new Date(a.mealTimes[j]!).toLocaleTimeString('pt-BR'):'não informado'}.</p><FoodDetails meal={a.nutrition.consumed[j]?.meal??m}/></div>)}{a.declaration&&<p>Conclusão sem detalhes: {a.declaration.note} · {a.declaration.at}</p>}</div>)}{day.previousNutrition&&<div>{LEGACY_MEALS.map((m,i)=><p key={m.id}>{m.title}: {m.foods.filter((_,j)=>day.previousNutrition!.meals[i][j]).join('; ')||'sem consumo detalhado'}. {day.previousNutrition!.mealTimes[i]??''}</p>)}<p>Nutrientes não informados. {day.previousNutrition.declaration?.note}</p></div>}<p>Consumos completos anteriores permanecem no total deste dia. Consulte outros dias pelo calendário.</p></details></Panel>}
 </>;
}
