import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ALL_RANKS, DAYS_PER_RANK, FINAL_DAY, ORDERS, type Rank } from '../domain/rank';

// Insígnias geradas em SVG, uma por patente, do dia 0 ao dia 1000:
// divisas (praças), barras (oficiais), estrelas (generais/Marechal) e, a partir do dia 200,
// emblema da ordem (metal e ornamentos que escalam a cada 100 dias) com o grau I–X marcado na base.
const SHIELD='M32 3 L58 12 V32 C58 47 46 57 32 61 C18 57 6 47 6 32 V12 Z';
const INNER='M32 8 L53 15.5 V32 C53 44 44 52 32 56 C20 52 11 44 11 32 V15.5 Z';
const pt=(cx:number,cy:number,r:number,a:number)=>`${(cx+r*Math.cos(a)).toFixed(2)},${(cy+r*Math.sin(a)).toFixed(2)}`;
function star(cx:number,cy:number,r:number,points=5,inner=.42){return Array.from({length:points*2},(_,i)=>pt(cx,cy,i%2?r*inner:r,-Math.PI/2+i*Math.PI/points)).join(' ');}
const i=(n:number)=>({'--i':n}) as CSSProperties;

function cross(cx:number,cy:number,r:number){
 // Cruz pátea: braços que se alargam para fora.
 const n=r*.2,w=r*.62;
 return `M${cx-n} ${cy-n} L${cx-w} ${cy-r} H${cx+w} L${cx+n} ${cy-n} L${cx+r} ${cy-w} V${cy+w} L${cx+n} ${cy+n} L${cx+w} ${cy+r} H${cx-w} L${cx-n} ${cy+n} L${cx-r} ${cy+w} V${cy-w} Z`;
}
function laurel(cx:number,cy:number,r:number,key:string){
 // Folhas como polígonos (sem transform), para animar sem deslocar.
 const leaves:ReactNode[]=[];
 for(const side of [-1,1])for(let k=0;k<7;k++){const a=Math.PI/2+side*(0.35+k*0.3),x=cx+r*Math.cos(a),y=cy+r*Math.sin(a),d=a+side*(Math.PI/2+0.9),L=3.2,W=1.3;
  const ux=Math.cos(d),uy=Math.sin(d);
  leaves.push(<polygon key={`${key}${side}${k}`} className="m-leaf" style={i(k)} points={`${(x-ux*L).toFixed(2)},${(y-uy*L).toFixed(2)} ${(x-uy*W).toFixed(2)},${(y+ux*W).toFixed(2)} ${(x+ux*L).toFixed(2)},${(y+uy*L).toFixed(2)} ${(x+uy*W).toFixed(2)},${(y-ux*W).toFixed(2)}`}/>);}
 return leaves;
}
function swords(cx:number,cy:number){
 // Espadas cruzadas: lâmina + guarda perto do punho.
 return [-1,1].map(s=>{const x0=cx-s*15,y0=cy+15,px=x0+s*3.5,py=y0-3.5;
  return <g key={`sw${s}`} className="m-sword" style={i(s<0?0:1)}><path d={`M${x0} ${y0} L${cx+s*13} ${cy-13}`}/><path className="m-hilt" d={`M${px-3} ${py-s*3} L${px+3} ${py+s*3}`}/></g>;});
}
function rays(cx:number,cy:number,count:number){
 return <g className="insignia-rays">{Array.from({length:count},(_,k)=>{const a=k*2*Math.PI/count;return <path key={k} d={`M${pt(cx,cy,24,a)} L${pt(cx,cy,33,a-.06)} L${pt(cx,cy,33,a+.06)} Z`}/>;})}</g>;
}
function chain(cx:number,cy:number){
 return Array.from({length:9},(_,k)=>{const a=Math.PI*(1.12+k*0.095);return <circle key={`ch${k}`} className="m-chain" style={i(k)} cx={(cx+19*Math.cos(a)).toFixed(2)} cy={(cy+19*Math.sin(a)).toFixed(2)} r="1.9"/>;});
}
function gradePips(grade:number){
 return <g className="insignia-grade">{Array.from({length:10},(_,k)=>{const a=Math.PI*(0.83-k*0.074),x=32+21*Math.cos(a),y=31+21*Math.sin(a);
  return <polygon key={k} className={k<grade?'pip on':'pip'} style={i(k)} points={`${x.toFixed(2)},${(y-2.2).toFixed(2)} ${(x+2.2).toFixed(2)},${y.toFixed(2)} ${x.toFixed(2)},${(y+2.2).toFixed(2)} ${(x-2.2).toFixed(2)},${y.toFixed(2)}`}/>;})}</g>;
}

