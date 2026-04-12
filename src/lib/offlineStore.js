/**
 * 고룸 오프라인 저장소 — IndexedDB 래퍼
 *
 * 원칙:
 * - 온라인: 항상 서버 데이터 사용 (캐시 무시)
 * - 오프라인: IndexedDB 캐시로 폴백
 * - 캐시 저장 실패는 앱 동작에 영향 없음
 */

const DB_NAME = 'goroom_offline';
const DB_VERSION = 2;

const STORES = ['users', 'friends', 'rooms', 'schedules', 'memos', 'todos', 'diaries', 'sync_queue', 'upload_queue', 'file_cache', 'meta'];

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach(name => {
        if (!db.objectStoreNames.contains(name)) {
          if (name === 'sync_queue' || name === 'upload_queue') {
            db.createObjectStore(name, { keyPath: 'queueId', autoIncrement: true });
          } else if (name === 'meta') {
            db.createObjectStore(name);
          } else if (name === 'file_cache') {
            db.createObjectStore(name, { keyPath: 'cacheKey' });
          } else {
            const store = db.createObjectStore(name, { keyPath: 'id' });
            if (['schedules', 'memos', 'todos', 'diaries'].includes(name)) {
              store.createIndex('room_id', 'room_id', { unique: false });
            }
          }
        }
      });
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

