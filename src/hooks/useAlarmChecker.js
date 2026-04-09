import { useEffect, useRef } from 'react';
import {
  scheduleAlarm,
  cancelAllAlarms,
  requestNotificationPermission,
  getNotificationPermission,
} from '../lib/notify';

// ───────────────────────────────────────────────────────────
// useAlarmChecker — "예약 방식" 알람 관리자
//
// 과거 버전: setInterval(30초)로 앱에서 직접 시각 체크 → 앱 꺼지면 안 울림 ❌
// 현재 버전: LocalNotifications.schedule({ schedule: { at: Date } }) 로
//          미래 시각을 OS(AlarmManager) 에 등록 → 앱 종료되어도 정확히 울림 ✅
//
// 전략:
// - rooms 가 변할 때마다 → 기존 예약 전부 cancel → 새로 전부 schedule
// - 반복 일정은 향후 30일치만 미리 예약 (무한 방지, 주기 갱신은 앱 재진입 시)
// - 이미 지난 시각은 스킵
// ───────────────────────────────────────────────────────────

const OFFSETS = { '10m': 600000, '30m': 1800000, '1h': 3600000, '1d': 86400000 };
const LABELS = { '10m': '10분 전', '30m': '30분 전', '1h': '1시간 전', '1d': '하루 전' };
const SCHEDULE_AHEAD_MS = 30 * 24 * 60 * 60 * 1000; // 30일치 미리 예약

// 반복 스케줄을 확장해서 [start, start + SCHEDULE_AHEAD_MS] 구간의 모든 발생 시각 리스트 반환
function expandOccurrences(sch, from, to) {
  const base = new Date(`${sch.date}T${sch.time || '00:00'}`);
  if (isNaN(base.getTime())) return [];

  if (!sch.repeat) {
    return base.getTime() >= from.getTime() && base.getTime() <= to.getTime() ? [base] : [];
  }

  const { type, interval, endDate } = sch.repeat;
  const end = endDate ? new Date(endDate + 'T23:59:59') : null;
  const cur = new Date(base);
  const out = [];
  const MAX_ITER = 500;

  for (let i = 0; i < MAX_ITER; i++) {
    if (end && cur > end) break;
    if (cur > to) break;
    if (cur >= from) out.push(new Date(cur));

    if (type === 'daily') cur.setDate(cur.getDate() + (interval || 1));
    else if (type === 'weekly') cur.setDate(cur.getDate() + 7 * (interval || 1));
    else if (type === 'monthly') cur.setMonth(cur.getMonth() + (interval || 1));
    else if (type === 'yearly') cur.setFullYear(cur.getFullYear() + (interval || 1));
    else if (type === 'custom') cur.setDate(cur.getDate() + (interval || 1));
    else break;
  }
  return out;
}

export default function useAlarmChecker(rooms, userId) {
  const lastSigRef = useRef('');

  // 초기 1회: 권한 요청
  useEffect(() => {
    (async () => {
      try {
        const perm = await getNotificationPermission();
        if (perm !== 'granted') {
          await requestNotificationPermission();
        }
      } catch (e) {
        console.log('[AlarmChecker] permission request failed:', e?.message);
      }
    })();
  }, []);

  // rooms 변화 → 알람 재예약
  useEffect(() => {
    const notiEnabled = localStorage.getItem('gr_noti_schedule') !== 'false';
    if (!rooms.length || !notiEnabled) {
      // 알림 꺼짐 → 예약된 알람도 모두 취소
      if (!notiEnabled) { cancelAllAlarms().catch(() => {}); }
      return;
    }

    // 스케줄 시그니처: rooms 안의 모든 스케줄 id+date+time+alarm 조합을 해시
    // 동일하면 재예약 스킵 (불필요한 cancel/schedule 방지)
    const parts = [];
    for (const room of rooms) {
      for (const sch of room.schedules || []) {
        if (!sch.alarm?.before) continue;
        parts.push(`${sch.id}|${sch.date}|${sch.time || ''}|${sch.alarm.before}|${sch.repeat?.type || ''}|${sch.repeat?.interval || ''}|${sch.repeat?.endDate || ''}`);
      }
    }
    const sig = parts.sort().join('##');
    if (sig === lastSigRef.current) {
      return; // 변화 없음
    }
    lastSigRef.current = sig;

    let cancelled = false;
    (async () => {
      try {
        // 권한 재확인 (런타임 거부 가능성)
        const perm = await getNotificationPermission();
        if (perm !== 'granted') {
          console.log('[AlarmChecker] permission not granted — skip scheduling');
          return;
        }

        // 1) 기존 고룸 알람 전부 취소
        const cancelled_n = await cancelAllAlarms();
        if (cancelled_n > 0) console.log('[AlarmChecker] cancelled', cancelled_n, 'pending alarms');
        if (cancelled) return;

        // 2) 새 예약
        const now = new Date();
        const until = new Date(now.getTime() + SCHEDULE_AHEAD_MS);
        let scheduledCount = 0;

        for (const room of rooms) {
          for (const sch of room.schedules || []) {
            if (!sch.alarm?.before) continue;
            const offset = OFFSETS[sch.alarm.before];
            if (!offset) continue;

            // 이 스케줄의 향후 30일치 발생 시각
            const occurrences = expandOccurrences(sch, now, until);
            for (const schTime of occurrences) {
              const alarmTime = new Date(schTime.getTime() - offset);
              if (alarmTime.getTime() <= now.getTime() + 5000) continue; // 이미 지났거나 5초 이내

              const label = LABELS[sch.alarm.before] || sch.alarm.before;
              const dateStr = `${schTime.getMonth() + 1}월 ${schTime.getDate()}일`;
              const timeStr = sch.time ? ` ${sch.time}` : '';
              const body = sch.alarm.message || `${label} — ${dateStr}${timeStr}`;

              const id = await scheduleAlarm({
                scheduleId: sch.id,
                at: alarmTime,
                title: `🔔 ${sch.title || '일정'}`,
                body,
                url: `/calendar/${room.id}/cal`,
                occurrenceMs: schTime.getTime(),
              });
              if (id) scheduledCount++;
              if (cancelled) return;
            }
          }
        }

        console.log(`[AlarmChecker] ✅ scheduled ${scheduledCount} alarms for next 30 days`);
      } catch (e) {
        console.error('[AlarmChecker] schedule batch failed:', e);
      }
    })();

    return () => { cancelled = true; };
  }, [rooms, userId]);
}