function marksFor(rank:Rank):ReactNode{
 const {klass,marks,order,grade}=rank,out:ReactNode[]=[];
 if(klass==='recruit')return <circle className="m-dot" cx="32" cy="32" r="6"/>;
 if(klass==='enlisted'){const chev=Math.min(marks,3),rock=marks-chev;
  for(let k=0;k<chev;k++)out.push(<path key={`c${k}`} className="m-chevron" style={i(k)} d={`M14 ${30+k*9} L32 ${18+k*9} L50 ${30+k*9}`}/>);
  for(let k=0;k<rock;k++)out.push(<path key={`r${k}`} className="m-chevron" style={i(chev+k)} d={`M14 ${46+k*7} Q32 ${56+k*7} 50 ${46+k*7}`}/>);
  return out;}
 if(klass==='officer'){const rows=Math.ceil(marks/4);for(let k=0;k<marks;k++){const row=Math.floor(k/4),inRow=Math.min(4,marks-row*4),col=k%4,w=8,gap=3,x0=32-(inRow*w+(inRow-1)*gap)/2;out.push(<rect key={k} className="m-bar" style={i(k)} x={x0+col*(w+gap)} y={32-rows*8+row*16} width={w} height={12} rx={1.5}/>);}return out;}
 if(klass==='general'||klass==='marshal'){
  const n=marks,r=n<=3?7.5:6,top=n<=3?n:Math.ceil(n/2),rows=n<=3?1:2;
  if(klass==='marshal'&&grade>=2)out.push(...laurel(32,31,20,'l'));
  if(klass==='marshal'&&grade>=3)out.push(...swords(32,31));
  for(let k=0;k<n;k++){const row=k<top?0:1,inRow=row===0?top:n-top,col=row===0?k:k-top,step=r*2.25;
   out.push(<polygon key={`s${k}`} className="m-star" style={i(k)} points={star(32-(inRow-1)*step/2+col*step,(rows===1?31:25)+row*r*2.1,r)}/>);}
  return out;}
 // Ordens de honra, Comando Supremo e Mil Dias: emblema cumulativo + grau.
 const cx=32,cy=29;
 if(klass==='legend'){
  out.push(...laurel(cx,cy+1,20,'a'),...swords(cx,cy));
  out.push(<polygon key="ls" className="m-star" style={i(2)} points={star(cx,cy,10.5)}/>);
  out.push(<text key="lt" className="m-text" x="32" y="55" textAnchor="middle">{grade===1?'1000':`${FINAL_DAY}+`}</text>);
  return out;}
 if(order>=6||klass==='supreme')out.push(<polygon key="st8" className="m-star8" style={i(0)} points={star(cx,cy,15,8,.55)}/>);
 if(order===3||order===4)out.push(<polygon key="st8" className="m-star8" style={i(0)} points={star(cx,cy,14,8,.55)}/>);
 if(order>=4)out.push(...laurel(cx,cy+1,17,'o'));
 if(order>=5)out.push(...chain(cx,cy));
 if(klass==='supreme'){out.push(...swords(cx,cy));out.push(<polygon key="sup" className="m-star" style={i(3)} points={star(cx,cy,8)}/>);}
 else{
  if(order===2)out.push(<circle key="ring" className="m-ring" style={i(1)} cx={cx} cy={cy} r="12"/>);
  out.push(<path key="x" className="m-cross" style={i(2)} d={cross(cx,cy,order>=3?9.5:11)}/>);
  if(order>=1)out.push(<circle key="ros" className="m-rosette" style={i(3)} cx={cx} cy={cy} r={order>=3?3.2:3.6}/>);
 }
 out.push(<g key="g">{gradePips(grade)}</g>);
 return out;
}

