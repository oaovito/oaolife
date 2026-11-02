import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initialize } from './storage/db';
import './styles.css';
import './design-system.css';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="startup-error"><h1>Seus registros merecem cuidado.</h1><p>A interface encontrou um erro. Reabra o aplicativo. Os dados locais não foram apagados.</p><button onClick={()=>location.reload()}>Reabrir oaolife</button></div>:this.props.children;}}
const root=createRoot(document.getElementById('root')!);
initialize().then(()=>root.render(<ErrorBoundary><App/></ErrorBoundary>)).catch(()=>root.render(<div className="startup-error"><h1>Não foi possível abrir o armazenamento local.</h1><p>Verifique se o navegador permite IndexedDB e se há espaço disponível. Tente reabrir o aplicativo. Evite limpar os dados sem ter um backup.</p><button onClick={()=>location.reload()}>Tentar novamente</button></div>));
