import { useEffect, useState } from 'react';
import { onSyncChange, pushNow, restoreFromCloud, syncCode, syncState, type SyncState } from '../storage/sync';
import { Panel, Field, type PageProps } from './shared';
const formatDateTime=(iso:string)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));

export function useSyncState():SyncState {const [s,set]=useState(syncState);useEffect(()=>onSyncChange(()=>set(syncState())),[]);return s;}

// Aviso para a tela inicial: só quando a cópia automática não está funcionando.
export function syncAlert(s:SyncState){return s.error?`Cópia na nuvem pendente: ${s.error}`:null;}

export function CloudSync({run}:{run:PageProps['run']}){
 const s=useSyncState(),code=syncCode(),[shown,setShown]=useState(false),[busy,setBusy]=useState(false);
 return <Panel className="cloud-sync"><h2>Cópia automática na nuvem</h2>
  <p>Cada registro é criptografado neste aparelho e enviado automaticamente sempre que houver internet. A cópia só cresce: nada é apagado, e cada envio fica no histórico.</p>
  <p className={s.error?'sync-status warn':'sync-status ok'} aria-live="polite">{s.error?s.error:s.lastSyncAt?`Última cópia: ${formatDateTime(s.lastSyncAt)}.`:'Primeira cópia pendente.'}{s.photosExcluded>0?` ${s.photosExcluded} foto(s) grande(s) ficaram só neste aparelho.`:''}</p>
  <button type="button" className="secondary" disabled={busy} onClick={()=>{setBusy(true);void pushNow().finally(()=>setBusy(false));}}>Enviar agora</button>
  <h3>Código de recuperação</h3>
  <p>Guarde este código (por exemplo, nas Senhas do iPhone). Ele é a única forma de recuperar os registros em outro aparelho ou após reinstalar o app. Sem ele, ninguém consegue ler a cópia — nem o servidor.</p>
  {code&&<form className="sync-code" onSubmit={e=>e.preventDefault()}>
   <input type="hidden" name="username" autoComplete="username" value="oaolife"/>
   <Field label="Código"><input name="password" readOnly autoComplete="new-password" type={shown?'text':'password'} value={code} className="mono" onFocus={e=>e.currentTarget.select()}/></Field>
   <div className="button-row"><button type="button" className="secondary" onClick={()=>setShown(v=>!v)}>{shown?'Ocultar':'Mostrar'}</button><button type="button" className="secondary" onClick={()=>void run(()=>navigator.clipboard.writeText(code),'Código copiado.')}>Copiar</button></div>
  </form>}
  <h3>Recuperar registros de outro aparelho</h3>
  <form onSubmit={e=>{e.preventDefault();const value=String(new FormData(e.currentTarget).get('code')??'');void run(()=>restoreFromCloud(value),'Registros recuperados da nuvem. Os dados anteriores deste aparelho foram guardados como cópia local.');}}>
   <Field label="Código de recuperação"><input name="code" required autoComplete="current-password" autoCapitalize="characters" spellCheck={false} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"/></Field>
   <button className="secondary">Recuperar da nuvem</button>
  </form>
 </Panel>;
}
