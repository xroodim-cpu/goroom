import { listFolderSize } from '../wasabi';
import { sbGet } from '../supabase';

let _cachedUsage = null;
let _cacheTime = 0;
const CACHE_TTL = 60000; // 1분 캐시

/** 유저의 총 사용량 조회 (캐시 적용) */
export async function getUserStorageUsage(userId, rooms) {
  const now = Date.now();
  if (_cachedUsage !== null && now - _cacheTime < CACHE_TTL) return _cachedUsage;

  let total = 0;
  // 유저 프로필 폴더
  const userInfo = await listFolderSize(`user/${userId}/`);
  total += userInfo.size;

  // 방장인 방들의 파일 용량
  const ownerRooms = rooms.filter(r => r.members?.find(m => m.id === userId && m.role === 'owner'));
  for (const room of ownerRooms) {
    const info = await listFolderSize(`calendar/${room.id}/`);
    total += info.size;
  }

  _cachedUsage = total;
  _cacheTime = now;
  return total;
}

/** 캐시 초기화 (업로드/삭제 후 호출) */
export function invalidateStorageCache() {
  _cachedUsage = null;
  _cacheTime = 0;
}

/** 유저의 storage_limit 조회 */
export async function getUserStorageLimit(userId) {
  const arr = await sbGet(`/goroom_users?select=storage_limit&id=eq.${userId}`);
  return arr?.[0]?.storage_limit || 1073741824; // 기본 1GB
}