export function Insignia({rank,animate=false}:{rank:Rank;animate?:boolean}){
 const clip=useId().replace(/:/g,'');
 const ornate=rank.klass==='honor'||rank.klass==='supreme'||rank.klass==='legend';
 return <svg className="insignia" data-class={rank.klass} data-metal={rank.metal} data-order={rank.order} data-animate={animate||undefined} viewBox="0 0 64 64" role="img" aria-label={`Insígnia: ${rank.name}`}>
  <defs><clipPath id={clip}><path d={SHIELD}/></clipPath></defs>
  {(rank.klass==='supreme'||rank.klass==='legend')&&rays(32,32,rank.klass==='legend'?24:16)}
  <path className="insignia-shield" d={SHIELD}/>
  {ornate&&<path className="insignia-inner" d={INNER}/>}
  <g className="insignia-marks">{marksFor(rank)}</g>
  {ornate&&<rect className="insignia-shine" clipPath={`url(#${clip})`} x="-40" y="-8" width="26" height="80" transform="rotate(20 32 32)"/>}
 </svg>;
}

// Aviso da cópia na nuvem fica dentro do contador (sem ocupar altura extra em Hoje).
export function RankCounter({rank,total,streak,best,warning,onWarning,onOpen}:{rank:Rank;total:number;streak:number;best:number;warning?:string|null;onWarning?:()=>void;onOpen?:()=>void}){
 return <section className="rank-counter" data-class={rank.klass} data-metal={rank.metal} aria-label={`Dias cumpridos integralmente: ${total}. Patente: ${rank.name}. Sequência atual: ${streak}.`}>
  {onOpen?<button type="button" className="rank-badge-button" onClick={onOpen} aria-label={`Ver todas as patentes. Atual: ${rank.name}`}><Insignia rank={rank}/></button>:<Insignia rank={rank}/>}
  {warning&&<button type="button" className="rank-warning" onClick={onWarning} aria-label={warning}>NUVEM PENDENTE</button>}
  <div className="rank-main">
   <span className="ops-tag">DIAS CUMPRIDOS</span>
   <strong className="rank-total">{total}</strong>
   <span className="rank-name">{rank.name}</span>
   <span className="rank-sub">Sequência {streak}{best>streak?` · recorde ${best}`:''}</span>
  </div>
  <div className="rank-progress" aria-hidden="true">{Array.from({length:10},(_,k)=><i key={k} data-on={k<rank.inLevel}/>)}</div>
  <span className="rank-next">{10-rank.inLevel} {10-rank.inLevel===1?'dia':'dias'} para {rank.nextName}</span>
 </section>;
}

