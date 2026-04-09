import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import I from '../../components/shared/Icon';
import Toggle from '../../components/shared/Toggle';
import { getNotificationPermission, requestNotificationPermission, showNotification, getPendingAlarms, scheduleAlarm } from '../../lib/notify';

const isAndroidApp = () => { try { return Capacitor.getPlatform() === 'android'; } catch { return false; } };

export default function NotificationSettings({goBack, sb}) {
  const [scheduleNoti, setScheduleNoti] = useState(() => localStorage.getItem('gr_noti_schedule') !== 'false');
  const [friendNoti, setFriendNoti] = useState(() => localStorage.getItem('gr_noti_friend') !== 'false');
  const [feedNoti, setFeedNoti] = useState(() => localStorage.getItem('gr_noti_feed') !== 'false');
  const [permState, setPermState] = useState('default');
  const [pendingCount, setPendingCount] = useState(null);

  const refreshPending = async () => {
    try { const p = await getPendingAlarms(); setPendingCount(p.length); } catch { setPendingCount(null); }
  };

  useEffect(() => {
    (async () => {
      try { setPermState(await getNotificationPermission()); } catch {}
      await refreshPending();
    })();
  }, []);

  const sendTestNow = async () => {
    const ok = await showNotification({ title: '🔔 고룸 테스트 알림', body: '알림이 정상 작동합니다', url: '/' });
    if (!ok) alert('알림 발송 실패 — 권한을 확인하세요');
  };

  const scheduleTest1min = async () => {
    const at = new Date(Date.now() + 60 * 1000);
    const id = await scheduleAlarm({
      scheduleId: 'test_' + Date.now(),
      at,
      title: '🔔 1분 뒤 테스트 알람',
      body: '앱을 끄거나 백그라운드로 보내도 정확히 울려요',
      url: '/',
      occurrenceMs: at.getTime(),
    });
    if (id) {
      alert('1분 뒤 알람이 예약되었습니다. 앱을 꺼도 울리는지 확인해보세요!');
      await refreshPending();
    } else {
      alert('알람 예약 실패 — 권한을 확인하세요');
    }
  };

  const requestPerm = async () => {
    const granted = await requestNotificationPermission();
    const next = granted ? 'granted' : (await getNotificationPermission());
    setPermState(next);
    if (granted) {
      // 권한 허용 직후 테스트 알림 1회 (플랫폼 검증)
      showNotification({ title: '고룸', body: '알림이 허용되었습니다', url: '/' });
    }
  };

  const toggle = (key, val, setter) => {
    const newVal = !val;
    setter(newVal);
    localStorage.setItem(key, String(newVal));
    if (newVal && permState === 'default') requestPerm();
  };

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">알림 설정</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      {permState !== 'granted' && <div style={{padding:'12px 16px',marginBottom:12,borderRadius:10,background:permState==='denied'?'#FEE2E2':'#FEF9C3',fontSize:13,lineHeight:1.5}}>
        {permState === 'denied'
          ? <>🚫 알림이 차단되어 있습니다. 시스템 설정에서 알림을 허용해주세요.</>
          : <>🔔 알림을 받으려면 권한을 허용해주세요. <button onClick={requestPerm} style={{marginLeft:8,padding:'4px 12px',borderRadius:6,border:'1px solid #ccc',background:'#fff',cursor:'pointer',fontSize:13}}>알림 허용</button></>
        }
      </div>}
      <div className="gr-set-row"><span className="gr-set-label"><I n="cal" size={16}/> 스케줄 알림</span><Toggle on={scheduleNoti} toggle={()=>toggle('gr_noti_schedule',scheduleNoti,setScheduleNoti)}/></div>
      <div className="gr-set-row"><span className="gr-set-label"><I n="userPlus" size={16}/> 친구 요청 알림</span><Toggle on={friendNoti} toggle={()=>toggle('gr_noti_friend',friendNoti,setFriendNoti)}/></div>
      <div className="gr-set-row"><span className="gr-set-label"><I n="book" size={16}/> 피드 알림</span><Toggle on={feedNoti} toggle={()=>toggle('gr_noti_feed',feedNoti,setFeedNoti)}/></div>

      {/* 알람 상태 + 테스트 */}
      {permState === 'granted' && (
        <div style={{marginTop:16,padding:14,borderRadius:12,background:'#F8FAFC',border:'1px solid #E5E7EB'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#0F172A',marginBottom:6}}>알람 상태</div>
          <div style={{fontSize:12,color:'#475569',marginBottom:12}}>
            예약된 알람: <b style={{color:'#cc222c'}}>{pendingCount === null ? '-' : pendingCount + '개'}</b>
            <span style={{marginLeft:8,fontSize:11,color:'#94a3b8'}}>(향후 30일치, 자동 재예약)</span>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={sendTestNow} style={{flex:'1 1 auto',padding:'10px 14px',borderRadius:8,border:'1px solid #cbd5e1',background:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,color:'#0f172a'}}>즉시 테스트</button>
            <button onClick={scheduleTest1min} style={{flex:'1 1 auto',padding:'10px 14px',borderRadius:8,border:'none',background:'#cc222c',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600}}>1분 뒤 알람 예약</button>
          </div>
        </div>
      )}

      {/* Android 전용: 배터리 최적화 / 백그라운드 킬 안내 */}
      {isAndroidApp() && (
        <div style={{marginTop:16,padding:14,borderRadius:12,background:'#FFFBEB',border:'1px solid #FDE68A'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#92400E',marginBottom:8}}>⚠️ 알람을 정확히 받으려면</div>
          <div style={{fontSize:12,lineHeight:1.7,color:'#78350F'}}>
            일부 기기(샤오미·삼성·오포 등)는 배터리 절약 기능이 앱을 강제 종료해 알람이 안 울릴 수 있어요.<br/>
            <b>설정 → 앱 → 고룸 → 배터리 → "제한 없음"</b> 으로 변경해주세요.<br/>
            <span style={{fontSize:11,color:'#b45309'}}>(고룸은 이미 예약된 알람은 앱이 꺼져있어도 울리도록 OS에 등록합니다)</span>
          </div>
        </div>
      )}
    </div>
  </div>;
}
