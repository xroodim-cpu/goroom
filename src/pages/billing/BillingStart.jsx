import { useEffect, useState } from 'react';
import { runTossBillingAuthFromPage, getPlanById } from '../../lib/billing';

// Android 앱에서 외부 Chrome Custom Tab으로 열리는 페이지.
// URL 파라미터(plan, userId, from=app)를 받아 바로 Toss 결제 플로우를 호출.
// 결제 성공 시 Toss가 /payment/success?plan=...&userId=... 로 리다이렉트.
// /payment/success 페이지는 from=app 인 경우 딥링크로 앱에 복귀 처리.
export default function BillingStart() {
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const planId = params.get('plan');
        const userId = params.get('userId');
        const fromApp = params.get('from') === 'app';
        if (!planId || !userId) {
          setErr('잘못된 접근입니다 (plan 또는 userId 누락).');
          return;
        }
        const plan = getPlanById(planId);
        if (!plan) {
          setErr('알 수 없는 요금제입니다.');
          return;
        }
        await runTossBillingAuthFromPage({ planId, userId, fromApp });
      } catch (e) {
        console.error('BillingStart error:', e);
        setErr('결제 초기화 중 문제가 발생했습니다. 다시 시도해주세요.');
      }
    })();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>결제 페이지를 여는 중입니다</div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>잠시만 기다려주세요…</div>
      {err && (
        <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: 12, color: '#c00', maxWidth: 400, textAlign: 'center' }}>
          {err}
        </div>
      )}
    </div>
  );
}
