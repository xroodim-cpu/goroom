import { useState, useEffect } from 'react';
import I from '../../components/shared/Icon';
import { listFolderSize } from '../../wasabi';
import { fmtSize } from '../../lib/helpers';

const FREE_LIMIT = 1024 * 1024 * 1024; // 1GB
const PRICE_PER_GB = 1000; // ₩1,000/GB/월

export default function StoragePage({ goBack, rooms, userId }) {
  const ownerRooms = rooms.filter(r => r.members.find(m => m.id === userId && m.role === 'owner'));
  const [storageData, setStorageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState(0);

  useEffect(() => {
    (async () => {
      const results = [];
      for (const room of ownerRooms) {
        const info = await listFolderSize(`calendar/${room.id}/`);
        results.push({ roomId: room.id, roomName: room.name, size: info.size, fileCount: info.fileCount });
      }
      // 유저 프로필 폴더도 포함
      const userInfo = await listFolderSize(`user/${userId}/`);
      if (userInfo.size > 0) {
        results.push({ roomId: '_profile', roomName: '프로필 이미지', size: userInfo.size, fileCount: userInfo.fileCount });
      }
      setStorageData(results);
      setTotalSize(results.reduce((s, r) => s + r.size, 0));
      setLoading(false);
    })();
  }, []);

  const pct = Math.min((totalSize / FREE_LIMIT) * 100, 100);
  const overSize = Math.max(0, totalSize - FREE_LIMIT);
  const overGB = overSize / (1024 * 1024 * 1024);
  const monthlyCost = overSize > 0 ? Math.ceil(overGB) * PRICE_PER_GB : 0;

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
              <div className="gr-storage-total-size">{fmtSize(totalSize)} <span className="gr-storage-total-limit">/ 1 GB</span></div>
              <div className="gr-storage-bar">
                <div className="gr-storage-fill" style={{ width: `${pct}%`, background: pct >= 90 ? '#F04452' : 'var(--gr-acc)' }}/>
              </div>
              <div className="gr-storage-pct">{pct.toFixed(1)}% 사용</div>
            </div>

            {/* 요금 안내 */}
            <div className="gr-storage-info">
              <div className="gr-storage-info-title">요금 안내</div>
              <div className="gr-storage-info-row"><span>기본 제공</span><span>1 GB 무료</span></div>
              <div className="gr-storage-info-row"><span>초과 요금</span><span>1 GB당 월 ₩{PRICE_PER_GB.toLocaleString()}</span></div>
              {monthlyCost > 0 && (
                <div className="gr-storage-info-cost">
                  <span>이번 달 예상 요금</span>
                  <span className="gr-storage-cost-val">₩{monthlyCost.toLocaleString()}/월</span>
                </div>
              )}
            </div>

            {/* 캘린더별 용량 */}
            <div className="gr-pg-label" style={{ marginTop: 20 }}>캘린더별 사용량</div>
            {storageData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--gr-t3)', fontSize: 14 }}>방장인 캘린더가 없습니다</div>
            ) : (
              storageData.sort((a, b) => b.size - a.size).map(r => {
                const roomPct = FREE_LIMIT > 0 ? (r.size / FREE_LIMIT) * 100 : 0;
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
    </div>
  );
}
