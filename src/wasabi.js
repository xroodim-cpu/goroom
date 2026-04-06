import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const WASABI_REGION = 'ap-northeast-2';
const WASABI_ENDPOINT = 'https://s3.ap-northeast-2.wasabisys.com';
const WASABI_BUCKET = 'goroom';

const WASABI_ACCESS_KEY = '6YC5G09CURU5Q55R0ZGZ';
const WASABI_SECRET_KEY = 'v2V77IXKNjlBCjIFceJ1Vp4X0t5SDLeVH6c3jYYB';

const s3 = new S3Client({
  region: WASABI_REGION,
  endpoint: WASABI_ENDPOINT,
  credentials: { accessKeyId: WASABI_ACCESS_KEY, secretAccessKey: WASABI_SECRET_KEY },
  forcePathStyle: true,
});

const BASE_URL = `${WASABI_ENDPOINT}/${WASABI_BUCKET}`;

/** 다운로드용 Presigned URL 생성 (Content-Disposition: attachment → 브라우저가 바로 다운로드) */
export async function getDownloadUrl(fileUrl, filename) {
  try {
    const path = extractWasabiPath(fileUrl);
    if (!path) return fileUrl;
    const command = new GetObjectCommand({
      Bucket: WASABI_BUCKET,
      Key: path,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    });
    return await getSignedUrl(s3, command, { expiresIn: 300 });
  } catch (e) { console.error('getDownloadUrl error:', e); return fileUrl; }
}

/** 파일 업로드 → public URL 반환 (5MB 이상은 멀티파트 업로드 + 진행률) */
const MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5MB
export async function uploadToWasabi(path, file, onProgress) {
  try {
    const fileSize = file.size || 0;
    if (fileSize > MULTIPART_THRESHOLD) {
      // 멀티파트 업로드 — 파트 단위 진행률
      const partSize = 5 * 1024 * 1024;
      const totalParts = Math.ceil(fileSize / partSize);
      let completedParts = 0;
      const upload = new Upload({
        client: s3,
        params: {
          Bucket: WASABI_BUCKET,
          Key: path,
          Body: file,
          ContentType: file.type || 'application/octet-stream',
        },
        queueSize: 2,
        partSize,
      });
      upload.on('httpUploadProgress', (p) => {
        if (!onProgress) return;
        if (p.loaded && p.total) {
          onProgress(Math.round((p.loaded / p.total) * 100));
        } else {
          completedParts++;
          onProgress(Math.min(Math.round((completedParts / totalParts) * 95), 95));
        }
      });
      await upload.done();
    } else {
      // 소형 파일 — SDK + 시뮬레이션 진행률 (S3 SDK는 실시간 progress 미지원)
      const arrayBuffer = await file.arrayBuffer();
      if (onProgress) onProgress(10);
      const sendPromise = s3.send(new PutObjectCommand({
        Bucket: WASABI_BUCKET,
        Key: path,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type || 'image/jpeg',
      }));
      // 시뮬레이션: 10→90 사이를 0.3초 간격으로 올림 (실제 업로드 완료 시 즉시 100%)
      let simPct = 10;
      const simInterval = setInterval(() => {
        simPct = Math.min(simPct + Math.round(Math.random() * 12 + 5), 90);
        if (onProgress) onProgress(simPct);
      }, 300);
      await sendPromise;
      clearInterval(simInterval);
    }
    if (onProgress) onProgress(100);
    return getWasabiUrl(path);
  } catch (e) { console.error('uploadToWasabi error:', e); return null; }
}


/** 단일 파일 삭제 */
export async function deleteFromWasabi(path) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: WASABI_BUCKET, Key: path }));
  } catch (e) { console.error('deleteFromWasabi error:', e); }
}

/** prefix 기반 폴더 전체 삭제 */
export async function deleteFolderFromWasabi(folder) {
  try {
    const list = await s3.send(new ListObjectsV2Command({ Bucket: WASABI_BUCKET, Prefix: folder }));
    const objects = (list.Contents || []).map(o => ({ Key: o.Key }));
    if (objects.length === 0) return;
    await s3.send(new DeleteObjectsCommand({ Bucket: WASABI_BUCKET, Delete: { Objects: objects } }));
  } catch (e) { console.error('deleteFolderFromWasabi error:', e); }
}

/** prefix로 파일 목록 조회 */
export async function listFromWasabi(folder) {
  try {
    const list = await s3.send(new ListObjectsV2Command({ Bucket: WASABI_BUCKET, Prefix: folder }));
    return (list.Contents || []).map(o => o.Key);
  } catch (e) { console.error('listFromWasabi error:', e); return []; }
}

/** 파일 이동 (Copy + Delete) — 휴지통용 */
export async function moveInWasabi(fromPath, toPath) {
  try {
    await s3.send(new CopyObjectCommand({
      Bucket: WASABI_BUCKET,
      CopySource: `${WASABI_BUCKET}/${fromPath}`,
      Key: toPath,
    }));
    await s3.send(new DeleteObjectCommand({ Bucket: WASABI_BUCKET, Key: fromPath }));
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

/** prefix별 총 용량(bytes) + 파일수 조회 */
export async function listFolderSize(folder) {
  try {
    let totalSize = 0, fileCount = 0, continuationToken;
    do {
      const params = { Bucket: WASABI_BUCKET, Prefix: folder };
      if (continuationToken) params.ContinuationToken = continuationToken;
      const list = await s3.send(new ListObjectsV2Command(params));
      for (const obj of (list.Contents || [])) {
        totalSize += obj.Size || 0;
        fileCount++;
      }
      continuationToken = list.IsTruncated ? list.NextContinuationToken : null;
    } while (continuationToken);
    return { size: totalSize, fileCount };
  } catch (e) { console.error('listFolderSize error:', e); return { size: 0, fileCount: 0 }; }
}

export { BASE_URL, WASABI_BUCKET };
