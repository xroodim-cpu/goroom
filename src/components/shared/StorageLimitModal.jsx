import { useState } from 'react';
import I from './Icon';
import { fmtSize } from '../../lib/helpers';

const PLANS = [
  { id: 'plan_20g', name: '20 GB', bytes: 20*1024*1024*1024, price: 3300, label: '3,300' },
  { id: 'plan_50g', name: '50 GB', bytes: 50*1024*1024*1024, price: 6600, label: '6,600', popular: true },
  { id: 'plan_100g', name: '100 GB', bytes: 100*1024*1024*1024, price: 11000, label: '11,000' },
];

export default function StorageLimitModal({ onClose, usedSize, storageLimit, userId, onUpgradeComplete }) {
  const [selected, setSelected] = useState('plan_50g');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    const plan = PLANS.find(p => p.id === selected);
    if (!plan || processing) return;
    setProcessing(true);
    try {
      // 토스페이먼츠 SDK 로드
      if (!window.TossPayments) {
        const script = document.createElement('script');
        script.src = 'https://js.tosspayments.com/v2/standard';
        script.onload = () => initPayment(plan);
        document.head.appendChild(script);
      } else {
        await initPayment(plan);
      }
    } catch (e) {
      console.error('Payment error:', e);
      alert('결제 초기화에 실패했습니다. 다시 시도해주세요.');
      setProcessing(false);
    }
  };

  const initPayment = async (plan) => {
    try {
      const tossPayments = TossPayments('live_ck_kZLKGPx4M3MYMxPPy6eVBaWypv1o');
      const payment = tossPayments.payment({ customerKey: userId });
      await payment.requestBillingAuth('CARD', {
        amount: { currency: 'KRW', value: plan.price },
        orderId: `storage_${userId}_${Date.now()}`,
        orderName: `구롬 용량 추가 ${plan.name}/월`,
        customerEmail: '',
        successUrl: `${window.location.origin}/payment/success?plan=${plan.id}&userId=${userId}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (e) {
      console.error('TossPayments error:', e);
      setProcessing(false);
    }
  };

  return (
    <div className="gr-modal-overlay" onClick={onClose}>
      <div className="gr-storage-modal" onClick={e => e.stopPropagation()}>
        <button className="gr-modal-close" onClick={onClose}><I n="x" size={20}/></button>

        <div className="gr-storage-modal-icon">
          <I n="database" size={32} color="#F04452"/>
        </div>
        <div className="gr-storage-modal-title">무료 용량을 모두 사용했어요</div>
        <div className="gr-storage-modal-desc">
          현재 <strong>{fmtSize(usedSize)}</strong> / {fmtSize(storageLimit)} 사용 중
          <br/>용량을 추가해서 계속 업로드하세요
        </div>

        <div className="gr-storage-plans">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`gr-storage-plan ${selected === plan.id ? 'on' : ''} ${plan.popular ? 'popular' : ''}`}
              onClick={() => setSelected(plan.id)}
            >
              {plan.popular && <div className="gr-plan-badge">추천</div>}
              <div className="gr-plan-size">{plan.name}</div>
              <div className="gr-plan-price">
                <span className="gr-plan-won">{plan.label}</span>
                <span className="gr-plan-unit">원/월</span>
              </div>
            </div>
          ))}
        </div>

        <button
          className="gr-storage-pay-btn"
          onClick={handlePayment}
          disabled={processing}
        >
          {processing ? '결제 준비 중...' : '토스페이로 정기결제'}
        </button>

        <div className="gr-storage-modal-note">
          정기결제는 매월 자동 갱신되며, 언제든 해지할 수 있어요
        </div>
      </div>
    </div>
  );
}

export { PLANS };
