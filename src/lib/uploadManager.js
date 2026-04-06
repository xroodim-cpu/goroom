/**
 * 백그라운드 업로드 매니저
 * - 스케줄 등록 즉시 저장 후 이미지/동영상을 백그라운드에서 업로드
 * - 각 파일별 업로드 상태(progress %) 추적
 * - 업로드 완료 시 DB 업데이트
 */

// 전역 업로드 상태: { [scheduleId]: { images: [{status, progress, url}], done } }
const _state = {};
const _listeners = new Set();

export function getUploadState(schId) {
  return _state[schId] || null;
}

function notify() {
  _listeners.forEach(fn => fn({ ..._state }));
}

export function onUploadStateChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

/**
 * 백그라운드 업로드 시작
 * @param {string} schId - 스케줄 ID
 * @param {string} roomId - 방 ID
 * @param {Array} dataImages - data URL 이미지 배열 [{index, dataUrl}]
 * @param {Function} uploadFn - (path, blob) => Promise<url>
 * @param {Function} onAllDone - (schId, imageUrls[]) => void  DB 업데이트 콜백
 * @param {Function} extFn - (dataUrl) => ext
 * @param {Function} blobFn - (dataUrl) => Promise<blob>
 */
export function startBackgroundUpload(schId, roomId, dataImages, uploadFn, onAllDone, extFn, blobFn) {
  // 초기 상태 설정
  _state[schId] = {
    images: dataImages.map((d) => ({ index: d.index, status: 'uploading', progress: 0, url: null })),
    done: false,
    finalUrls: null,
  };
  notify();

  // 각 파일을 순차적으로 업로드 (병렬도 가능하지만 순차가 안정적)
  (async () => {
    const results = [];
    for (let i = 0; i < dataImages.length; i++) {
      const { index, dataUrl, existingUrl } = dataImages[i];
      if (existingUrl) {
        // 이미 업로드된 URL
        _state[schId].images[i] = { index, status: 'done', progress: 100, url: existingUrl };
        results.push({ index, url: existingUrl });
        notify();
        continue;
      }

      // 업로드 시작 — 시뮬레이션 진행률
      _state[schId].images[i].progress = 10;
      notify();

      try {
        const blob = await blobFn(dataUrl);
        _state[schId].images[i].progress = 30;
        notify();

        if (blob) {
          const ext = extFn(dataUrl);
          const path = `calendar/${roomId}/sch/${schId}/${index}_${Date.now()}.${ext}`;

          _state[schId].images[i].progress = 50;
          notify();

          const url = await uploadFn(path, blob);

          if (url) {
            _state[schId].images[i] = { index, status: 'done', progress: 100, url };
            results.push({ index, url });
          } else {
            _state[schId].images[i] = { index, status: 'error', progress: 0, url: null };
            results.push({ index, url: null });
          }
        } else {
          _state[schId].images[i] = { index, status: 'error', progress: 0, url: null };
          results.push({ index, url: null });
        }
      } catch (e) {
        console.error('Background upload error:', e);
        _state[schId].images[i] = { index, status: 'error', progress: 0, url: null };
        results.push({ index, url: null });
      }
      notify();
    }

    // 모든 업로드 완료
    const finalUrls = results.filter(r => r.url).map(r => r.url);
    _state[schId].done = true;
    _state[schId].finalUrls = finalUrls;
    notify();

    // DB 업데이트 콜백
    if (onAllDone) onAllDone(schId, finalUrls);

    // 5초 후 상태 정리
    setTimeout(() => {
      delete _state[schId];
      notify();
    }, 5000);
  })();
}
