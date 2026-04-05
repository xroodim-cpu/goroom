import { useState } from 'react';
import I from '../../components/shared/Icon';
import Toggle from '../../components/shared/Toggle';
import { uid, fmt, DEF_SETTINGS } from '../../lib/helpers';

export default function BudgetForm({goBack,room,updateRoom,sb,saveSchedule,userId}){
  const st = room.settings || DEF_SETTINGS;
  const paymentMethods = st.paymentMethods || DEF_SETTINGS.paymentMethods;
  const [title,setTitle]=useState(''); const [amount,setAmount]=useState(''); const [type,setType]=useState('expense');
  const [bCatId,setBCatId]=useState(st.expCats[0]?.id||'');
  const [bPmId,setBPmId]=useState(paymentMethods[0]?.id||'');
  const [showInCal,setShowInCal]=useState(true);
  const [saving,setSaving]=useState(false);

  const save=async ()=>{
    if(!title.trim()||!amount||saving) return;
    setSaving(true);
    const bCats = type==='expense' ? st.expCats : st.incCats;
    const bCatItem = bCats.find(c=>c.id===bCatId);
    const sch = {
      id:uid(),title:title.trim(),date:fmt(new Date()),time:'',memo:'',
      color:type==='income'?'#3182F6':'#F04452',
      budget:{type,amount:Number(amount),catId:bCatId,bCatName:bCatItem?.name||'',pmId:bPmId,showInCal},
      createdAt:Date.now(),createdBy:userId,images:[],todos:[],
    };
    const savedSch = await saveSchedule(room.id, sch);
    updateRoom(room.id,r=>({...r,schedules:[...r.schedules,savedSch]}));
    setSaving(false);
    goBack();
  };
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">가계부 추가</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div style={{display:'flex',gap:6,marginBottom:16}}><button className={`gr-type-btn ${type==='expense'?'on-e':''}`} onClick={()=>{setType('expense');setBCatId(st.expCats[0]?.id||'');}}>지출</button><button className={`gr-type-btn ${type==='income'?'on-i':''}`} onClick={()=>{setType('income');setBCatId(st.incCats[0]?.id||'');}}>수입</button></div>
      <div className="gr-pg-label">항목명</div>
      <input className="gr-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 점심식사" autoFocus style={{marginBottom:12}}/>
      <div className="gr-pg-label">금액 (원)</div>
      <input className="gr-input lg" type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/>
      <div className="gr-pg-label">{type==='expense'?'지출':'수입'} 카테고리</div>
      <div className="gr-pills-scroll">{(type==='expense'?st.expCats:st.incCats).map(c=> <button key={c.id} className={`gr-pill-btn ${bCatId===c.id?'on':''}`} style={bCatId===c.id?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setBCatId(c.id)}>{c.name}</button>)}</div>
      <div className="gr-pg-label">결제수단</div>
      <div className="gr-pills-scroll">{paymentMethods.map(pm=> <button key={pm.id} className={`gr-pill-btn ${bPmId===pm.id?'on':''}`} style={bPmId===pm.id?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setBPmId(pm.id)}>{pm.name}</button>)}</div>
      <div className="gr-form-sec-row" style={{marginTop:16}}><span className="gr-form-sec-title"><I n="cal" size={14}/> 캘린더에 표시</span><Toggle on={showInCal} toggle={()=>setShowInCal(!showInCal)}/></div>
    </div>
    <div className="gr-save-bar"><button className="gr-save-btn" disabled={!title.trim()||!amount||saving} onClick={save}>{saving?'저장중...':'저장하기'}</button></div>
  </div>;
}