async function tx(storeName, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(storeName, mode).objectStore(storeName);
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── 기본 CRUD ──

export async function putAll(storeName, items) {
  if (!items?.length) return;
  const db = await openDB();
  const txn = db.transaction(storeName, 'readwrite');
  const store = txn.objectStore(storeName);
  items.forEach(item => store.put(item));
  return new Promise((resolve, reject) => {
    txn.oncomplete = resolve;
    txn.onerror = () => reject(txn.error);
  });
}

export async function getAll(storeName) {
  const store = await tx(storeName);
  return promisify(store.getAll());
}

export async function getById(storeName, id) {
  const store = await tx(storeName);
  return promisify(store.get(id));
}

export async function putOne(storeName, item) {
  const store = await tx(storeName, 'readwrite');
  return promisify(store.put(item));
}

export async function deleteOne(storeName, id) {
  const store = await tx(storeName, 'readwrite');
  return promisify(store.delete(id));
}

export async function clearStore(storeName) {
  const store = await tx(storeName, 'readwrite');
  return promisify(store.clear());
}

// ── 메타 (key-value) ──

export async function getMeta(key) {
  const store = await tx('meta');
  return promisify(store.get(key));
}

export async function setMeta(key, value) {
  const store = await tx('meta', 'readwrite');
  return promisify(store.put(value, key));
}

// ── Sync Queue ──

export async function addToSyncQueue(item) {
  // item: { type: 'insert'|'update'|'delete', table: string, data: object, createdAt: number }
  const store = await tx('sync_queue', 'readwrite');
  return promisify(store.add({ ...item, createdAt: Date.now(), retries: 0 }));
}

export async function getSyncQueue() {
  return getAll('sync_queue');
}

export async function removeSyncItem(queueId) {
  const store = await tx('sync_queue', 'readwrite');
  return promisify(store.delete(queueId));
}

export async function updateSyncItem(item) {
  const store = await tx('sync_queue', 'readwrite');
  return promisify(store.put(item));
}

// ── 스냅샷 저장/로드 (loadData 연동) ──

/**
 * 서버 데이터 성공 로드 후 백그라운드로 IndexedDB에 스냅샷 저장
 * 실패해도 앱 동작에 영향 없음
 */
export async function cacheSnapshot({ me, friends, rooms }) {
  try {
    // users: 나 + 친구 유저 정보
    const userItems = [me];
    await clearStore('users');
    await putAll('users', userItems);

    // friends
    await clearStore('friends');
    await putAll('friends', friends);

    // rooms + 각 방의 schedules, memos, todos, diaries
    const allSchedules = [];
    const allMemos = [];
    const allTodos = [];
    const allDiaries = [];

    const roomItems = rooms.map(r => {
      const { schedules, memos, todos, diaries, ...roomData } = r;
      if (schedules) schedules.forEach(s => allSchedules.push({ ...s, room_id: r.id }));
      if (memos) memos.forEach(m => allMemos.push({ ...m, room_id: r.id }));
      if (todos) todos.forEach(t => allTodos.push({ ...t, room_id: r.id }));
      if (diaries) diaries.forEach(d => allDiaries.push({ ...d, room_id: r.id }));
      return roomData;
    });

    await clearStore('rooms');
    await putAll('rooms', roomItems);

    await clearStore('schedules');
    await putAll('schedules', allSchedules);

    await clearStore('memos');
    await putAll('memos', allMemos);

    await clearStore('todos');
    await putAll('todos', allTodos);

    await clearStore('diaries');
    await putAll('diaries', allDiaries);

    await setMeta('last_sync', Date.now());
    await setMeta('user_id', me.id);
  } catch (e) {
    console.warn('[offlineStore] cacheSnapshot failed:', e);
    // 실패해도 무시 — 앱 동작에 영향 없음
  }
}

/**
 * 오프라인일 때만 호출 — IndexedDB에서 캐시 데이터 로드
 * @returns {{ me, friends, rooms } | null} 캐시 데이터 없으면 null
 */
export async function loadCachedFallback() {
  try {
    const users = await getAll('users');
    const me = users?.[0];
    if (!me) return null;

    const friends = await getAll('friends');
    const roomItems = await getAll('rooms');
    const schedules = await getAll('schedules');
    const memos = await getAll('memos');
    const todos = await getAll('todos');
    const diaries = await getAll('diaries');

    // rooms에 schedules/memos/todos/diaries 재결합
    const rooms = roomItems.map(r => ({
      ...r,
      schedules: schedules.filter(s => s.room_id === r.id),
      memos: memos.filter(m => m.room_id === r.id),
      todos: todos.filter(t => t.room_id === r.id),
      diaries: diaries.filter(d => d.room_id === r.id),
    }));

    const lastSync = await getMeta('last_sync');

    return { me, friends, rooms, lastSync };
  } catch (e) {
    console.warn('[offlineStore] loadCachedFallback failed:', e);
    return null;
  }
}

// ── 업로드 큐 (파일 blob 포함 영속 저장) ──

/**
 * 업로드 큐에 파일 추가
 * @param {Object} item - { itemId, roomId, itemType:'schedule'|'diary', index, fileBlob, fileName, fileType, wasabiPath }
 */
export async function addToUploadQueue(item) {
  const store = await tx('upload_queue', 'readwrite');
  return promisify(store.add({ ...item, createdAt: Date.now(), retries: 0, status: 'pending' }));
}

export async function getUploadQueue() {
  return getAll('upload_queue');
}

export async function removeUploadItem(queueId) {
  const store = await tx('upload_queue', 'readwrite');
  return promisify(store.delete(queueId));
}

export async function updateUploadItem(item) {
  const store = await tx('upload_queue', 'readwrite');
  return promisify(store.put(item));
}

/**
 * 로컬 파일 캐시 저장 (미리보기용)
 * @param {string} cacheKey - 고유 키 (itemId + index)
 * @param {Blob} blob - 파일 blob
 * @param {string} type - MIME type
 */
export async function cacheFile(cacheKey, blob, type) {
  const store = await tx('file_cache', 'readwrite');
  return promisify(store.put({ cacheKey, blob, type, cachedAt: Date.now() }));
}

export async function getCachedFile(cacheKey) {
  const store = await tx('file_cache');
  return promisify(store.get(cacheKey));
}

export async function removeCachedFile(cacheKey) {
  const store = await tx('file_cache', 'readwrite');
  return promisify(store.delete(cacheKey));
}

// ── 유틸 ──

export function isOnline() {
  return navigator.onLine;
}

/**
 * sync_queue에 대기 중인 항목 수
 */
export async function pendingSyncCount() {
  try {
    const queue = await getSyncQueue();
    return queue?.length || 0;
  } catch { return 0; }
}
