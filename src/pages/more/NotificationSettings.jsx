import { useState } from 'react';
import I from '../../components/shared/Icon';
import Toggle from '../../components/shared/Toggle';

export default function NotificationSettings({goBack, sb}) {
  const [scheduleNoti, setScheduleNoti] = useState(() => localStorage.getItem('gr_noti_schedule') !== 'false');
  const [friendNoti, setFriendNoti] = useState(() => localStorage.getItem('gr_noti_friend') !== 'false');
  const [feedNoti, setFeedNoti] = useState(() => localStorage.getItem('gr_noti_feed') !== 'false');
  const [permState, setPermState] = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'denied');

  const requestPerm = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermState(result);
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
          ? <>🚫 브라우저 알림이 차단되어 있습니다. 브라우저 설정에서 알림을 허용해주세요.</>
          : <>🔔 알림을 받으려면 브라우저 알림 권한을 허용해주세요. <button onClick={requestPerm} style={{marginLeft:8,padding:'4px 12px',borderRadius:6,border:'1px solid #ccc',background:'#fff',cursor:'pointer',fontSize:13}}>알림 허용</button></>
        }
      </div>}
      <div className="gr-set-row"><span className="gr-set-label"><I n="cal" size={16}/> 스케줄 알림</span><Toggle on={scheduleNoti} toggle={()=>toggle('gr_noti_schedule',scheduleNoti,setScheduleNoti)}/></div>
      <div className="gr-set-row"><span className="gr-set-label"><I n="userPlus" size={16}/> 친구 요청 알림</span><Toggle on={friendNoti} toggle={()=>toggle('gr_noti_friend',friendNoti,setFriendNoti)}/></div>
      <div className="gr-set-row"><span className="gr-set-label"><I n="book" size={16}/> 피드 알림</span><Toggle on={feedNoti} toggle={()=>toggle('gr_noti_feed',feedNoti,setFeedNoti)}/></div>
    </div>
  </div>;
}
