import { useState, useEffect } from 'react';
import I from '../../components/shared/Icon';
import StorageLimitModal from '../../components/shared/StorageLimitModal';
import { listFolderSize } from '../../wasabi';
import { fmtSize } from '../../lib/helpers';

const FREE_LIMIT = 1024 * 1024 * 1024; // 1GB 기본 무료

const PLAN_LABELS = {
  [20 * 1024 * 1024 * 1024]: '20 GB',
  [50 * 1024 * 1024 * 1024]: '50 GB',
  [100 * 1024 * 1024 * 1024]: '100 GB',
};

export default function StoragePage({ goBack, rooms, userId, me }) {
  const ownerRooms = rooms.filter(r => r.members.find(m => m.id === userId && m.role === 'owner'));
  const [storageData, setStorageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const storageLimit = me?.storageLimit || FREE_LIMIT;
  const planLabel = PLAN_LABELS[storageLimit] || fmtSize(storageLimit);
  const isPaid = storageLimit > FREE_LIMIT;

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

  const pct = Math.min((totalSize / storageLimit) * 100, 100);

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
                <I n="database" size={18} color="var(--gr-acc)"/>
                <span>총 사용량</span>
              </div>
              <div className="gr-storage-total-size">
                {fmtSize(totalSize)} <span className="gr-storage-total-limit">/ {planLabel}</span>
              </div>
              <div className="gr-storage-bar">
                <div className="gr-storage-fill" style={{ width: `${pct}%`, background: pct >= 90 ? '#F04452' : 'var(--gr-acc)' }}/>
              </div>
              <div className="gr-storage-pct">{pct.toFixed(1)}% 사용</div>
            </div>

            {/* 요금제 정보 */}
            <div className="gr-storage-info">
              <div className="gr-storage-info-title">현재 요금제</div>
              <div className="gr-storage-info-row">
                <span>요금제</span>
                <span style={{fontWeight:600}}>{isPaid ? `${planLabel} 구독 중` : '무료 (1 GB)'}</span>
              </div>
              <div className="gr-storage-info-row">
                <span>사용 가능</span>
                <span>{fmtSize(Math.max(0, storageLimit - totalSize))} 남음</span>
              </div>
              {!isPaid && (
                <button className="gr-storage-pay-btn" style={{marginTop:12,width:'100%'}} onClick={()=>setShowUpgrade(true)}>
                  용량 업그레이드
                </button>
              )}
              {isPaid && (
                <div className="gr-storage-info-row" style={{marginTop:8}}>
                  <span style={{fontSize:11,color:'var(--gr-t3)'}}>정기결제 중 · 해지는 설정에서 가능</span>
                </div>
              )}
            </div>

            {/* 캘린더별 용량 */}
            <div className="gr-pg-label" style={{ marginTop: 20 }}>캘린더별 사용량</div>
            {storageData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--gr-t3)', fontSize: 14 }}>방장인 캘린더가 없습니다</div>
            ) : (
              storageData.sort((a, b) => b.size - a.size).map(r => {
                const roomPct = storageLimit > 0 ? (r.size / storageLimit) * 100 : 0;
                return (
                  <div key={r.roomId} className="gr-storage-room">
                    <div className="gr-storage-room-info">
                      <div className="gr-storage-room-name">{r.roomName}</div>
                      <div className="gr-storage-room-meta">{r.fileCount}개 파일 · {fmtSize(r.size)}</div>
                    </div>
                    <div className="gr-storage-room-bar">
                      <div className="gr-storage-room-fill" style={{ width: `${Math.min(roomPct, 100)}%` }}/>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
      {showUpgrade && <StorageLimitModal onClose={()=>setShowUpgrade(false)} usedSize={totalSize} storageLimit={storageLimit} userId={userId}/>}
    </div>
  );
}
