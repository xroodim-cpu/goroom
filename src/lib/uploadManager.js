/**
 * 백그라운드 업로드 매니저
 * - 스케줄/일기 등록 즉시 저장 후 이미지/동영상을 백그라운드에서 업로드
 * - 각 파일별 업로드 상태(progress %) 추적
 * - 업로드 실패 시 IndexedDB 큐에 저장 → 네트워크 복구 시 자동 재시도
 * - 로컬 파일 캐시로 미리보기 항상 유지
 */

import {
  addToUploadQueue, getUploadQueue, removeUploadItem, updateUploadItem,
  cacheFile, getCachedFile, removeCachedFile,
} from './offlineStore';

// 전역 업로드 상태: { [itemId]: { images: [{status, progress, url}], done } }
const _state = {};
const _listeners = new Set();
let _retryTimer = null;
let _isProcessing = false;
// 재시도에 필요한 uploadFn/updateDbFn 참조
let _uploadFnRef = null;
let _updateDbFnRef = null;
let _setRoomsFnRef = null;

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
 * 초기화: 앱 시작 시 호출 — 네트워크 리스너 등록 + 대기 큐 처리
 */
export function initUploadManager(uploadFn, sbPatchFn, setRoomsFn) {
  _uploadFnRef = uploadFn;
  _updateDbFnRef = sbPatchFn;
  _setRoomsFnRef = setRoomsFn;

  // 네트워크 복구 시 대기 큐 자동 처리
  window.addEventListener('online', () => {
    console.log('[uploadManager] online detected, processing queue...');
    processUploadQueue();
  });

  // 앱 시작 시 대기 큐 체크
  if (navigator.onLine) {
    setTimeout(() => processUploadQueue(), 3000);
  }
}

/**
 * 백그라운드 업로드 시작
 * @param {string} itemId - 스케줄/일기 ID
 * @param {string} roomId - 방 ID
 * @param {Array} dataImages - [{index, file?, dataUrl?, existingUrl?}]
 * @param {Function} uploadFn - (path, blob, onProgress?) => Promise<url>
 * @param {Function} onAllDone - (itemId, imageUrls[]) => void
 * @param {Function} extFn - (dataUrl) => ext
 * @param {Function} blobFn - (dataUrl) => Promise<blob>
 */
