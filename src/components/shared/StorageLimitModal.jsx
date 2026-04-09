import { useState } from 'react';
import I from './Icon';
import { fmtSize } from '../../lib/helpers';
import { PLANS, startSubscription, isNativeAndroid, openExternalStoragePage } from '../../lib/billing';

export default function StorageLimitModal({ onClose, usedSize, storageLimit, userId, onUpgradeComplete }) {
  const [selected, setSelected] = useState('plan_50g');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      // Netflix 방식: Android 앱에서는 용량/결제 UI를 외부 브라우저로 넘긴다.
      if (isNativeAndroid()) {
        await openExternalStoragePage({ userId });
        try { onClose && onClose(); } catch {}
        return;
      }
      const plan = PLANS.find(p => p.id === selected);
      if (!plan) return;
      await startSubscription({ planId: plan.id, userId });
    } catch (e) {
      console.error('Payment error:', e);
      alert('결제 초기화에 실패했습니다. 다시 시도해주세요.');
    } finally {
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
          {processing ? '결제 준비 중...' : '구독하기'}
        </button>

        <div className="gr-storage-modal-note">
          정기결제는 매월 자동 갱신되며, 언제든 해지할 수 있어요
        </div>
      </div>
    </div>
  );
}

export { PLANS };
