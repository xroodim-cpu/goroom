import { useState } from 'react';
import { supabase } from '../../supabase';
import I from '../../components/shared/Icon';

export default function MyInfoPage({goBack, sb, me, setMe, saveProfile, authUser}) {
  const [birthday, setBirthday] = useState(me.birthday || '');
  const [editBday, setEditBday] = useState(false);
  const [savingBday, setSavingBday] = useState(false);

  const [pwMode, setPwMode] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [snsMsg, setSnsMsg] = useState('');

  const saveBirthday = async () => {
    setSavingBday(true);
    const updated = { ...me, birthday };
    await saveProfile(updated);
    setSavingBday(false);
    setEditBday(false);
  };

  const changePassword = async () => {
    if (!newPw || !confirmPw) return setPwMsg('새 비밀번호를 입력하세요.');
    if (newPw.length < 6) return setPwMsg('비밀번호는 6자 이상이어야 합니다.');
    if (newPw !== confirmPw) return setPwMsg('새 비밀번호가 일치하지 않습니다.');
    setPwLoading(true); setPwMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwMsg('비밀번호가 변경되었습니다.');
      setCurPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => { setPwMsg(''); setPwMode(false); }, 1500);
    } catch (e) { setPwMsg(e.message); }
    setPwLoading(false);
  };

  const handleSnsLink = (provider) => {
    setSnsMsg(`${provider} 연동은 준비 중입니다.`);
    setTimeout(() => setSnsMsg(''), 2000);
  };

  const displayBday = birthday ? `${birthday.slice(5,7)}월 ${birthday.slice(8,10)}일` : '미설정';

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">내 정보</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">

      {/* 계정 정보 */}
      <div className="gr-pg-label">계정 정보</div>
      <div className="gr-myinfo-card">
        <div className="gr-myinfo-row">
          <span className="gr-myinfo-label"><I n="mail" size={14} color="var(--gr-t3)"/> 이메일</span>
          <span className="gr-myinfo-val">{authUser?.email || '없음'}</span>
        </div>
        <div className="gr-myinfo-row">
          <span className="gr-myinfo-label"><I n="user" size={14} color="var(--gr-t3)"/> 닉네임</span>
          <span className="gr-myinfo-val">{me.nickname}</span>
        </div>
        <div className="gr-myinfo-row">
          <span className="gr-myinfo-label"><I n="link" size={14} color="var(--gr-t3)"/> 친구 코드</span>
          <span className="gr-myinfo-val" style={{fontSize:12}}>{me.linkCode}</span>
        </div>
      </div>

      {/* 생일 */}
      <div className="gr-pg-label" style={{marginTop:20}}>생일</div>
      <div className="gr-myinfo-card">
        {editBday ? <div>
          <div style={{fontSize:12,color:'var(--gr-t3)',marginBottom:8}}>생일은 내 캘린더와 친구 목록에서 해당 날짜에 노출됩니다.</div>
          <input type="date" className="gr-input" value={birthday} onChange={e=>setBirthday(e.target.value)} style={{marginBottom:8}}/>
          <div style={{display:'flex',gap:6}}>
            <button className="gr-btn-sm" onClick={saveBirthday} disabled={savingBday}>{savingBday?'저장중...':'저장'}</button>
            <button className="gr-btn-sm-outline" onClick={()=>{setBirthday(me.birthday||'');setEditBday(false);}}>취소</button>
          </div>
        </div> : <div className="gr-myinfo-row" style={{cursor:'pointer'}} onClick={()=>setEditBday(true)}>
          <span className="gr-myinfo-label"><I n="cal" size={14} color="var(--gr-t3)"/> 생일</span>
          <span className="gr-myinfo-val">{displayBday} <I n="edit" size={12} color="var(--gr-t3)"/></span>
        </div>}
      </div>

      {/* 비밀번호 변경 */}
      <div className="gr-pg-label" style={{marginTop:20}}>보안</div>
      <div className="gr-myinfo-card">
        {pwMode ? <div>
          {pwMsg && <div className={`gr-login-error`} style={{marginBottom:8}}>{pwMsg}</div>}
          <div className="gr-login-field" style={{marginBottom:8}}>
            <I n="lock" size={14} color="#999"/>
            <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="새 비밀번호 (6자 이상)"/>
          </div>
          <div className="gr-login-field" style={{marginBottom:8}}>
            <I n="lock" size={14} color="#999"/>
            <input type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="새 비밀번호 확인" onKeyDown={e=>e.key==='Enter'&&changePassword()}/>
          </div>
          <div style={{display:'flex',gap:6}}>
            <button className="gr-btn-sm" onClick={changePassword} disabled={pwLoading}>{pwLoading?'변경중...':'변경'}</button>
            <button className="gr-btn-sm-outline" onClick={()=>{setPwMode(false);setPwMsg('');setNewPw('');setConfirmPw('');}}>취소</button>
          </div>
        </div> : <div className="gr-myinfo-row" style={{cursor:'pointer'}} onClick={()=>setPwMode(true)}>
          <span className="gr-myinfo-label"><I n="lock" size={14} color="var(--gr-t3)"/> 비밀번호 변경</span>
          <span className="gr-myinfo-val"><I n="right" size={14} color="var(--gr-t3)"/></span>
        </div>}
      </div>

      {/* SNS 연동 */}
      <div className="gr-pg-label" style={{marginTop:20}}>SNS 연동</div>
      {snsMsg && <div className="gr-login-error" style={{marginBottom:8}}>{snsMsg}</div>}
      <div className="gr-myinfo-card">
        <div className="gr-myinfo-row" style={{cursor:'pointer'}} onClick={()=>handleSnsLink('구글')}>
          <span className="gr-myinfo-label">
            <svg style={{width:14,height:14,verticalAlign:'middle'}} viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {' '}구글
          </span>
          {(authUser?.providers||[]).includes('google')
            ? <span className="gr-myinfo-val" style={{color:'var(--gr-acc)',fontSize:12}}>연동됨</span>
            : <span className="gr-myinfo-val" style={{color:'var(--gr-t3)',fontSize:12}}>미연동 <I n="right" size={14} color="var(--gr-t3)"/></span>}
        </div>
        <div className="gr-myinfo-row" style={{cursor:'pointer'}} onClick={()=>handleSnsLink('카카오')}>
          <span className="gr-myinfo-label">
            <svg style={{width:14,height:14,verticalAlign:'middle'}} viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-1.18 4.36c-.1.36.32.64.64.43l5.08-3.35c.26.02.53.03.8.03 5.52 0 10-3.58 10-7.94S17.52 3 12 3z"/></svg>
            {' '}카카오
          </span>
          {(authUser?.providers||[]).includes('kakao')
            ? <span className="gr-myinfo-val" style={{color:'var(--gr-acc)',fontSize:12}}>연동됨</span>
            : <span className="gr-myinfo-val" style={{color:'var(--gr-t3)',fontSize:12}}>미연동 <I n="right" size={14} color="var(--gr-t3)"/></span>}
        </div>
      </div>

    </div>
  </div>;
}
