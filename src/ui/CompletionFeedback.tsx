import { useEffect, useRef, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import type { AppData, BlockKey } from '../domain/model';
import { summaries } from '../domain/daily';
const labels:Record<BlockKey,string>={workout:'Treino',meals:'Alimentação',water:'Hidratação',cardio:'Cardio',mobility:'Alongamento',hormonal:'Registro hormonal'};
export const completionPattern=[200,80,250,80,350];
export function vibrateCompletion(enabled:boolean) {
 if(!enabled||typeof navigator==='undefined'||typeof navigator.vibrate!=='function')return false;
 try{return navigator.vibrate(completionPattern);}catch{return false;}
}
export function completedTransitions(before:ReturnType<typeof summaries>,after:ReturnType<typeof summaries>) {
 return (Object.keys(after) as BlockKey[]).filter(k=>before[k].status!=='Concluído'&&after[k].status==='Concluído');
}
export function CompletionFeedback({data,date}:{data:AppData|undefined;date:string}) {
 const previous=useRef<{date:string;blocks:ReturnType<typeof summaries>}|null>(null);
 const [celebration,setCelebration]=useState<{text:string;id:number}|null>(null);
 useEffect(()=>{
  if(!data)return;
  const blocks=summaries(data,date),last=previous.current;previous.current={date,blocks};
  if(!last||last.date!==date){setCelebration(null);return;}
  const completed=completedTransitions(last.blocks,blocks);if(!completed.length)return;
  vibrateCompletion(data.settings.haptics);
  setCelebration({text:completed.length===1?`${labels[completed[0]]} ${completed[0]==='meals'||completed[0]==='water'?'concluída':'concluído'}!`:`${completed.length} blocos concluídos!`,id:Date.now()});
 },[data,date]);
 useEffect(()=>{if(!celebration)return;const timer=setTimeout(()=>setCelebration(null),2800);return()=>clearTimeout(timer);},[celebration]);
 if(!celebration)return null;
 return <div key={celebration.id} className="completion-feedback" role="status" aria-live="polite"><div className="completion-burst" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i} style={{'--particle':i} as React.CSSProperties}/>)}<span><Check size={38} strokeWidth={3}/></span></div><div><Sparkles size={18} aria-hidden="true"/><strong>{celebration.text}</strong><p>Mais um passo por você.</p></div></div>;
}
