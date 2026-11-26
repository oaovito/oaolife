// Patentes do contador de dias cumpridos: uma promoção a cada 10 dias, sem limite.
// Após Marechal, cada 10 dias adiciona uma estrela de distinção (Marechal ★N).
export const DAYS_PER_RANK=10;
export const RANKS=['Recruta','Soldado','Cabo','3º Sargento','2º Sargento','1º Sargento','Subtenente','Aspirante','2º Tenente','1º Tenente','Capitão','Major','Tenente-Coronel','Coronel','General de Brigada','General de Divisão','General de Exército','Marechal'] as const;
export type RankClass='recruit'|'enlisted'|'officer'|'general'|'marshal';
export interface Rank {level:number;name:string;klass:RankClass;marks:number;inLevel:number;nextAt:number;nextName:string}
const nameOf=(level:number)=>level<RANKS.length?RANKS[level]:`Marechal ★${level-RANKS.length+1}`;
export function rankFor(total:number):Rank{
 const days=Math.max(0,Math.floor(total)),level=Math.floor(days/DAYS_PER_RANK),last=RANKS.length-1;
 const klass:RankClass=level===0?'recruit':level<=6?'enlisted':level<=13?'officer':level<last?'general':'marshal';
 // Divisas (1–6), barras (oficiais 1–7), estrelas (generais 1–3, Marechal 4+).
 const marks=klass==='recruit'?0:klass==='enlisted'?level:klass==='officer'?level-6:klass==='general'?level-13:4+(level-last);
 return {level,name:nameOf(level),klass,marks,inLevel:days%DAYS_PER_RANK,nextAt:(level+1)*DAYS_PER_RANK,nextName:nameOf(level+1)};
}
