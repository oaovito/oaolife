import { useEffect, useRef, useState } from 'react';
export function useUpdates() {
 const [available,setAvailable]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState<string|null>(null);
 const registration=useRef<ServiceWorkerRegistration|null>(null),activationRequested=useRef(false);
 useEffect(()=>{
  if(!('serviceWorker' in navigator))return;
  let disposed=false;const watched=new Set<ServiceWorker>();
  const watch=(worker:ServiceWorker|null)=>{if(!worker||watched.has(worker))return;watched.add(worker);worker.addEventListener('statechange',()=>{if(disposed)return;if(worker.state==='installed'){if(navigator.serviceWorker.controller)setAvailable(true);else setReady(true);}});};
  const check=()=>{if(navigator.onLine)void registration.current?.update().then(()=>{if(!disposed)setError(null);}).catch(()=>{if(!disposed)setError('Não foi possível verificar uma nova versão. Seus dados locais continuam disponíveis.');});};
  const controllerChange=()=>{if(activationRequested.current)window.location.reload();};
  navigator.serviceWorker.addEventListener('controllerchange',controllerChange);
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL,updateViaCache:'none'}).then(r=>{
   if(disposed)return;registration.current=r;if(r.waiting)setAvailable(true);if(r.active)setReady(true);watch(r.installing);r.addEventListener('updatefound',()=>watch(r.installing));
  }).catch(()=>{if(!disposed)setError('Os recursos offline ainda não foram confirmados. Reabra conectado e mantenha seu backup.');});
  const visible=()=>{if(document.visibilityState==='visible')check();};window.addEventListener('online',check);window.addEventListener('focus',check);document.addEventListener('visibilitychange',visible);
  return()=>{disposed=true;window.removeEventListener('online',check);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',visible);navigator.serviceWorker.removeEventListener('controllerchange',controllerChange);};
 },[]);
 return {available,ready,error,apply:async()=>{const worker=registration.current?.waiting;if(!worker){setError('A versão em espera não está disponível. Reabra conectado para verificar novamente.');return;}activationRequested.current=true;worker.postMessage({type:'SKIP_WAITING'});}};
}
