export const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,10);
export const shortId = () => Math.random().toString(36).slice(2, 10);
export const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const fmtTime = ts => { const d = new Date(ts); return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
export const DAYS = ['일','월','화','수','목','금','토'];
export const MO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
export const COLORS = ['#4A90D9','#F09819','#27AE60','#8E44AD','#E74C3C','#00B4D8','#E91E63','#009688','#795548','#607D8B'];

export const ALL_MENUS = [
  {id:'cal',icon:'cal',label:'캘린더'},
  {id:'map',icon:'map',label:'맵'},
  {id:'memo',icon:'edit',label:'메모'},
  {id:'todo',icon:'check',label:'할일'},
  {id:'diary',icon:'book',label:'피드'},
  {id:'budget',icon:'wallet',label:'가계부'},
  {id:'alarm',icon:'bell',label:'알림'},
];

export const DEF_SETTINGS = {
  schCats:[{id:'sc1',name:'업무',color:'#4A90D9'},{id:'sc2',name:'개인',color:'#F09819'},{id:'sc3',name:'건강',color:'#27AE60'},{id:'sc4',name:'공부',color:'#8E44AD'},{id:'sc5',name:'소셜',color:'#00B4D8'},{id:'sc6',name:'기타',color:'#95A5A6'}],
  expCats:[{id:'ec1',name:'식비'},{id:'ec2',name:'교통'},{id:'ec3',name:'쇼핑'},{id:'ec4',name:'의료'},{id:'ec5',name:'기타'}],
  incCats:[{id:'ic1',name:'급여'},{id:'ic2',name:'부수입'},{id:'ic3',name:'기타'}],
  paymentMethods:[{id:'pm1',name:'신용카드',type:'card'},{id:'pm2',name:'계좌이체',type:'account'},{id:'pm3',name:'현금',type:'cash'}],
};

export function getUserId() {
  let id = localStorage.getItem('goroom_user_id');
  if (!id) { id = uid(); localStorage.setItem('goroom_user_id', id); }
  return id;
}

export async function fileToBlob(dataUrlOrFile) {
  if (dataUrlOrFile instanceof File || dataUrlOrFile instanceof Blob) return dataUrlOrFile;
  if (typeof dataUrlOrFile === 'string' && dataUrlOrFile.startsWith('data:')) {
    const res = await fetch(dataUrlOrFile);
    return await res.blob();
  }
  return null;
}

// Role helpers
export const ROLE_LABELS = { owner: '방장', 'vice-owner': '부방장', member: '멤버' };
export const canEdit = (role) => role === 'owner' || role === 'vice-owner';
export const canManage = (role) => role === 'owner';

/** data URL에서 확장자 추출 */
export function extFromDataUrl(dataUrl) {
  const m = dataUrl.match(/^data:([^;]+)/);
  if (!m) return 'jpg';
  const mime = m[1];
  const map = {'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp','video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm'};
  return map[mime] || mime.split('/')[1] || 'jpg';
}

/** URL 또는 data URL이 비디오인지 판별 */
// blob: URL 중 비디오인 것을 추적하는 Set
const _videoBlobUrls = new Set();
export function markBlobAsVideo(blobUrl) { _videoBlobUrls.add(blobUrl); }
export function unmarkBlobUrl(blobUrl) { _videoBlobUrls.delete(blobUrl); }

export function isVideo(url) {
  if (!url) return false;
  if (_videoBlobUrls.has(url)) return true;
  return /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url) || (typeof url === 'string' && url.startsWith('data:video/'));
}

/** File 객체에서 확장자 추출 */
export function extFromFile(file) {
  if (!file || !file.type) return 'jpg';
  const map = {'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp','video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm'};
  return map[file.type] || file.type.split('/')[1] || 'jpg';
}

/** 바이트 용량을 읽기 좋은 문자열로 포맷 */
export function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
