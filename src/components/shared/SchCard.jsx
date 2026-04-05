import I from './Icon';

export default function SchCard({sc,onClick}){
  const imgs=sc.images||[];
  return <div className="gr-sch-card" onClick={onClick} style={{cursor:'pointer'}}>
    {imgs.length>0&&<div className="gr-sch-thumb"><img src={imgs[0]} alt=""/>{imgs.length>1&&<span className="gr-sch-thumb-count">+{imgs.length-1}</span>}</div>}
    <div className="gr-sch-bar" style={{background:sc.color||'var(--gr-acc)'}}/>
    <div className="gr-sch-body"><div className="gr-sch-title">{sc.title}</div><div className="gr-sch-meta">{sc.time&&<span>{sc.time}</span>}{sc.memo&&<span>{sc.memo}</span>}</div>{sc.budget&&<div className="gr-sch-budget" style={{color:sc.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}>{sc.budget.type==='income'?'+':'-'}{sc.budget.amount?.toLocaleString()}원</div>}</div>
  </div>;
}
