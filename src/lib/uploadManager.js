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
 * @param {Array} dataImages - [{index, file?, dataUrl?, existingUrl?}]
 * @param {Function} uploadFn - (path, blob) => Promise<url>
 * @param {Function} onAllDone - (schId, imageUrls[]) => void
 * @param {Function} extFn - (dataUrl) => ext
 * @param {Function} blobFn - (dataUrl) => Promise<blob>
 */
export function startBackgroundUpload(schId, roomId, dataImages, uploadFn, onAllDone, extFn, blobFn) {
  _state[schId] = {
    images: dataImages.map((d) => ({ index: d.index, status: 'uploading', progress: 0, url: null })),
    done: false,
    finalUrls: null,
  };
  notify();

  (async () => {
    const results = [];
    for (let i = 0; i < dataImages.length; i++) {
      const { index, file, dataUrl, existingUrl } = dataImages[i];
      if (existingUrl) {
        _state[schId].images[i] = { index, status: 'done', progress: 100, url: existingUrl };
        results.push({ index, url: existingUrl });
        notify();
        continue;
      }

      _state[schId].images[i].progress = 10;
      notify();

      try {
        // File 객체가 있으면 직접 사용 (메모리 효율적), 없으면 data URL → blob 변환
        let blob, ext;
        if (file) {
          blob = file;
          const typeMap = {'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp','video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm'};
          ext = typeMap[file.type] || file.type.split('/')[1] || 'jpg';
        } else if (dataUrl) {
          blob = await blobFn(dataUrl);
          ext = extFn(dataUrl);
        }

        _state[schId].images[i].progress = 20;
        notify();

        if (blob) {
          const path = `calendar/${roomId}/sch/${schId}/${index}_${Date.now()}.${ext}`;

          // 실제 업로드 진행률 콜백
          const onProgress = (pct) => {
            // 20~95% 범위에 매핑 (20% = 준비완료, 95% = 업로드완료 직전)
            _state[schId].images[i].progress = 20 + Math.round(pct * 0.75);
            notify();
          };
          const url = await uploadFn(path, blob, onProgress);
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

    const finalUrls = results.filter(r => r.url).map(r => r.url);
    _state[schId].done = true;
    _state[schId].finalUrls = finalUrls;
    notify();

    if (onAllDone) onAllDone(schId, finalUrls);

    setTimeout(() => {
      delete _state[schId];
      notify();
    }, 5000);
  })();
}
