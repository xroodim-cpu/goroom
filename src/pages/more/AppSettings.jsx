import { useState } from 'react';
import { sbGet, sbDelete } from '../../supabase';
import { deleteFromWasabi as deleteFile, deleteFolderFromWasabi as deleteFolder } from '../../wasabi';
import I from '../../components/shared/Icon';

export default function AppSettings({goBack, sb, userId, onLogout}) {
  const [withdrawStep, setWithdrawStep] = useState(0); // 0: idle, 1: 1차 확인, 2: 2차 확인(문구 입력)
  const [withdrawInput, setWithdrawInput] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const handleLogout = async () => {
    localStorage.removeItem('gr_noti_schedule');
    localStorage.removeItem('gr_noti_friend');
    localStorage.removeItem('gr_noti_feed');
    if (onLogout) { await onLogout(); }
    else { localStorage.removeItem('goroom_user_id'); window.location.reload(); }
  };

  const handleWithdraw = async () => {
    if (withdrawing) return;
    setWithdrawing(true);
    try {
      // 1) 사용자가 속한 모든 방의 데이터 삭제
      const memberRowsArr = await sbGet(`/goroom_room_members?select=room_id&user_id=eq.${userId}`);
      const roomIds = (memberRowsArr || []).map(m => m.room_id);
      for (const rid of roomIds) {
        await sbDelete(`/goroom_schedules?room_id=eq.${rid}`);
        await sbDelete(`/goroom_memos?room_id=eq.${rid}`);
        await sbDelete(`/goroom_todos?room_id=eq.${rid}`);
        await sbDelete(`/goroom_diaries?room_id=eq.${rid}`);
        await sbDelete(`/goroom_room_members?room_id=eq.${rid}`);
        await sbDelete(`/goroom_rooms?id=eq.${rid}`);
        try { await deleteFolder(`calendar/${rid}`); } catch {}
      }
      // 2) 친구 관계 삭제 (양방향)
      await sbDelete(`/goroom_friends?user_id=eq.${userId}`);
      await sbDelete(`/goroom_friends?friend_id=eq.${userId}`);
      // 3) 사용자 본인 프로필 이미지 폴더 삭제
      try { await deleteFolder(`user/${userId}`); } catch {}
      // 4) 사용자 레코드 삭제
      await sbDelete(`/goroom_users?id=eq.${userId}`);
      // 5) 로컬 상태 전부 비우고 로그아웃
      try {
        ['gr_noti_schedule','gr_noti_friend','gr_noti_feed','goroom_user_id','goroom_redirect_path','goroom_join_code','goroom_join_slug','gr_widget_user'].forEach(k => localStorage.removeItem(k));
      } catch {}
      alert('회원 탈퇴가 완료되었습니다. 그동안 고룸을 이용해주셔서 감사합니다.');
      window.location.href = '/';
    } catch (e) {
      console.error('Withdraw error:', e);
      alert('회원 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setWithdrawing(false);
      setWithdrawStep(0);
      setWithdrawInput('');
    }
  };

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">설정</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-set-row"><span className="gr-set-label">테마</span><span className="gr-set-val">라이트 (준비중)</span></div>
      <div className="gr-set-row"><span className="gr-set-label">언어</span><span className="gr-set-val">한국어</span></div>
      <div className="gr-set-row"><span className="gr-set-label">앱 정보</span><span className="gr-set-val">GoRoom v2.0.0</span></div>
      <div style={{marginTop:24}}>
        <button className="gr-btn-primary" onClick={handleLogout} style={{background:'var(--gr-t2)'}}>
          <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><I n="logout" size={16} color="#fff"/> 로그아웃</span>
        </button>
      </div>

      {/* 회원 탈퇴 — 눈에 띄지 않는 텍스트 링크로 하단 배치 */}
      <div style={{marginTop:48,paddingTop:16,borderTop:'1px solid #f1f1f1',textAlign:'center'}}>
        <button
          onClick={() => setWithdrawStep(1)}
          style={{
            background:'none',
            border:'none',
            color:'#9aa0a6',
            fontSize:12,
            cursor:'pointer',
            padding:'8px 12px',
            textDecoration:'underline',
            textUnderlineOffset:'3px',
          }}
        >
          회원 탈퇴
        </button>
      </div>
    </div>

    {/* 회원 탈퇴 1차 확인 모달 */}
    {withdrawStep === 1 && (
      <div className="gr-modal-overlay" onClick={()=>setWithdrawStep(0)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:14,padding:24,maxWidth:360,width:'100%',boxShadow:'0 10px 40px rgba(0,0,0,.2)'}}>
          <div style={{fontSize:17,fontWeight:700,color:'#1f1f1f',marginBottom:10}}>회원 탈퇴 안내</div>
          <div style={{fontSize:13,lineHeight:1.7,color:'#475569',marginBottom:18}}>
            탈퇴하시면 아래 데이터가 <b style={{color:'#cc222c'}}>영구적으로 삭제</b>되며 복구할 수 없습니다:<br/>
            <span style={{display:'inline-block',marginTop:8,fontSize:12,color:'#64748b'}}>
              • 프로필 정보 및 사진<br/>
              • 내가 만든 모든 캘린더/방과 그 안의 일정·메모·다이어리·할 일<br/>
              • 친구 목록<br/>
              • 업로드한 모든 이미지
            </span>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setWithdrawStep(0)} style={{flex:1,padding:'12px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:14,fontWeight:600,color:'#475569'}}>취소</button>
            <button onClick={()=>setWithdrawStep(2)} style={{flex:1,padding:'12px',borderRadius:8,border:'none',background:'#cc222c',color:'#fff',cursor:'pointer',fontSize:14,fontWeight:600}}>계속</button>
          </div>
        </div>
      </div>
    )}

    {/* 회원 탈퇴 2차 확인 모달 — "탈퇴" 입력 */}
    {withdrawStep === 2 && (
      <div className="gr-modal-overlay" onClick={()=>!withdrawing && setWithdrawStep(0)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:14,padding:24,maxWidth:360,width:'100%',boxShadow:'0 10px 40px rgba(0,0,0,.2)'}}>
          <div style={{fontSize:17,fontWeight:700,color:'#1f1f1f',marginBottom:10}}>최종 확인</div>
          <div style={{fontSize:13,lineHeight:1.7,color:'#475569',marginBottom:14}}>
            탈퇴를 진행하려면 아래 입력란에 <b style={{color:'#cc222c'}}>탈퇴</b> 라고 입력해주세요.
          </div>
          <input
            type="text"
            value={withdrawInput}
            onChange={e=>setWithdrawInput(e.target.value)}
            disabled={withdrawing}
            placeholder="탈퇴"
            autoFocus
            style={{width:'100%',padding:'12px 14px',borderRadius:8,border:'1px solid #e5e7eb',fontSize:14,marginBottom:16,boxSizing:'border-box'}}
          />
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>{setWithdrawStep(0);setWithdrawInput('');}} disabled={withdrawing} style={{flex:1,padding:'12px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff',cursor:withdrawing?'not-allowed':'pointer',fontSize:14,fontWeight:600,color:'#475569',opacity:withdrawing?.5:1}}>취소</button>
            <button
              onClick={handleWithdraw}
              disabled={withdrawInput !== '탈퇴' || withdrawing}
              style={{
                flex:1,
                padding:'12px',
                borderRadius:8,
                border:'none',
                background:(withdrawInput==='탈퇴' && !withdrawing)?'#cc222c':'#e5e7eb',
                color:(withdrawInput==='탈퇴' && !withdrawing)?'#fff':'#9ca3af',
                cursor:(withdrawInput==='탈퇴' && !withdrawing)?'pointer':'not-allowed',
                fontSize:14,
                fontWeight:600,
              }}
            >{withdrawing ? '처리 중…' : '회원 탈퇴'}</button>
          </div>
        </div>
      </div>
    )}
  </div>;
}
