import { useState } from 'react';
import I from '../../components/shared/Icon';
import Toggle from '../../components/shared/Toggle';

export default function NotificationSettings({goBack, sb}) {
  const [scheduleNoti, setScheduleNoti] = useState(() => localStorage.getItem('gr_noti_schedule') !== 'false');
  const [friendNoti, setFriendNoti] = useState(() => localStorage.getItem('gr_noti_friend') !== 'false');
  const [feedNoti, setFeedNoti] = useState(() => localStorage.getItem('gr_noti_feed') !== 'false');

  const toggle = (key, val, setter) => {
    const newVal = !val;
    setter(newVal);
    localStorage.setItem(key, String(newVal));
  };

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">알림 설정</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-set-row"><span className="gr-set-label"><I n="cal" size={16}/> 스케줄 알림</span><Toggle on={scheduleNoti} toggle={()=>toggle('gr_noti_schedule',scheduleNoti,setScheduleNoti)}/></div>
      <div className="gr-set-row"><span className="gr-set-label"><I n="userPlus" size={16}/> 친구 요청 알림</span><Toggle on={friendNoti} toggle={()=>toggle('gr_noti_friend',friendNoti,setFriendNoti)}/></div>
      <div className="gr-set-row"><span className="gr-set-label"><I n="book" size={16}/> 피드 알림</span><Toggle on={feedNoti} toggle={()=>toggle('gr_noti_feed',feedNoti,setFeedNoti)}/></div>
    </div>
  </div>;
}