// Cerimônia de promoção: animação própria de cada classe (divisas, barras, estrelas, ordem, Mil Dias).
const CEREMONY:Record<Rank['klass'],string>={recruit:'Incorporado.',enlisted:'Divisa conquistada.',officer:'Oficial em comando.',general:'Estrela de general.',marshal:'Marechal.',honor:'Grau da ordem conquistado.',supreme:'Comando Supremo.',legend:'Mil dias cumpridos.'};
export function Promotion({rank,day,preview=false,onClose}:{rank:Rank;day:number;preview?:boolean;onClose:()=>void}){
 const button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{button.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};document.addEventListener('keydown',key);return ()=>document.removeEventListener('keydown',key);},[onClose]);
 const newOrder=rank.grade===1&&(rank.klass==='honor'||rank.klass==='supreme');
 return <div className="promotion" data-class={rank.klass} data-metal={rank.metal} role="dialog" aria-modal="true" aria-labelledby="promotion-title">
  <div className="promotion-card">
   <span className="ops-tag">{preview?'PRÉVIA DA PROMOÇÃO':'PROMOÇÃO'} · DIA {day}</span>
   <div className="promotion-stage"><Insignia rank={rank} animate/></div>
   <h2 id="promotion-title">{rank.name}</h2>
   <p>{newOrder?`Nova ordem: ${rank.group}.`:CEREMONY[rank.klass]} {rank.klass==='legend'?'Disciplina comprovada.':`Próxima: ${rank.nextName} no dia ${rank.nextAt}.`}</p>
   <button ref={button} type="button" className="primary" onClick={onClose}>{preview?'Fechar':'Prosseguir'}</button>
  </div>
 </div>;
}

// Mostra a cerimônia uma única vez por patente nova (só em Hoje, na data atual).
const SEEN_KEY='oaolife-rank-seen';
export function usePromotion(rank:Rank,active:boolean){
 const [shown,setShown]=useState<Rank|null>(null);
 useEffect(()=>{if(!active)return;let seen:number|null=null;try{const v=localStorage.getItem(SEEN_KEY);seen=v===null?null:Number(v);}catch{return;}
  if(seen===null||!Number.isFinite(seen)){try{localStorage.setItem(SEEN_KEY,String(rank.level));}catch{/* sem armazenamento */}return;}
  if(rank.level>seen)setShown(rank);},[rank,active]);
 const close=()=>{if(shown)try{localStorage.setItem(SEEN_KEY,String(shown.level));}catch{/* sem armazenamento */}setShown(null);};
 return {promotion:shown,close};
}

// Galeria: todas as patentes do dia 0 ao dia 1000, com estado e prévia da cerimônia.
export function RankGallery({total}:{total:number}){
 const [preview,setPreview]=useState<Rank|null>(null);
 const groups=[...new Set(ALL_RANKS.map(r=>r.group))];
 const current=Math.floor(Math.max(0,total)/DAYS_PER_RANK);
 return <div className="rank-gallery">
  <p className="rank-gallery-intro">{ALL_RANKS.length} patentes até o dia {FINAL_DAY}. Uma promoção a cada {DAYS_PER_RANK} dias cumpridos; uma ordem nova a cada 100 dias a partir do dia 200. Toque em uma insígnia para ver a cerimônia.</p>
  {groups.map(g=>{const list=ALL_RANKS.filter(r=>r.group===g),first=list[0],order=ORDERS.findIndex(o=>o.name===g);
   return <section key={g} className="rank-group" data-metal={first.metal} aria-label={g}>
    <div className="section-heading"><h3>{g}</h3><span>Dia {first.startDay}{list.length>1?`–${list.at(-1)!.startDay+DAYS_PER_RANK-1}`:''}{order>=0?` · ${first.metal.replace('-',' ')}`:''}</span></div>
    <div className="rank-grid">{list.map(r=>{const state=r.level<current?'done':r.level===current?'current':'locked';
     return <button key={r.level} type="button" className="rank-card" data-state={state} data-class={r.klass} data-metal={r.metal} onClick={()=>setPreview(r)} aria-label={`${r.name}, dia ${r.startDay}. ${state==='done'?'Conquistada':state==='current'?'Patente atual':`Faltam ${r.startDay-total} dias`}. Ver cerimônia.`}>
      <Insignia rank={r}/><strong>{r.name}</strong><small>{state==='current'?'ATUAL':state==='done'?'CONQUISTADA':`DIA ${r.startDay}`}</small>
     </button>;})}</div>
   </section>;})}
  {preview&&<Promotion rank={preview} day={preview.startDay} preview onClose={()=>setPreview(null)}/>}
 </div>;
}
