import { useEffect, useRef, useState } from 'react';
interface Submission { form:HTMLFormElement; revision:number }
export function useFormSafety(){
 const [dirty,setDirty]=useState(false);const revisions=useRef(new Map<HTMLFormElement,number>()),submitting=useRef<Submission|null>(null);
 const refresh=()=>{for(const form of revisions.current.keys())if(!form.isConnected)revisions.current.delete(form);setDirty(revisions.current.size>0);};
 useEffect(()=>{
  const change=(event:Event)=>{if(!(event.target instanceof HTMLElement))return;const form=event.target.closest('form');if(!form)return;revisions.current.set(form,(revisions.current.get(form)||0)+1);refresh();};
  // Uma microtask pode executar entre o capture nativo e o handler React.
  // Mantém o token até o fim da tarefa para associar o commit ao formulário.
  const submit=(event:Event)=>{if(!(event.target instanceof HTMLFormElement))return;const token={form:event.target,revision:revisions.current.get(event.target)||0};submitting.current=token;setTimeout(()=>{if(submitting.current===token)submitting.current=null;},0);};
  const reset=(event:Event)=>{if(event.target instanceof HTMLFormElement){revisions.current.delete(event.target);refresh();}};
  const observer=new MutationObserver(refresh);observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('input',change,true);document.addEventListener('change',change,true);document.addEventListener('submit',submit,true);document.addEventListener('reset',reset,true);
  return()=>{observer.disconnect();document.removeEventListener('input',change,true);document.removeEventListener('change',change,true);document.removeEventListener('submit',submit,true);document.removeEventListener('reset',reset,true);};
 },[]);
 return {dirty,submitting,saved:(token:Submission|null)=>{if(token&&(revisions.current.get(token.form)||0)===token.revision){revisions.current.delete(token.form);refresh();}},hasUnsaved:()=>[...revisions.current.keys()].some(form=>form.isConnected)};
}