export function startBackgroundUpload(itemId, roomId, dataImages, uploadFn, onAllDone, extFn, blobFn) {
  _state[itemId] = {
    images: dataImages.map((d) => ({ index: d.index, status: 'uploading', progress: 0, url: null })),
    done: false,
    finalUrls: null,
  };
  notify();

  // uploadFn 참조 저장 (재시도용)
  if (!_uploadFnRef) _uploadFnRef = uploadFn;

  (async () => {
    const results = [];
    for (let i = 0; i < dataImages.length; i++) {
      const { index, file, dataUrl, existingUrl } = dataImages[i];
      if (existingUrl) {
        _state[itemId].images[i] = { index, status: 'done', progress: 100, url: existingUrl };
        results.push({ index, url: existingUrl });
        notify();
        continue;
      }

      _state[itemId].images[i].progress = 10;
      notify();

      try {
        // File 객체가 있으면 직접 사용, 없으면 data URL → blob 변환
        let blob, ext;
        if (file) {
          blob = file;
          const typeMap = {'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp','video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm'};
          ext = typeMap[file.type] || file.type.split('/')[1] || 'jpg';
        } else if (dataUrl) {
          blob = await blobFn(dataUrl);
          ext = extFn(dataUrl);
        }

        _state[itemId].images[i].progress = 20;
        notify();

        if (blob) {
          // 로컬 캐시에 파일 저장 (미리보기 유지용)
          const cacheKey = `${itemId}_${index}`;
          try { await cacheFile(cacheKey, blob, blob.type || 'application/octet-stream'); } catch (e) { console.warn('file cache failed:', e); }

          const itemType = dataImages._itemType || 'sch';
          const path = `calendar/${roomId}/${itemType}/${itemId}/${index}_${Date.now()}.${ext}`;

          // 온라인이면 업로드 시도
          if (navigator.onLine) {
            const onProgress = (pct) => {
              _state[itemId].images[i].progress = 20 + Math.round(pct * 0.75);
              notify();
            };
            const url = await uploadFn(path, blob, onProgress);
            if (url) {
              _state[itemId].images[i] = { index, status: 'done', progress: 100, url };
              results.push({ index, url });
              // 캐시 정리
              try { await removeCachedFile(cacheKey); } catch {}
            } else {
              // 업로드 실패 → 큐에 저장
              await _enqueueFailedUpload(itemId, roomId, itemType, index, blob, ext, path);
              _state[itemId].images[i] = { index, status: 'queued', progress: 0, url: null };
              results.push({ index, url: null });
            }
          } else {
            // 오프라인 → 큐에 저장
            await _enqueueFailedUpload(itemId, roomId, itemType, index, blob, ext, path);
            _state[itemId].images[i] = { index, status: 'queued', progress: 0, url: null };
            results.push({ index, url: null });
          }
        } else {
          _state[itemId].images[i] = { index, status: 'error', progress: 0, url: null };
          results.push({ index, url: null });
        }
      } catch (e) {
        console.error('Background upload error:', e);
        // 실패 시 큐에 저장 시도
        if (file) {
          const typeMap = {'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp','video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm'};
          const ext = typeMap[file.type] || file.type.split('/')[1] || 'jpg';
          const itemType = dataImages._itemType || 'sch';
          const path = `calendar/${roomId}/${itemType}/${itemId}/${index}_${Date.now()}.${ext}`;
          try { await _enqueueFailedUpload(itemId, roomId, itemType, index, file, ext, path); } catch {}
        }
        _state[itemId].images[i] = { index, status: 'queued', progress: 0, url: null };
        results.push({ index, url: null });
      }
      notify();
    }

    const finalUrls = results.filter(r => r.url).map(r => r.url);
    _state[itemId].done = true;
    _state[itemId].finalUrls = finalUrls;
    notify();

    // 성공한 파일이 있으면 즉시 DB 업데이트
    if (onAllDone && finalUrls.length > 0) onAllDone(itemId, finalUrls);

    // 큐에 대기 중인 파일이 있으면 재시도 스케줄링
    const hasQueued = results.some(r => r.url === null && _state[itemId]?.images?.some(img => img.status === 'queued'));
    if (hasQueued) scheduleRetry();

    setTimeout(() => {
      delete _state[itemId];
      notify();
    }, 5000);
  })();
}

/** 실패한 업로드를 IndexedDB 큐에 저장 */
async function _enqueueFailedUpload(itemId, roomId, itemType, index, blob, ext, wasabiPath) {
  try {
    await addToUploadQueue({
      itemId,
      roomId,
      itemType, // 'sch' or 'diary'
      index,
      fileBlob: blob,
      fileName: `${index}_${Date.now()}.${ext}`,
      fileType: blob.type || 'application/octet-stream',
      wasabiPath,
    });
    console.log(`[uploadManager] Queued upload: ${itemId} index=${index}`);
  } catch (e) {
    console.error('[uploadManager] Failed to enqueue upload:', e);
  }
}

/** 재시도 스케줄링 (중복 방지) */
function scheduleRetry() {
  if (_retryTimer) return;
  _retryTimer = setTimeout(() => {
    _retryTimer = null;
    if (navigator.onLine) processUploadQueue();
    else scheduleRetry(); // 아직 오프라인이면 다시 대기
  }, 10000); // 10초 후 재시도
}

/**
 * 업로드 큐 처리 — 온라인일 때 대기 중인 파일 업로드
 */
