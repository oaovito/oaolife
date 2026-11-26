import type { Rank } from '../domain/rank';

// Insígnia gerada: divisas (praças), barras (oficiais), estrelas (generais/Marechal).
function star(cx:number,cy:number,r:number){return Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.42:r;return `${(cx+rr*Math.cos(a)).toFixed(2)},${(cy+rr*Math.sin(a)).toFixed(2)}`;}).join(' ');}
export function Insignia({rank}:{rank:Rank}){
 const {klass,marks}=rank,shapes:React.ReactNode[]=[];
 if(klass==='enlisted'){const chev=Math.min(marks,3),rock=marks-chev;
  for(let i=0;i<chev;i++)shapes.push(<path key={`c${i}`} d={`M14 ${30+i*9} L32 ${18+i*9} L50 ${30+i*9}`} />);
  for(let i=0;i<rock;i++)shapes.push(<path key={`r${i}`} d={`M14 ${46+i*7} Q32 ${56+i*7} 50 ${46+i*7}`} />);}
 if(klass==='officer'){const rows=Math.ceil(marks/4);for(let i=0;i<marks;i++){const row=Math.floor(i/4),inRow=Math.min(4,marks-row*4),col=i%4,w=8,gap=3,x0=32-(inRow*w+(inRow-1)*gap)/2;shapes.push(<rect key={i} x={x0+col*(w+gap)} y={32-rows*8+row*16} width={w} height={12} rx={1.5}/>);}}
 if(klass==='general'||klass==='marshal'){const n=Math.min(marks,7),r=n<=3?8:n<=5?6.5:5.2,perRow=n<=4?n:Math.ceil(n/2),rows=Math.ceil(n/perRow);
  for(let i=0;i<n;i++){const row=Math.floor(i/perRow),inRow=Math.min(perRow,n-row*perRow),col=i%perRow,step=r*2.3;shapes.push(<polygon key={i} points={star(32-(inRow-1)*step/2+col*step,32-(rows-1)*r*1.2+row*r*2.4,r)}/>);}}
 return <svg className="insignia" data-class={klass} viewBox="0 0 64 64" role="img" aria-label={`Insígnia: ${rank.name}`}>
  <path className="insignia-shield" d="M32 3 L58 12 V32 C58 47 46 57 32 61 C18 57 6 47 6 32 V12 Z"/>
  <g className="insignia-marks">{klass==='recruit'?<circle cx="32" cy="32" r="6"/>:shapes}</g>
 </svg>;
}

export function RankCounter({rank,total,streak,best}:{rank:Rank;total:number;streak:number;best:number}){
 return <section className="rank-counter" data-class={rank.klass} aria-label={`Dias cumpridos integralmente: ${total}. Patente: ${rank.name}. Sequência atual: ${streak}.`}>
  <Insignia rank={rank}/>
  <div className="rank-main">
   <span className="ops-tag">DIAS CUMPRIDOS</span>
   <strong className="rank-total">{total}</strong>
   <span className="rank-name">{rank.name}</span>
   <span className="rank-sub">Sequência {streak}{best>streak?` · recorde ${best}`:''}</span>
  </div>
  <div className="rank-progress" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i} data-on={i<rank.inLevel}/>)}</div>
  <span className="rank-next">{10-rank.inLevel} {10-rank.inLevel===1?'dia':'dias'} para {rank.nextName}</span>
 </section>;
}
