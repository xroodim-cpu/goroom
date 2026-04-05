import I from '../../../components/shared/Icon';
import SchCard from '../../../components/shared/SchCard';
import { fmt, DAYS, MO } from '../../../lib/helpers';

export default function RoomCal({nav,setNav,sel,setSel,today,schedules,onSchClick}){
  const y=nav.getFullYear(),m=nav.getMonth(),fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),dip=new Date(y,m,0).getDate();
  const ts=fmt(today),ss=fmt(sel); const cells=[];
  for(let i=0;i<fd;i++) cells.push({d:dip-fd+i+1,o:true,dt:new Date(y,m-1,dip-fd+i+1)}); for(let i=1;i<=dim;i++) cells.push({d:i,o:false,dt:new Date(y,m,i)}); const rem=7-cells.length%7; if(rem<7) for(let i=1;i<=rem;i++) cells.push({d:i,o:true,dt:new Date(y,m+1,i)});
  const mv=d=>{const n=new Date(nav);n.setMonth(n.getMonth()+d);setNav(n);}; const selSchs=schedules.filter(s=>s.date===ss); const dots=ds=>schedules.filter(s=>s.date===ds).slice(0,3);
  return <div><div className="gr-cal-nav"><button className="gr-cal-nav-btn" onClick={()=>mv(-1)}><I n="left" size={18}/></button><h3>{y}년 {MO[m]}</h3><button className="gr-cal-nav-btn" onClick={()=>mv(1)}><I n="right" size={18}/></button></div><div className="gr-cal-head">{DAYS.map(d=><span key={d}>{d}</span>)}</div><div className="gr-cal-grid">{cells.map((c,i)=>{const ds=fmt(c.dt),dd=dots(ds); return <div key={i} className={`gr-cal-cell ${c.o?'ot':''} ${ds===ts?'tod':''} ${ds===ss&&ds!==ts?'sel':''}`} onClick={()=>setSel(c.dt)}><span className="gr-cal-d">{c.d}</span>{dd.length>0&&<div className="gr-cal-dots">{dd.map((sc,j)=><span key={j} style={{background:sc.color||'var(--gr-acc)'}}/>)}</div>}</div>;})}</div><div className="gr-cal-sel-info"><div className="gr-cal-sel-date">{sel.getMonth()+1}월 {sel.getDate()}일 {DAYS[sel.getDay()]}요일</div>{selSchs.length===0?<div className="gr-cal-empty">스케줄이 없습니다</div>:selSchs.map(sc=> <SchCard key={sc.id} sc={sc} onClick={()=>onSchClick&&onSchClick(sc)}/>)}</div></div>;
}