export async function processUploadQueue() {
  if (_isProcessing || !navigator.onLine || !_uploadFnRef) return;
  _isProcessing = true;

  try {
    const queue = await getUploadQueue();
    if (!queue || queue.length === 0) { _isProcessing = false; return; }

    console.log(`[uploadManager] Processing ${queue.length} queued uploads...`);

    // itemId별로 그룹핑
    const groups = {};
    for (const item of queue) {
      if (!groups[item.itemId]) groups[item.itemId] = [];
      groups[item.itemId].push(item);
    }

    for (const [itemId, items] of Object.entries(groups)) {
      const uploadedUrls = [];
      const roomId = items[0].roomId;
      const itemType = items[0].itemType;

      for (const item of items) {
        if (item.retries >= 5) {
          // 5회 이상 실패 → 포기
          console.warn(`[uploadManager] Giving up on ${item.wasabiPath} after ${item.retries} retries`);
          await removeUploadItem(item.queueId);
          continue;
        }

        try {
          const url = await _uploadFnRef(item.wasabiPath, item.fileBlob);
          if (url) {
            uploadedUrls.push(url);
            await removeUploadItem(item.queueId);
            // 캐시 정리
            try { await removeCachedFile(`${item.itemId}_${item.index}`); } catch {}
            console.log(`[uploadManager] Queue upload success: ${item.wasabiPath}`);
          } else {
            item.retries++;
            item.status = 'retry';
            await updateUploadItem(item);
          }
        } catch (e) {
          console.error(`[uploadManager] Queue upload failed:`, e);
          item.retries++;
          item.status = 'retry';
          await updateUploadItem(item);
        }
      }

      // 업로드 성공한 파일이 있으면 DB 업데이트
      if (uploadedUrls.length > 0 && _updateDbFnRef) {
        try {
          // 기존 이미지 + 새 업로드 이미지 병합
          const table = itemType === 'diary' ? 'goroom_diaries' : 'goroom_schedules';
          // 현재 DB의 이미지 목록 가져오기
          const existing = await fetch(`https://dyotbojxtcqhcmrefofb.supabase.co/rest/v1/${table}?select=images&id=eq.${itemId}`, {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3Rib2p4dGNxaGNtcmVmb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU2NTIsImV4cCI6MjA5MDI5MTY1Mn0.dJp5-vqXoW_9s-Br2vyn8sx2fo2wDWpNWlr5tqgddqo',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3Rib2p4dGNxaGNtcmVmb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU2NTIsImV4cCI6MjA5MDI5MTY1Mn0.dJp5-vqXoW_9s-Br2vyn8sx2fo2wDWpNWlr5tqgddqo',
            },
          }).then(r => r.json());
          const currentImages = existing?.[0]?.images || [];
          const mergedImages = [...currentImages, ...uploadedUrls];
          await _updateDbFnRef(`/${table}?id=eq.${itemId}`, { images: mergedImages });

          // 로컬 상태 업데이트
          if (_setRoomsFnRef) {
            _setRoomsFnRef(prev => prev.map(r => {
              if (r.id !== roomId) return r;
              const listKey = itemType === 'diary' ? 'diaries' : 'schedules';
              return { ...r, [listKey]: (r[listKey] || []).map(d => d.id === itemId ? { ...d, images: mergedImages } : d) };
            }));
          }
          console.log(`[uploadManager] DB updated for ${itemId}: ${mergedImages.length} images`);
        } catch (e) {
          console.error('[uploadManager] DB update after queue processing failed:', e);
        }
      }
    }

    // 아직 남은 큐가 있으면 재시도 스케줄
    const remaining = await getUploadQueue();
    if (remaining && remaining.length > 0) {
      scheduleRetry();
    }
  } catch (e) {
    console.error('[uploadManager] processUploadQueue error:', e);
  }

  _isProcessing = false;
}

/**
 * 로컬 캐시에서 미리보기 URL 생성
 * blob URL이 만료됐을 때 IndexedDB 캐시에서 복원
 */
export async function getLocalPreviewUrl(itemId, index) {
  try {
    const cached = await getCachedFile(`${itemId}_${index}`);
    if (cached && cached.blob) {
      return URL.createObjectURL(cached.blob);
    }
  } catch {}
  return null;
}

/**
 * 대기 중인 업로드 수
 */
export async function pendingUploadCount() {
  try {
    const queue = await getUploadQueue();
    return queue?.length || 0;
  } catch { return 0; }
}
