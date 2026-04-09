import { Capacitor } from '@capacitor/core';

// 전 플랫폼 공통 플랜 (Netflix 방식: 웹/데스크톱/Android 앱 모두 Toss 웹결제 사용)
export const PLANS = [
  { id: 'plan_20g', name: '20 GB', bytes: 20 * 1024 * 1024 * 1024, price: 3900, label: '3,900' },
  { id: 'plan_50g', name: '50 GB', bytes: 50 * 1024 * 1024 * 1024, price: 7900, label: '7,900', popular: true },
  { id: 'plan_100g', name: '100 GB', bytes: 100 * 1024 * 1024 * 1024, price: 12900, label: '12,900' },
];

export const PLAN_BYTES = PLANS.reduce((acc, p) => { acc[p.id] = p.bytes; return acc; }, {});

const TOSS_CLIENT_KEY = 'live_ck_kZLKGPx4M3MYMxPPy6eVBaWypv1o';

// 플랫폼 감지
export function getPlatform() {
  if (Capacitor.getPlatform() === 'android') return 'android';
  if (Capacitor.getPlatform() === 'ios') return 'ios';
  if (typeof window !== 'undefined' && window.electronAPI) return 'electron';
  return 'web';
}

export function isNativeAndroid() {
  return getPlatform() === 'android';
}

async function loadTossScript() {
  if (typeof window === 'undefined') return;
  if (window.TossPayments) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://js.tosspayments.com/v2/standard';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Toss 스크립트 로드 실패'));
    document.head.appendChild(s);
  });
}

// 웹/데스크톱에서 Toss 결제 위젯 호출 (공통)
async function requestTossBillingAuth({ plan, userId, successPath = '/payment/success', failPath = '/payment/fail' }) {
  await loadTossScript();
  if (!window.TossPayments) throw new Error('TossPayments 로드 실패');
  const origin = window.location.origin;
  const successUrl = `${origin}${successPath}?plan=${plan.id}&userId=${encodeURIComponent(userId)}`;
  const failUrl = `${origin}${failPath}`;
  const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);
  const payment = tossPayments.payment({ customerKey: userId });
  await payment.requestBillingAuth('CARD', {
    amount: { currency: 'KRW', value: plan.price },
    orderId: `storage_${userId}_${Date.now()}`,
    orderName: `고룸 용량 추가 ${plan.name}/월`,
    customerEmail: '',
    successUrl,
    failUrl,
  });
}

// Android 앱에서 "용량 관리" 페이지 자체를 외부 Chrome Custom Tab으로 엶 (Netflix 방식).
// 넷플릭스 모바일 앱이 '결제 정보'를 탭했을 때 웹 페이지로 자연스럽게 넘어가듯,
// 고룸도 Android 앱에서는 용량/결제 UI 전체를 웹으로 넘겨 Google Play 정책 리스크를 회피한다.
export async function openExternalStoragePage({ userId } = {}) {
  const qs = userId ? `?from=app&userId=${encodeURIComponent(userId)}` : '?from=app';
  const url = `https://goroom.kr/more/storage${qs}`;
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url, presentationStyle: 'popover' });
    return true;
  } catch (e) {
    console.warn('[billing] Capacitor Browser 열기 실패, fallback 처리', e);
    try { window.location.href = url; } catch {}
    return false;
  }
}

// 전 플랫폼 공통 구독 시작 진입점.
// Android 앱은 애초에 StoragePage에 도달하지 않고 외부 브라우저로 튕겨지므로,
// 이 함수는 사실상 웹/데스크톱 컨텍스트에서만 호출된다.
// 혹시라도 Android에서 호출되면 안전하게 외부 브라우저로 폴백.
export async function startSubscription({ planId, userId }) {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) throw new Error('Invalid plan');
  if (!userId) throw new Error('User not logged in');

  if (isNativeAndroid()) {
    await openExternalStoragePage({ userId });
    return;
  }

  await requestTossBillingAuth({ plan, userId });
}

// BillingStart 페이지에서 직접 Toss 호출할 때 사용
export async function runTossBillingAuthFromPage({ planId, userId, fromApp }) {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) throw new Error('Invalid plan');
  if (!userId) throw new Error('User not logged in');
  const successPath = fromApp ? '/payment/success' : '/payment/success';
  await requestTossBillingAuth({ plan, userId, successPath });
}

// 현재 활성 구독 정보 (Toss 기반 단순 조회)
export function getPlanById(planId) {
  return PLANS.find(p => p.id === planId) || null;
}
