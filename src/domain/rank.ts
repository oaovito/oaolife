// Patentes do contador de dias cumpridos (sem limite). Uma promoção a cada 10 dias.
// Dia 0–169: hierarquia do Exército (Recruta → General de Exército), uma patente a cada 10 dias.
// Dia 170–199: Marechal I–III. Dia 200–999: oito ordens de honra, cada uma com graus I–X
// (um grau a cada 10 dias, uma ordem nova a cada 100 dias). Dia 1000: Mil Dias; depois, Mil Dias II, III…
export const DAYS_PER_RANK=10;
export const FINAL_DAY=1000;
export const ARMY=['Recruta','Soldado','Cabo','3º Sargento','2º Sargento','1º Sargento','Subtenente','Aspirante','2º Tenente','1º Tenente','Capitão','Major','Tenente-Coronel','Coronel','General de Brigada','General de Divisão','General de Exército'] as const;
// Ordens de honra após Marechal: metal e emblema próprios, escalando a cada 100 dias.
export const ORDERS=[
 {name:'Cavaleiro',metal:'bronze'},
 {name:'Oficial',metal:'ferro'},
 {name:'Comendador',metal:'prata'},
 {name:'Grande-Oficial',metal:'ouro'},
 {name:'Grã-Cruz',metal:'rubi'},
 {name:'Colar de Prata',metal:'platina'},
 {name:'Colar de Ouro',metal:'ouro-velho'},
 {name:'Comando Supremo',metal:'onix'},
] as const;
export type RankClass='recruit'|'enlisted'|'officer'|'general'|'marshal'|'honor'|'supreme'|'legend';
export type Metal=typeof ORDERS[number]['metal']|'campo'|'lenda';
export interface Rank {
 level:number;name:string;klass:RankClass;
 // marks: divisas (praças), barras (oficiais), estrelas (generais/Marechal), grau I–X (ordens).
 marks:number;order:number;grade:number;metal:Metal;
 startDay:number;inLevel:number;nextAt:number;nextName:string;group:string;
}
const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
export const roman=(n:number)=>{let out='',v=n;for(const [s,k] of [['M',1000],['CM',900],['D',500],['CD',400],['C',100],['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]] as const)while(v>=k){out+=s;v-=k;}return out;};
const MARSHAL=ARMY.length,HONOR=20,LEGEND=FINAL_DAY/DAYS_PER_RANK;

function describe(level:number):Omit<Rank,'inLevel'|'nextAt'|'nextName'|'startDay'|'level'>{
 if(level===0)return {name:ARMY[0],klass:'recruit',marks:0,order:-1,grade:0,metal:'campo',group:'Praças'};
 if(level<=6)return {name:ARMY[level],klass:'enlisted',marks:level,order:-1,grade:0,metal:'campo',group:'Praças'};
 if(level<=13)return {name:ARMY[level],klass:'officer',marks:level-6,order:-1,grade:0,metal:'campo',group:'Oficiais'};
 // Generais de Brigada, Divisão e Exército: 2, 3 e 4 estrelas. Marechal: 5 estrelas.
 if(level<MARSHAL)return {name:ARMY[level],klass:'general',marks:level-12,order:-1,grade:0,metal:'campo',group:'Generais'};
 if(level<HONOR){const grade=level-MARSHAL+1;return {name:`Marechal ${ROMAN[grade-1]}`,klass:'marshal',marks:5,order:-1,grade,metal:'campo',group:'Marechal'};}
 if(level<LEGEND){const order=Math.floor((level-HONOR)/10),grade=(level-HONOR)%10+1,o=ORDERS[order];
  return {name:`${o.name} ${ROMAN[grade-1]}`,klass:order===ORDERS.length-1?'supreme':'honor',marks:grade,order,grade,metal:o.metal,group:o.name};}
 const grade=level-LEGEND+1;
 return {name:grade===1?'Mil Dias':`Mil Dias ${roman(grade)}`,klass:'legend',marks:grade,order:ORDERS.length,grade,metal:'lenda',group:'Mil Dias'};
}
export function rankAt(level:number):Rank{
 const d=describe(level),next=describe(level+1);
 return {...d,level,startDay:level*DAYS_PER_RANK,inLevel:0,nextAt:(level+1)*DAYS_PER_RANK,nextName:next.name};
}
export function rankFor(total:number):Rank{
 const days=Math.max(0,Math.floor(total)),level=Math.floor(days/DAYS_PER_RANK);
 return {...rankAt(level),inLevel:days%DAYS_PER_RANK};
}
// Todas as patentes do dia 0 ao dia 1000 (101 níveis), para a galeria.
export const ALL_RANKS=Array.from({length:LEGEND+1},(_,i)=>rankAt(i));
