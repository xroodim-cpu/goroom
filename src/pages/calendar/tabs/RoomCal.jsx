import { useMemo } from 'react';
import I from '../../../components/shared/Icon';
import SchCard from '../../../components/shared/SchCard';
import { fmt, DAYS, MO } from '../../../lib/helpers';

/** 반복 스케줄을 특정 월에 확장하여 가상 인스턴스 생성 */
function expandRecurring(schedules, year, month) {
  const expanded = [];
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  for (const s of schedules) {
    // 원본 날짜에는 항상 표시
    const origDate = new Date(s.date + 'T00:00:00');
    if (origDate >= monthStart && origDate <= monthEnd) {
      expanded.push(s);
    }

    if (!s.repeat) {
      // 반복 아닌데 이번 달이 아니면 이미 위에서 처리
      if (origDate < monthStart || origDate > monthEnd) {
        // 이번 달 범위 밖이면 스킵
      }
      continue;
    }

    const { type, interval, endDate } = s.repeat;
    const end = endDate ? new Date(endDate + 'T23:59:59') : new Date(year + 2, 0, 1); // 최대 2년
    if (end < monthStart) continue;

    // 반복 인스턴스 생성
    let cur = new Date(origDate);
    const seen = new Set();
    seen.add(s.date); // 원본은 이미 추가됨

    for (let i = 0; i < 1000; i++) {
      // 다음 날짜 계산
      if (type === 'daily') {
        cur.setDate(cur.getDate() + 1);
      } else if (type === 'weekly') {
        cur.setDate(cur.getDate() + 7);
      } else if (type === 'monthly') {
        cur.setMonth(cur.getMonth() + 1);
      } else if (type === 'yearly') {
        cur.setFullYear(cur.getFullYear() + 1);
      } else if (type === 'custom') {
        cur.setDate(cur.getDate() + (interval || 1));
      }

      if (cur > end || cur > monthEnd) break;
      if (cur < monthStart) continue;

      const dateStr = fmt(cur);
      if (!seen.has(dateStr)) {
        seen.add(dateStr);
        expanded.push({ ...s, date: dateStr, _recurring: true, _origId: s.id });
      }
    }
  }

  return expanded;
}

export default function RoomCal({nav,setNav,sel,setSel,today,schedules,onSchClick}){
  const y=nav.getFullYear(),m=nav.getMonth(),fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),dip=new Date(y,m,0).getDate();
  const ts=fmt(today),ss=fmt(sel); const cells=[];
  for(let i=0;i<fd;i++) cells.push({d:dip-fd+i+1,o:true,dt:new Date(y,m-1,dip-fd+i+1)}); for(let i=1;i<=dim;i++) cells.push({d:i,o:false,dt:new Date(y,m,i)}); const rem=7-cells.length%7; if(rem<7) for(let i=1;i<=rem;i++) cells.push({d:i,o:true,dt:new Date(y,m+1,i)});
  const mv=d=>{const n=new Date(nav);n.setMonth(n.getMonth()+d);setNav(n);};

  // 반복 스케줄 확장
  const expandedSchs = useMemo(() => expandRecurring(schedules, y, m), [schedules, y, m]);

  const visibleSchs=expandedSchs.filter(s=>!s.budget||s.budget.showInCal!==false);
  const selSchs=visibleSchs.filter(s=>s.date===ss);
  const getSchs=ds=>visibleSchs.filter(s=>s.date===ds).slice(0,4);

  return <div><div className="gr-cal-nav"><button className="gr-cal-nav-btn" onClick={()=>mv(-1)}><I n="left" size={18}/></button><h3>{y}년 {MO[m]}</h3><button className="gr-cal-nav-btn" onClick={()=>mv(1)}><I n="right" size={18}/></button></div><div className="gr-cal-head">{DAYS.map(d=><span key={d}>{d}</span>)}</div><div className="gr-cal-grid">{cells.map((c,i)=>{const ds=fmt(c.dt),dd=getSchs(ds); return <div key={i} className={`gr-cal-cell ${c.o?'ot':''} ${ds===ts?'tod':''} ${ds===ss&&ds!==ts?'sel':''}`} onClick={()=>setSel(c.dt)}><span className="gr-cal-d">{c.d}</span><div className="gr-cal-events">{dd.map((sc,j)=>sc.time
    ?<div key={j} className="gr-cal-ev gr-cal-ev-time"><span className="gr-cal-ev-bar" style={{background:sc.color||'var(--gr-acc)'}}/><span className="gr-cal-ev-txt">{sc.mood||''}{sc.title}</span></div>
    :<div key={j} className="gr-cal-ev gr-cal-ev-allday" style={{background:sc.color||'var(--gr-acc)'}}><span className="gr-cal-ev-txt">{sc.mood||''}{sc.title}</span></div>
  )}</div></div>;})}</div><div className="gr-cal-sel-info"><div className="gr-cal-sel-date">{sel.getMonth()+1}월 {sel.getDate()}일 {DAYS[sel.getDay()]}요일</div>{selSchs.length===0?<div className="gr-cal-empty">스케줄이 없습니다</div>:selSchs.map((sc,i)=> <SchCard key={sc._recurring ? `${sc._origId}-${sc.date}` : sc.id} sc={sc} onClick={()=>onSchClick&&onSchClick(sc)}/>)}</div></div>;
}
