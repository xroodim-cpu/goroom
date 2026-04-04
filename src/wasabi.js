import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const WASABI_REGION = 'ap-northeast-2';
const WASABI_ENDPOINT = 'https://s3.ap-northeast-2.wasabisys.com';
const WASABI_BUCKET = 'ai.roodim.com';
const WASABI_PREFIX = 'goroom'; // 기존 버킷 안에 goroom/ prefix로 분리

const WASABI_ACCESS_KEY = '6YC5G09CURU5Q55R0ZGZ';
const WASABI_SECRET_KEY = 'v2V77IXKNjlBCjIFceJ1Vp4X0t5SDLeVH6c3jYYB';

const s3 = new S3Client({
  region: WASABI_REGION,
  endpoint: WASABI_ENDPOINT,
  credentials: { accessKeyId: WASABI_ACCESS_KEY, secretAccessKey: WASABI_SECRET_KEY },
  forcePathStyle: true,
});

const BASE_URL = `${WASABI_ENDPOINT}/${WASABI_BUCKET}/${WASABI_PREFIX}`;
const prefixPath = (path) => `${WASABI_PREFIX}/${path}`;

/** 파일 업로드 → public URL 반환 */
export async function uploadToWasabi(path, file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    await s3.send(new PutObjectCommand({
      Bucket: WASABI_BUCKET,
      Key: prefixPath(path),
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type || 'image/jpeg',
    }));
    return getWasabiUrl(path);
  } catch (e) { console.error('uploadToWasabi error:', e); return null; }
}

/** 단일 파일 삭제 */
export async function deleteFromWasabi(path) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: WASABI_BUCKET, Key: prefixPath(path) }));
  } catch (e) { console.error('deleteFromWasabi error:', e); }
}

/** prefix 기반 폴더 전체 삭제 */
export async function deleteFolderFromWasabi(folder) {
  try {
    const list = await s3.send(new ListObjectsV2Command({ Bucket: WASABI_BUCKET, Prefix: prefixPath(folder) }));
    const objects = (list.Contents || []).map(o => ({ Key: o.Key }));
    if (objects.length === 0) return;
    await s3.send(new DeleteObjectsCommand({ Bucket: WASABI_BUCKET, Delete: { Objects: objects } }));
  } catch (e) { console.error('deleteFolderFromWasabi error:', e); }
}

/** prefix로 파일 목록 조회 */
export async function listFromWasabi(folder) {
  try {
    const list = await s3.send(new ListObjectsV2Command({ Bucket: WASABI_BUCKET, Prefix: prefixPath(folder) }));
    return (list.Contents || []).map(o => o.Key.replace(WASABI_PREFIX + '/', ''));
  } catch (e) { console.error('listFromWasabi error:', e); return []; }
}

/** 파일 이동 (Copy + Delete) — 휴지통용 */
export async function moveInWasabi(fromPath, toPath) {
  try {
    await s3.send(new CopyObjectCommand({
      Bucket: WASABI_BUCKET,
      CopySource: `${WASABI_BUCKET}/${prefixPath(fromPath)}`,
      Key: prefixPath(toPath),
    }));
    await s3.send(new DeleteObjectCommand({ Bucket: WASABI_BUCKET, Key: prefixPath(fromPath) }));
  } catch (e) { console.error('moveInWasabi error:', e); }
}

/** Public URL 생성 */
export function getWasabiUrl(path) {
  return `${BASE_URL}/${path}`;
}

/** URL에서 Wasabi path 추출 */
export function extractWasabiPath(url) {
  if (!url) return null;
  // Wasabi URL
  if (url.startsWith(BASE_URL)) return url.replace(BASE_URL + '/', '');
  // Supabase URL (기존 데이터 호환)
  const supaMatch = url.split('/storage/v1/object/public/goroom/');
  if (supaMatch.length === 2) return supaMatch[1];
  return null;
}

export { BASE_URL, WASABI_BUCKET };
