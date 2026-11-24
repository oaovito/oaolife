import { useCallback, useEffect, useRef, useState } from 'react';
export function useUpdates() {
 const [available,setAvailable]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState<string|null>(null);
 const [checking,setChecking]=useState(false),[applying,setApplying]=useState(false),[checkMessage,setCheckMessage]=useState<string|null>(null);
 const registration=useRef<ServiceWorkerRegistration|null>(null),activationRequested=useRef(false),activatedElsewhere=useRef(false),checkingRef=useRef(false),activationTimeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 const check=useCallback(async()=>{
  if(checkingRef.current||activationRequested.current)return;
  setError(null);setCheckMessage(null);
  if(!navigator.onLine){setError('Conecte-se à internet para verificar atualizações. Seus registros continuam disponíveis offline.');return;}
  const r=registration.current;
  if(!r){setError('A verificação ainda não está disponível. Aguarde a inicialização e tente novamente.');return;}
  checkingRef.current=true;setChecking(true);
  try{await r.update();if(r.waiting||activatedElsewhere.current){setAvailable(true);setCheckMessage('Uma nova versão está pronta.');}else setCheckMessage(r.installing?'Baixando a nova versão…':'Verificação concluída. Nenhuma nova versão disponível.');}
  catch{setError('Não foi possível verificar uma nova versão. Seus dados locais continuam disponíveis. Tente novamente.');}
  finally{checkingRef.current=false;setChecking(false);}
 },[]);
 useEffect(()=>{
  if(!('serviceWorker' in navigator))return;
  let disposed=false,hadController=!!navigator.serviceWorker.controller;const watched=new Set<ServiceWorker>();
  const watch=(worker:ServiceWorker|null)=>{if(!worker||watched.has(worker))return;watched.add(worker);worker.addEventListener('statechange',()=>{if(disposed)return;if(worker.state==='installed'){if(navigator.serviceWorker.controller){setAvailable(true);setCheckMessage('Uma nova versão está pronta.');}else setReady(true);}});};
  const autoCheck=()=>{if(navigator.onLine)void check();};
  const controllerChange=()=>{if(activationRequested.current){if(activationTimeout.current)clearTimeout(activationTimeout.current);window.location.reload();}else if(hadController){activatedElsewhere.current=true;setAvailable(true);}hadController=true;};
  navigator.serviceWorker.addEventListener('controllerchange',controllerChange);
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL,updateViaCache:'none'}).then(r=>{
   if(disposed)return;registration.current=r;if(r.waiting)setAvailable(true);if(r.active)setReady(true);watch(r.installing);r.addEventListener('updatefound',()=>watch(r.installing));
  }).catch(()=>{if(!disposed)setError('Os recursos offline ainda não foram confirmados. Reabra conectado e mantenha seu backup.');});
  const visible=()=>{if(document.visibilityState==='visible')autoCheck();};window.addEventListener('online',autoCheck);window.addEventListener('focus',autoCheck);document.addEventListener('visibilitychange',visible);
  return()=>{disposed=true;if(activationTimeout.current)clearTimeout(activationTimeout.current);window.removeEventListener('online',autoCheck);window.removeEventListener('focus',autoCheck);document.removeEventListener('visibilitychange',visible);navigator.serviceWorker.removeEventListener('controllerchange',controllerChange);};
 },[check]);
 const apply=()=>{
  if(activationRequested.current)return;
  const worker=registration.current?.waiting;
  // Another tab may have activated the worker; this tab still needs a safe reload.
  if(!worker&&activatedElsewhere.current){activationRequested.current=true;setApplying(true);window.location.reload();return;}
  if(!worker){setError('A versão em espera não está disponível. Use Verificar atualizações nos Ajustes e tente novamente.');return;}
  activationRequested.current=true;setApplying(true);setError(null);
  const failed=()=>{activationRequested.current=false;setApplying(false);setError('A atualização não foi concluída. Seus registros foram mantidos. Tente novamente.');};
  activationTimeout.current=setTimeout(failed,15000);
  try{worker.postMessage({type:'SKIP_WAITING'});}catch{clearTimeout(activationTimeout.current);failed();}
 };
 return {available,ready,error,checking,applying,checkMessage,check,apply};
}
