// 플랫폼 통합 알림 모듈 — 웹/Android/Electron 전부 동일 API
// 호출부: `import { requestNotificationPermission, showNotification, scheduleAlarm, cancelAlarms } from '@/lib/notify'`

import { Capacitor } from '@capacitor/core';

function isAndroid() {
  try { return Capacitor.getPlatform() === 'android'; } catch { return false; }
}

function isElectron() {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

// 현재 플랫폼에서 알림 권한 상태 조회 ('granted' | 'denied' | 'default')
export async function getNotificationPermission() {
  if (isAndroid()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const { display } = await LocalNotifications.checkPermissions();
      return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'default';
    } catch { return 'default'; }
  }
  if (isElectron()) return 'granted'; // Electron은 OS에 위임
  if (typeof Notification !== 'undefined') return Notification.permission;
  return 'denied';
}

// 알림 권한 요청 (플랫폼별 분기)
export async function requestNotificationPermission() {
  if (isAndroid()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const { display } = await LocalNotifications.requestPermissions();
      return display === 'granted';
    } catch (e) {
      console.error('[notify] Android 권한 요청 실패', e);
      return false;
    }
  }
  if (isElectron()) return true; // Electron은 OS 권한으로 위임
  if (typeof Notification !== 'undefined') {
    try {
      const r = await Notification.requestPermission();
      return r === 'granted';
    } catch { return false; }
  }
  return false;
}

// 단건 알림 표시 — 모든 플랫폼에서 동일 API (즉시 발사)
export async function showNotification({ title, body, url, icon }) {
  if (isAndroid()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now() % 100000,
          title: title || '고룸',
          body: body || '',
          smallIcon: 'ic_stat_icon_config_sample',
          extra: { url: url || '/' },
        }],
      });
      return true;
    } catch (e) { console.error('[notify] Android 알림 실패', e); return false; }
  }
  if (isElectron()) {
    try {
      window.electronAPI?.notify?.({ title, body });
      return true;
    } catch (e) { console.error('[notify] Electron 알림 실패', e); return false; }
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      const n = new Notification(title || '고룸', {
        body: body || '',
        icon: icon || '/icon-192.png',
      });
      if (url) {
        n.onclick = () => {
          try { window.focus(); window.location.href = url; } catch {}
        };
      }
      return true;
    } catch (e) { console.error('[notify] Web 알림 실패', e); return false; }
  }
  return false;
}

// ───────────────────────────────────────────────────────────
// 알람 예약 API (핵심): 미래 시각에 OS 수준으로 예약
// Android: LocalNotifications.schedule({ at: Date }) → AlarmManager 에 등록
//          앱이 종료되어 있어도 OS가 정확한 시각에 깨워서 알림을 띄운다.
// Web: Notification API 는 예약 기능이 없어서 — setTimeout 폴백 (탭 열려있을 때만)
// Electron: 동일하게 setTimeout 폴백 (앱 켜져있을 때만)
// ───────────────────────────────────────────────────────────

// 고룸 알람 id 네임스페이스: 10000 ~ 99999 사용
// (Android LocalNotifications id 는 정수만 허용, 외부에서 관리하기 쉽도록)
function alarmId(scheduleId, occurrenceMs) {
  // 스케줄 uid + 발생 시각 → 안정적인 hash → 5자리 정수
  const src = `${scheduleId}_${occurrenceMs}`;
  let h = 0;
  for (let i = 0; i < src.length; i++) {
    h = (h * 31 + src.charCodeAt(i)) | 0;
  }
  return 10000 + Math.abs(h) % 89999; // 10000 ~ 99999
}

// 단건 알람 예약 — 미래 시각에만 유효 (과거면 무시)
// opts: { scheduleId, at (Date), title, body, url, occurrenceMs (반복 구분용) }
export async function scheduleAlarm({ scheduleId, at, title, body, url, occurrenceMs }) {
  const atDate = at instanceof Date ? at : new Date(at);
  if (!atDate || isNaN(atDate.getTime())) return null;
  if (atDate.getTime() <= Date.now() + 5000) return null; // 5초 이내는 스킵

  const id = alarmId(scheduleId, occurrenceMs || atDate.getTime());

  if (isAndroid()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{
          id,
          title: title || '고룸',
          body: body || '',
          smallIcon: 'ic_stat_icon_config_sample',
          schedule: { at: atDate, allowWhileIdle: true },
          extra: { url: url || '/', scheduleId },
        }],
      });
      return id;
    } catch (e) {
      console.error('[notify] 알람 예약 실패', e);
      return null;
    }
  }

  // 웹/Electron: setTimeout 폴백 (탭/앱 켜져있을 때만 발사)
  const delay = atDate.getTime() - Date.now();
  if (delay > 0 && delay < 2147483647) { // setTimeout 최대값
    const timerId = setTimeout(() => {
      showNotification({ title, body, url });
    }, delay);
    if (typeof window !== 'undefined') {
      window.__grAlarmTimers = window.__grAlarmTimers || new Map();
      window.__grAlarmTimers.set(id, timerId);
    }
    return id;
  }
  return null;
}

// 예약된 알람 전부 취소 (고룸 네임스페이스 10000~99999)
export async function cancelAllAlarms() {
  if (isAndroid()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const pending = await LocalNotifications.getPending();
      const ids = (pending?.notifications || [])
        .map(n => ({ id: n.id }))
        .filter(n => n.id >= 10000 && n.id <= 99999);
      if (ids.length > 0) {
        await LocalNotifications.cancel({ notifications: ids });
      }
      return ids.length;
    } catch (e) {
      console.error('[notify] 알람 취소 실패', e);
      return 0;
    }
  }
  // 웹/Electron
  if (typeof window !== 'undefined' && window.__grAlarmTimers) {
    let n = 0;
    for (const t of window.__grAlarmTimers.values()) { try { clearTimeout(t); n++; } catch {} }
    window.__grAlarmTimers.clear();
    return n;
  }
  return 0;
}

// 예약된 알람 id 목록 조회 (디버그용)
export async function getPendingAlarms() {
  if (isAndroid()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const pending = await LocalNotifications.getPending();
      return (pending?.notifications || []).filter(n => n.id >= 10000 && n.id <= 99999);
    } catch { return []; }
  }
  if (typeof window !== 'undefined' && window.__grAlarmTimers) {
    return [...window.__grAlarmTimers.keys()].map(id => ({ id }));
  }
  return [];
}
