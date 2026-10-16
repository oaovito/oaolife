import { useEffect, useState } from 'react';
import { today } from '../domain/training';
// Compara a data civil do dispositivo, sem depender da rede ou da duração de
// um dia em milissegundos (que pode variar em transições de horário de verão).
export function useLocalDate() {
 const [date,setDate]=useState(()=>today());
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  const validate=()=>{setDate(today());clearTimeout(timer);const current=new Date(),midnight=new Date(current);midnight.setHours(24,0,0,25);timer=setTimeout(validate,Math.min(midnight.getTime()-current.getTime(),60000));};
  const visible=()=>{if(document.visibilityState==='visible')validate();};
  validate();window.addEventListener('focus',validate);window.addEventListener('pageshow',validate);document.addEventListener('visibilitychange',visible);
  return()=>{clearTimeout(timer);window.removeEventListener('focus',validate);window.removeEventListener('pageshow',validate);document.removeEventListener('visibilitychange',visible);};
 },[]);return date;
}
