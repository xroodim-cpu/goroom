import { useState } from 'react';
import { sbGet, sbDelete } from '../../supabase';
import { deleteFromWasabi as deleteFile, deleteFolderFromWasabi as deleteFolder } from '../../wasabi';
import I from '../../components/shared/Icon';

export default function AppSettings({goBack, sb, userId, onLogout}) {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleLogout = async () => {
    localStorage.removeItem('gr_noti_schedule');
    localStorage.removeItem('gr_noti_friend');
    localStorage.removeItem('gr_noti_feed');
    if (onLogout) { await onLogout(); }
    else { localStorage.removeItem('goroom_user_id'); window.location.reload(); }
  };

  const handleReset = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    try {
      // Delete all user data from Supabase
      const memberRowsArr = await sbGet(`/goroom_room_members?select=room_id&user_id=eq.${userId}`);
      const roomIds = (memberRowsArr || []).map(m => m.room_id);
      for (const rid of roomIds) {
        await sbDelete(`/goroom_schedules?room_id=eq.${rid}`);
        await sbDelete(`/goroom_memos?room_id=eq.${rid}`);
        await sbDelete(`/goroom_todos?room_id=eq.${rid}`);
        await sbDelete(`/goroom_diaries?room_id=eq.${rid}`);
        await sbDelete(`/goroom_room_members?room_id=eq.${rid}`);
        await sbDelete(`/goroom_rooms?id=eq.${rid}`);
        await deleteFolder(`calendar/${rid}`);
      }
      await sbDelete(`/goroom_friends?user_id=eq.${userId}`);
      await deleteFolder(`user/${userId}`);
      await sbDelete(`/goroom_users?id=eq.${userId}`);
      localStorage.removeItem('goroom_user_id');
      window.location.reload();
    } catch (e) {
      console.error('Reset error:', e);
      alert('초기화 실패');
    }
  };

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">설정</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-set-row"><span className="gr-set-label">테마</span><span className="gr-set-val">라이트 (준비중)</span></div>
      <div className="gr-set-row"><span className="gr-set-label">언어</span><span className="gr-set-val">한국어</span></div>
      <div className="gr-set-row"><span className="gr-set-label">앱 정보</span><span className="gr-set-val">GoRoom v2.0.0</span></div>
      <div style={{marginTop:24}}>
        <button className="gr-btn-primary" onClick={handleLogout} style={{background:'var(--gr-t2)',marginBottom:12}}>
          <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><I n="logout" size={16} color="#fff"/> 로그아웃</span>
        </button>
        <button className="gr-btn-danger" onClick={handleReset}>
          <I n="trash" size={16}/> {confirmReset ? '정말 초기화하시겠습니까? (다시 클릭)' : '데이터 초기화'}
        </button>
      </div>
    </div>
  </div>;
}
