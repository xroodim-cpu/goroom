import { useState } from 'react';
import I from '../../../components/shared/Icon';
import { DEF_SETTINGS } from '../../../lib/helpers';

export default function RoomBudget({schedules, room}){
  const [searchQ, setSearchQ] = useState('');
  const st = room?.settings || DEF_SETTINGS;
  const paymentMethods = st.paymentMethods || DEF_SETTINGS.paymentMethods;
  const getPmName = (pmId) => paymentMethods.find(p=>p.id===pmId)?.name || '';

  let budgets=schedules.filter(s=>s.budget);

  // Filter by search
  if (searchQ.trim()) {
    const q = searchQ.toLowerCase();
    budgets = budgets.filter(s => {
      const title = (s.title||'').toLowerCase();
      const catName = (s.budget.bCatName||'').toLowerCase();
      const pmName = getPmName(s.budget.pmId).toLowerCase();
      return title.includes(q) || catName.includes(q) || pmName.includes(q);
    });
  }

  const inc=budgets.filter(s=>s.budget.type==='income').reduce((a,s)=>a+s.budget.amount,0);
  const exp=budgets.filter(s=>s.budget.type==='expense').reduce((a,s)=>a+s.budget.amount,0);

  return <div style={{padding:12}}>
    {/* Search bar */}
    <div className="gr-memo-search" style={{marginBottom:12}}>
      <I n="search" size={14} color="var(--gr-t3)"/>
      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="항목, 카테고리, 결제수단 검색..." className="gr-memo-search-input"/>
    </div>
    <div className="gr-budget-summary"><div className="gr-budget-box"><div className="gr-budget-label">수입</div><div className="gr-budget-val" style={{color:'var(--gr-inc)'}}>+{inc.toLocaleString()}</div></div><div className="gr-budget-box"><div className="gr-budget-label">지출</div><div className="gr-budget-val" style={{color:'var(--gr-exp)'}}>-{exp.toLocaleString()}</div></div><div className="gr-budget-box"><div className="gr-budget-label">잔액</div><div className="gr-budget-val" style={{color:inc-exp>=0?'var(--gr-inc)':'var(--gr-exp)'}}>{(inc-exp).toLocaleString()}</div></div></div>
    {budgets.length===0?<div className="gr-cal-empty" style={{marginTop:20}}>내역이 없습니다</div>:budgets.sort((a,b)=>b.createdAt-a.createdAt).map(sc=> <div key={sc.id} className="gr-budget-row">
      <div className="gr-budget-dot" style={{background:sc.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}/>
      <div className="gr-budget-info">
        <div style={{fontWeight:500}}>{sc.title}</div>
        <div style={{fontSize:11,color:'var(--gr-t3)'}}>
          {sc.date}
          {sc.budget.bCatName && <span> · {sc.budget.bCatName}</span>}
          {sc.budget.pmId && getPmName(sc.budget.pmId) && <span> · {getPmName(sc.budget.pmId)}</span>}
        </div>
      </div>
      <div style={{fontWeight:700,color:sc.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}>{sc.budget.type==='income'?'+':'-'}{sc.budget.amount.toLocaleString()}원</div>
    </div>)}
  </div>;
}
