// 플랫폼 통합 알림 모듈 — 웹/Android/Electron 전부 동일 API
// 호출부: `import { requestNotificationPermission, showNotification } from '@/lib/notify'`

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

// 단건 알림 표시 — 모든 플랫폼에서 동일 API
export async function showNotification({ title, body, url, icon }) {
  if (isAndroid()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now() % 100000,
          title: title || '고룸',
          body: body || '',
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
