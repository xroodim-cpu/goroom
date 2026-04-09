import { useState, useEffect } from 'react';
import I from '../../components/shared/Icon';
import { listFolderSize } from '../../wasabi';
import { fmtSize } from '../../lib/helpers';
import { isNativeAndroid, initBilling, purchaseSubscription, getActiveSubscription, openSubscriptionManagement } from '../../lib/billing';

const FREE_LIMIT = 1024 * 1024 * 1024; // 1GB 기본 무료

const PLAN_LABELS = {
  [20 * 1024 * 1024 * 1024]: '20 GB',
  [50 * 1024 * 1024 * 1024]: '50 GB',
  [100 * 1024 * 1024 * 1024]: '100 GB',
};

const PLANS = [
  { id: 'plan_20g', name: '20 GB', bytes: 20*1024*1024*1024, price: 3900, label: '3,900' },
  { id: 'plan_50g', name: '50 GB', bytes: 50*1024*1024*1024, price: 7900, label: '7,900', popular: true },
  { id: 'plan_100g', name: '100 GB', bytes: 100*1024*1024*1024, price: 12900, label: '12,900' },
];

export default function StoragePage({ goBack, rooms, userId, me }) {
  const ownerRooms = rooms.filter(r => r.members.find(m => m.id === userId && m.role === 'owner'));
  const [storageData, setStorageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('plan_50g');
  const [processing, setProcessing] = useState(false);

  const isAdmin = !!me?.isAdmin;
  const storageLimit = isAdmin ? Infinity : (me?.storageLimit || FREE_LIMIT);
  const planLabel = isAdmin ? '무제한' : (PLAN_LABELS[storageLimit] || fmtSize(storageLimit));
  const isPaid = !isAdmin && storageLimit > FREE_LIMIT;
  const isOver = !isAdmin && totalSize >= storageLimit;

  useEffect(() => {
    (async () => {
      const results = [];
      for (const room of ownerRooms) {
        const info = await listFolderSize(`calendar/${room.id}/`);
        results.push({ roomId: room.id, roomName: room.name, size: info.size, fileCount: info.fileCount });
      }
      const userInfo = await listFolderSize(`user/${userId}/`);
      if (userInfo.size > 0) {
        results.push({ roomId: '_profile', roomName: '프로필 이미지', size: userInfo.size, fileCount: userInfo.fileCount });
      }
      setStorageData(results);
      setTotalSize(results.reduce((s, r) => s + r.size, 0));
      setLoading(false);
    })();
  }, []);

  const pct = isAdmin ? 0 : Math.min((totalSize / storageLimit) * 100, 100);

  const isAndroid = isNativeAndroid();

  useEffect(() => {
    if (isAndroid) initBilling(userId).catch(console.error);
  }, [userId]);

  const handlePayment = async () => {
    const plan = PLANS.find(p => p.id === selectedPlan);
    if (!plan || processing) return;
    setProcessing(true);
    try {
      if (isAndroid) {
        await purchaseSubscription(plan.id);
      } else {
        if (!window.TossPayments) {
          const script = document.createElement('script');
          script.src = 'https://js.tosspayments.com/v2/standard';
          script.onload = () => initTossPayment(plan);
          document.head.appendChild(script);
        } else {
          await initTossPayment(plan);
        }
      }
    } catch (e) {
      console.error('Payment error:', e);
      alert('결제 초기화에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  const initTossPayment = async (plan) => {
    try {
      const tossPayments = TossPayments('live_ck_kZLKGPx4M3MYMxPPy6eVBaWypv1o');
      const payment = tossPayments.payment({ customerKey: userId });
      await payment.requestBillingAuth('CARD', {
        amount: { currency: 'KRW', value: plan.price },
        orderId: `storage_${userId}_${Date.now()}`,
        orderName: `고룸 용량 추가 ${plan.name}/월`,
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
    <div className="gr-panel">
      <div className="gr-pg-top">
        <button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>
        <div className="gr-pg-title">용량</div>
        <div style={{ width: 28 }}/>
      </div>
      <div className="gr-pg-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--gr-t3)' }}>용량 계산 중...</div>
        ) : (
          <>
            {/* 총 사용량 */}
            <div className="gr-storage-total">
              <div className="gr-storage-total-head">
                <I n="database" size={18} color={isOver ? '#F04452' : 'var(--gr-acc)'}/>
                <span>총 사용량</span>
              </div>
              <div className="gr-storage-total-size">
                <span style={{ color: isOver ? '#F04452' : undefined }}>{fmtSize(totalSize)}</span>
                {' '}<span className="gr-storage-total-limit">/ {planLabel}</span>
              </div>
              {!isAdmin && (
                <>
                  <div className="gr-storage-bar">
                    <div className="gr-storage-fill" style={{ width: `${pct}%`, background: pct >= 90 ? '#F04452' : 'var(--gr-acc)' }}/>
                  </div>
                  <div className="gr-storage-pct" style={{ color: isOver ? '#F04452' : undefined }}>{pct.toFixed(1)}% 사용</div>
                </>
              )}
            </div>

            {/* 요금제 정보 */}
            <div className="gr-storage-info">
              <div className="gr-storage-info-title">현재 요금제</div>
              <div className="gr-storage-info-row">
                <span>요금제</span>
                <span style={{fontWeight:600}}>{isAdmin ? '관리자 (무제한)' : isPaid ? `${planLabel} 구독 중` : '무료 (1 GB)'}</span>
              </div>
              <div className="gr-storage-info-row">
                <span>사용 가능</span>
                <span style={{ color: isOver ? '#F04452' : undefined, fontWeight: isOver ? 600 : 400 }}>
                  {isAdmin ? '무제한' : isOver ? '용량 초과' : `${fmtSize(Math.max(0, storageLimit - totalSize))} 남음`}
                </span>
              </div>

              {/* 무료 사용자: 인라인 요금제 선택 */}
              {!isPaid && !isAdmin && (
                <div style={{marginTop:16}}>
                  <div style={{display:'flex',gap:8,marginBottom:12}}>
                    {PLANS.map(plan => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        style={{
                          flex:1, border: selectedPlan===plan.id ? '2px solid var(--gr-acc)' : '2px solid var(--gr-brd)',
                          borderRadius:12, padding:'12px 4px', textAlign:'center', cursor:'pointer',
                          background: selectedPlan===plan.id ? 'rgba(204,34,44,.04)' : 'var(--gr-bg)',
                          position:'relative', transition:'all .2s',
                        }}
                      >
                        {plan.popular && <div style={{position:'absolute',top:-9,left:'50%',transform:'translateX(-50%)',background:'#F59E0B',color:'#fff',fontSize:9,fontWeight:700,padding:'1px 8px',borderRadius:8,whiteSpace:'nowrap'}}>추천</div>}
                        <div style={{fontSize:14,fontWeight:700,color:'var(--gr-text)',marginBottom:4}}>{plan.name}</div>
                        <div style={{display:'flex',alignItems:'baseline',justifyContent:'center',gap:1}}>
                          <span style={{fontSize:15,fontWeight:700,color:'var(--gr-acc)'}}>{plan.label}</span>
                          <span style={{fontSize:10,color:'var(--gr-t3)'}}>원/월</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="gr-storage-pay-btn" style={{width:'100%'}} onClick={handlePayment} disabled={processing}>
                    {processing ? '결제 준비 중...' : isAndroid ? 'Google Play로 구독하기' : '구독하기'}
                  </button>
                  <div style={{textAlign:'center',fontSize:11,color:'var(--gr-t3)',marginTop:6}}>정기결제는 매월 자동 갱신되며, 언제든 해지 가능</div>
                </div>
              )}

              {isPaid && (
                <div className="gr-storage-info-row" style={{marginTop:8}}>
                  <span style={{fontSize:11,color:'var(--gr-t3)'}}>정기결제 중 · 해지는 설정에서 가능</span>
                  {isAndroid && (
                    <button onClick={openSubscriptionManagement} style={{fontSize:11,color:'var(--gr-acc)',background:'none',border:'none',cursor:'pointer',padding:0}}>
                      구독 관리
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 캘린더별 용량 */}
            <div className="gr-pg-label" style={{ marginTop: 20 }}>캘린더별 사용량</div>
            {storageData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--gr-t3)', fontSize: 14 }}>방장인 캘린더가 없습니다</div>
            ) : (
              storageData.sort((a, b) => b.size - a.size).map(r => {
                const roomPct = isAdmin ? 0 : (storageLimit > 0 ? (r.size / storageLimit) * 100 : 0);
                return (
                  <div key={r.roomId} className="gr-storage-room">
                    <div className="gr-storage-room-info">
                      <div className="gr-storage-room-name">{r.roomName}</div>
                      <div className="gr-storage-room-meta">{r.fileCount}개 파일 · {fmtSize(r.size)}</div>
                    </div>
                    {!isAdmin && (
                      <div className="gr-storage-room-bar">
                        <div className="gr-storage-room-fill" style={{ width: `${Math.min(roomPct, 100)}%` }}/>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
