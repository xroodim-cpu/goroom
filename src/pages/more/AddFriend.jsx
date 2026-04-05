import { useState } from 'react';
import I from '../../components/shared/Icon';

export default function AddFriendPage({goBack, me, addFriendByCode, sb}) {
  const [code, setCode] = useState('');
  const [adding, setAdding] = useState(false);
  const handleAdd = async () => {
    if (!code.trim()) return;
    setAdding(true);
    await addFriendByCode(code.trim());
    setAdding(false);
    setCode('');
  };
  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">친구 추가</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-pg-label">친구 추가 코드 입력</div>
      <input className="gr-input" value={code} onChange={e=>setCode(e.target.value)} placeholder="코드를 입력하세요" autoFocus onKeyDown={e=>e.key==='Enter'&&handleAdd()}/>
      <button className="gr-btn-primary" style={{marginTop:12}} onClick={handleAdd} disabled={adding}>{adding?'추가중...':'추가하기'}</button>
      <div className="gr-divider"><span>내 코드</span></div>
      <div className="gr-code-box"><span>{me.linkCode}</span><button className="gr-btn-copy" onClick={()=>{navigator.clipboard?.writeText(me.linkCode);alert('복사됨!');}}>복사</button></div>
    </div>
  </div>;
}
