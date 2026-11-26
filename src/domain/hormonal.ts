import type { AppData, HormonalProtocol } from './model';

// Plano informado pelo usuário. Não representa administrações realizadas.
// Plano anterior (até 26/11/2026), mantido só para reconhecer dados antigos.
// DADO PESSOAL: protocolo hormonal informado (antigo). Migrar para repositório privado (docs/PERSONAL_DATA_INVENTORY.md).
export const LEGACY_HORMONAL_PLAN: HormonalProtocol = {
  "name": "Registro hormonal informado",
  "weeks": 12,
  "entries": [
    {
      "id": "testosterona-segunda",
      "substance": "Enantato de testosterona",
      "doseMg": 250,
      "frequency": "weekly",
      "weekday": 1,
      "fromWeek": 1,
      "toWeek": 12
    },
    {
      "id": "testosterona-segundo-dia",
      "substance": "Enantato de testosterona",
      "doseMg": 250,
      "frequency": "weekly",
      "weekday": null,
      "fromWeek": 1,
      "toWeek": 12
    },
    {
      "id": "nandrolona-segunda",
      "substance": "Decanoato de nandrolona",
      "doseMg": 200,
      "frequency": "weekly",
      "weekday": 1,
      "fromWeek": 1,
      "toWeek": 12
    },
    {
      "id": "nandrolona-segundo-dia",
      "substance": "Decanoato de nandrolona",
      "doseMg": 200,
      "frequency": "weekly",
      "weekday": null,
      "fromWeek": 1,
      "toWeek": 12
    },
    {
      "id": "trembolona-segunda",
      "substance": "Enantato de trembolona",
      "doseMg": 100,
      "frequency": "weekly",
      "weekday": 1,
      "fromWeek": 1,
      "toWeek": 12
    },
    {
      "id": "oximetolona-oral",
      "substance": "Oximetolona oral",
      "doseMg": 50,
      "frequency": "daily",
      "weekday": null,
      "fromWeek": 1,
      "toWeek": 8
    }
  ]
};

// Plano informado pelo proprietário em 26/11/2026: aplicações às segundas e quintas.
// Apenas registro do que foi informado; o app não sugere nem altera doses.
// DADO PESSOAL: protocolo hormonal informado (substâncias e doses). Migrar para repositório privado (docs/PERSONAL_DATA_INVENTORY.md).
export const INFORMED_HORMONAL_PLAN: HormonalProtocol = {
  name: 'Registro hormonal informado',
  weeks: 12,
  entries: [
    { id:'testosterona-segunda', substance:'Testosterona', doseMg:500, frequency:'weekly', weekday:1, fromWeek:1, toWeek:12 },
    { id:'nandrolona-segunda', substance:'Decanoato de nandrolona', doseMg:200, frequency:'weekly', weekday:1, fromWeek:1, toWeek:12 },
    { id:'trembolona-segunda', substance:'Enantato de trembolona', doseMg:50, frequency:'weekly', weekday:1, fromWeek:1, toWeek:12 },
    { id:'testosterona-quinta', substance:'Testosterona', doseMg:500, frequency:'weekly', weekday:4, fromWeek:1, toWeek:12 },
    { id:'nandrolona-quinta', substance:'Decanoato de nandrolona', doseMg:200, frequency:'weekly', weekday:4, fromWeek:1, toWeek:12 },
  ],
};
export const HORMONAL_PLAN_UPDATE='hormonal-plan-2026-11-26';

// Substitui o plano anterior padrão (ou ausente) pelo informado em 26/11/2026. Idempotente:
// depois da troca o plano já não é o anterior; planos personalizados nunca mudam. Registros de administração já feitos não mudam: cada um guarda substância e dose.
export function activateHormonalPlan(data:AppData):boolean {
 if(data.hormonalProtocol!==null&&JSON.stringify(data.hormonalProtocol)!==JSON.stringify(LEGACY_HORMONAL_PLAN))return false;
 data.hormonalProtocol=structuredClone(INFORMED_HORMONAL_PLAN);
 data.adjustments.push({id:HORMONAL_PLAN_UPDATE,at:new Date().toISOString(),kind:'Plano hormonal informado',detail:'Plano de segunda e quinta aplicado; registros anteriores preservados.'});
 return true;
}

// Itens do plano para o dia da semana da data (segunda ou quinta). Em outros dias (exceção),
// usa o modelo indicado.
export function planForDay(protocol:HormonalProtocol,weekday:number,week:number){
 return protocol.entries.filter(e=>e.frequency==='weekly'&&e.weekday===weekday&&week>=e.fromWeek&&week<=e.toWeek);
}

// Registro com um toque: grava cada item informado (dose editável) e fecha o bloco do dia.
// Itens já registrados na mesma data não são duplicados.
export function registerHormonalDay(data:AppData,date:string,week:number,items:{entryId:string;doseMg:number}[],ids:()=>string,at:string){
 const protocol=data.hormonalProtocol??INFORMED_HORMONAL_PLAN;let added=0;
 for(const item of items){
  const entry=protocol.entries.find(e=>e.id===item.entryId);if(!entry)throw Error('Item fora do plano.');
  if(!Number.isFinite(item.doseMg)||item.doseMg<=0||item.doseMg>10000)throw Error('Informe a quantidade realmente administrada.');
  if(data.hormonalLogs.some(l=>l.date===date&&l.entryId===entry.id))continue;
  data.hormonalLogs.push({id:ids(),date,week,entryId:entry.id,substance:entry.substance,doseMg:item.doseMg,notes:'',at});added++;
 }
 return added;
}
