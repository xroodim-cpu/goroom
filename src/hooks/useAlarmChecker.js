import { useEffect, useRef } from 'react';
import { showNotification as notify, requestNotificationPermission, getNotificationPermission } from '../lib/notify';

const OFFSETS = { '10m': 600000, '30m': 1800000, '1h': 3600000, '1d': 86400000 };
const LABELS = { '10m': '10분 전', '30m': '30분 전', '1h': '1시간 전', '1d': '하루 전' };

function getNextOccurrence(sch, now) {
  const base = new Date(`${sch.date}T${sch.time || '00:00'}`);
  if (!sch.repeat) return base;

  const { type, interval, endDate } = sch.repeat;
  if (base >= now) return base;

  const cur = new Date(base);
  const end = endDate ? new Date(endDate + 'T23:59:59') : null;

  for (let i = 0; i < 1000; i++) {
    if (type === 'daily') cur.setDate(cur.getDate() + 1);
    else if (type === 'weekly') cur.setDate(cur.getDate() + 7);
    else if (type === 'monthly') cur.setMonth(cur.getMonth() + 1);
    else if (type === 'yearly') cur.setFullYear(cur.getFullYear() + 1);
    else if (type === 'custom') cur.setDate(cur.getDate() + (interval || 1));

    if (end && cur > end) return null;
    if (cur >= now) return cur;
  }
  return null;
}

// 알림 표시는 lib/notify.js 의 통합 API(showNotification) 사용
// → 플랫폼별(Capacitor/Electron/Web) 분기는 notify.js 에서 일괄 처리
async function fireNotification(title, body, roomId) {
  await notify({ title, body, url: `/calendar/${roomId}/cal` });
}

export default function useAlarmChecker(rooms, userId) {
  const firedRef = useRef(new Set());

  useEffect(() => {
    // Restore fired set from sessionStorage
    try {
      const saved = sessionStorage.getItem('gr_fired_alarms');
      if (saved) firedRef.current = new Set(JSON.parse(saved));
    } catch {}

    // 알림 권한: 플랫폼 무관 (notify.js 에서 자동 분기)
    (async () => {
      try {
        const perm = await getNotificationPermission();
        if (perm !== 'granted') {
          await requestNotificationPermission();
        }
      } catch (e) {
        console.log('[useAlarmChecker] notification init failed:', e?.message);
      }
    })();
  }, []);

  useEffect(() => {
    const notiEnabled = localStorage.getItem('gr_noti_schedule') !== 'false';
    if (!rooms.length || !notiEnabled) {
      if (!rooms.length) console.log('[AlarmChecker] No rooms');
      if (!notiEnabled) console.log('[AlarmChecker] Schedule notification disabled');
      return;
    }

    let cancelled = false;
    let permGranted = false;
    (async () => {
      try {
        permGranted = (await getNotificationPermission()) === 'granted';
      } catch { permGranted = false; }
      if (!permGranted) console.log('[AlarmChecker] notification permission not granted');
    })();

    const check = () => {
      if (!permGranted || cancelled) return;
      const now = new Date();
      let scheduleCount = 0;

      for (const room of rooms) {
        for (const sch of room.schedules || []) {
          scheduleCount++;
          if (!sch.alarm?.before) {
            continue;
          }

          const offset = OFFSETS[sch.alarm.before];
          if (!offset) {
            console.warn('[AlarmChecker] Unknown alarm offset:', sch.alarm.before);
            continue;
          }

          const schTime = sch.repeat ? getNextOccurrence(sch, new Date(now.getTime() - offset)) : new Date(`${sch.date}T${sch.time || '00:00'}`);
          if (!schTime) continue;

          const alarmTime = new Date(schTime.getTime() - offset);
          const key = `${sch.id}_${schTime.getTime()}`;

          if (now >= alarmTime && now < schTime && !firedRef.current.has(key)) {
            firedRef.current.add(key);
            try { sessionStorage.setItem('gr_fired_alarms', JSON.stringify([...firedRef.current])); } catch {}

            console.log('[AlarmChecker] 🔔 Alarm triggered:', sch.title, 'at', alarmTime);
            const label = LABELS[sch.alarm.before] || sch.alarm.before;
            const body = sch.alarm.message || `${label} — ${sch.date}${sch.time ? ' ' + sch.time : ''}`;
            fireNotification(`🔔 ${sch.title}`, body, room.id);
          }
        }
      }

      if (scheduleCount > 0 && scheduleCount % 50 === 0) {
        console.log('[AlarmChecker] Checked', scheduleCount, 'schedules at', now.toLocaleTimeString());
      }
    };

    check();
    const id = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, [rooms, userId]);
}
