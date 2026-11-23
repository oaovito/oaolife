import { useState } from 'react';
import { DEFAULT_REFERENCES, refreshNutritionPlan, nutritionReference } from '../domain/nutrition';
import { foodKeys, referenceSchema } from '../domain/nutritionSchema';
import { today } from '../domain/training';
import { mutate } from '../storage/db';
import { Panel, Field, formNumber, type PageProps } from './shared';
export function NutritionReferences({data,run}:Pick<PageProps,'data'|'run'>) {
 const [selected,setSelected]=useState<typeof foodKeys[number]>('greekNatural');
 const ref=nutritionReference(data,selected);
 return <Panel><details><summary>Referências nutricionais do plano</summary><p>Atualize o rótulo ou especifique o corte e preparo. O novo valor atualiza o planejamento de hoje e dos próximos dias. Refeições consumidas e dias anteriores mantêm seus valores originais.</p>
 <Field label="Alimento do plano"><select value={selected} onChange={e=>setSelected(e.target.value as typeof selected)}>{foodKeys.map(k=><option key={k} value={k}>{DEFAULT_REFERENCES[k].name}</option>)}</select></Field>
 <form key={selected+JSON.stringify(ref)} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void run(()=>mutate('Atualizar referência nutricional',selected,d=>{
 const value=referenceSchema.parse({name:String(f.get('name')),quantity:formNumber(f,'quantity'),unit:ref.unit,nutrients:{kcal:formNumber(f,'kcal'),protein:formNumber(f,'protein'),carbs:formNumber(f,'carbs'),fat:formNumber(f,'fat')},source:String(f.get('source')),note:String(f.get('note')),gramsPerUnit:formNumber(f,'gramsPerUnit'),certainty:f.get('certainty')});
 if(selected==='bread'&&value.gramsPerUnit===null)throw Error('Informe o peso de cada pão.');
 d.nutritionOverrides[selected]=value;
 const day=d.days.find(v=>v.id===today());if(day)refreshNutritionPlan(day,d);
 }),'Referência salva. Consumos anteriores preservados.');}}><div className="form-grid"><Field label="Nome e produto específico"><input name="name" defaultValue={ref.name} required maxLength={200}/></Field><Field label={`Porção de referência (${ref.unit})`}><input name="quantity" type="number" min="0.1" step="any" defaultValue={ref.quantity} required/></Field>{ref.unit==='g'&&<Field label="Peso de referência da unidade ou colher (g)"><input name="gramsPerUnit" type="number" min="1" step="any" defaultValue={ref.gramsPerUnit??''}/></Field>}{([['kcal','Calorias (kcal)'],['protein','Proteínas (g)'],['carbs','Carboidratos (g)'],['fat','Gorduras (g)']] as const).map(([k,label])=><Field key={k} label={label}><input name={k} type="number" inputMode="decimal" min="0" step="any" defaultValue={ref.nutrients[k]??''}/></Field>)}<Field label="Fonte do rótulo ou tabela"><input name="source" defaultValue={ref.source} required maxLength={5000}/></Field><Field label="Preparo e observações"><textarea name="note" defaultValue={ref.note} maxLength={5000}/></Field><Field label="Qualidade da referência"><select name="certainty" defaultValue={ref.certainty}><option value="confirmado">Rótulo confirmado</option><option value="estimado">Referência estimada</option><option value="desconhecido">Não informada</option></select></Field></div><p>Valores por porção de referência. Campos vazios permanecem desconhecidos; não representam zero.</p><button type="submit" className="primary">Salvar referência do plano</button></form>
 </details></Panel>;
}
