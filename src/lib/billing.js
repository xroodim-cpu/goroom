import { Capacitor } from '@capacitor/core';

// Google Play 상품 ID 매핑
const GOOGLE_PRODUCT_IDS = {
  plan_20g: 'goroom_storage_20g',
  plan_50g: 'goroom_storage_50g',
  plan_100g: 'goroom_storage_100g',
};

export function isNativeAndroid() {
  return Capacitor.getPlatform() === 'android';
}

let storeReady = false;
let storeInstance = null;

// cordova-plugin-purchase 초기화
export async function initBilling() {
  if (!isNativeAndroid() || storeReady) return;

  const { store, ProductType, Platform } = await import('cordova-plugin-purchase');
  storeInstance = store;

  // 구독 상품 등록
  Object.values(GOOGLE_PRODUCT_IDS).forEach(productId => {
    store.register({
      id: productId,
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.GOOGLE_PLAY,
    });
  });

  // 구매 검증 (서버사이드)
  store.validator = async (receipt, callback) => {
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-google-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt }),
      });
      const result = await resp.json();
      callback(result.ok, result);
    } catch (e) {
      console.error('Subscription verification failed:', e);
      callback(false, { error: e.message });
    }
  };

  await store.initialize([Platform.GOOGLE_PLAY]);
  storeReady = true;
}

// 구독 구매
export async function purchaseSubscription(planId) {
  if (!storeInstance) await initBilling();
  if (!storeInstance) throw new Error('Billing not available');

  const googleProductId = GOOGLE_PRODUCT_IDS[planId];
  if (!googleProductId) throw new Error('Invalid plan');

  const product = storeInstance.get(googleProductId);
  if (!product) throw new Error('Product not found');

  const offer = product.getOffer();
  if (!offer) throw new Error('No offer available');

  await offer.order();
}

// 현재 활성 구독 확인
export function getActiveSubscription() {
  if (!storeInstance) return null;

  for (const [planId, googleId] of Object.entries(GOOGLE_PRODUCT_IDS)) {
    const product = storeInstance.get(googleId);
    if (product?.owned) {
      return { planId, googleProductId: googleId, product };
    }
  }
  return null;
}

// 구독 상태 변경 리스너
export function onSubscriptionUpdate(callback) {
  if (!storeInstance) return () => {};

  const handler = (product) => {
    if (product.owned) {
      const planId = Object.entries(GOOGLE_PRODUCT_IDS).find(([, gId]) => gId === product.id)?.[0];
      callback({ active: true, planId, product });
    } else {
      callback({ active: false, planId: null, product });
    }
  };

  Object.values(GOOGLE_PRODUCT_IDS).forEach(id => {
    storeInstance.when(id).updated(handler);
  });

  return () => {};
}

// Google Play 구독 관리 페이지로 이동
export function openSubscriptionManagement() {
  if (isNativeAndroid()) {
    storeInstance?.manageSubscriptions();
  }
}
