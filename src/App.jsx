import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from './supabase';

const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,10);
const shortId = () => Math.random().toString(36).slice(2, 10);
const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtTime = ts => { const d = new Date(ts); return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
const DAYS = ['일','월','화','수','목','금','토'];
const MO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const COLORS = ['#4A90D9','#F09819','#27AE60','#8E44AD','#E74C3C','#00B4D8','#E91E63','#009688','#795548','#607D8B'];

const STORAGE_BUCKET = 'goroom';

/* ── Supabase Storage Helpers ── */
async function uploadFile(path, file) {
  try {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    return getPublicUrl(path);
  } catch (e) { console.error('uploadFile error:', e); return null; }
}

async function deleteFile(path) {
  try {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    if (error) throw error;
  } catch (e) { console.error('deleteFile error:', e); }
}

async function deleteFolder(folder) {
  try {
    const { data } = await supabase.storage.from(STORAGE_BUCKET).list(folder);
    if (data && data.length > 0) {
      const paths = data.map(f => `${folder}/${f.name}`);
      await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    }
  } catch (e) { console.error('deleteFolder error:', e); }
}

function getPublicUrl(path) {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data?.publicUrl || '';
}

async function fileToBlob(dataUrlOrFile) {
  if (dataUrlOrFile instanceof File || dataUrlOrFile instanceof Blob) return dataUrlOrFile;
  if (typeof dataUrlOrFile === 'string' && dataUrlOrFile.startsWith('data:')) {
    const res = await fetch(dataUrlOrFile);
    return await res.blob();
  }
  return null;
}

/* ── */
function useBreakpoint() {
  const calc = () => window.innerWidth <= 480 ? 'mobile' : window.innerWidth <= 1024 ? 'tablet' : 'desktop';
  const [bp, setBp] = useState(calc);
  useEffect(() => { const h = () => setBp(calc()); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return bp;
}

const I = ({n, size=20, color}) => {
  const s = {width:size, height:size, display:'inline-block', verticalAlign:'middle'};
  const p = {stroke:color||'currentColor', strokeWidth:2, fill:'none', strokeLinecap:'round', strokeLinejoin:'round'};
  const icons = {
    search:<svg style={s} viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    userPlus:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    user:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    users:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    plus:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    back:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    left:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="15 18 9 12 15 6"/></svg>,
    right:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="9 6 15 12 9 18"/></svg>,
    cal:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    edit:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    check:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    wallet:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
    bell:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    book:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
    pin:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z"/></svg>,
    map:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    lock:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    gear:<svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    link:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    trash:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
    more:<svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></svg>,
    msg:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    clock:<svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    star:<svg style={s} viewBox="0 0 24 24" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    starFill:<svg style={s} viewBox="0 0 24 24" stroke={color||'currentColor'} strokeWidth="2" fill={color||'currentColor'} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    image:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    pen:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
    camera:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    list:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    grid:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    copy:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
    logout:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    mail:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    info:<svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  };
  return icons[n] || null;
};

function Avatar({name,size=44,color,src}){
  if(src) return <div style={{width:size,height:size,borderRadius:size*.32,overflow:'hidden',flexShrink:0}}><img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>;
  const cs=['#4A90D9','#F09819','#27AE60','#8E44AD','#E74C3C','#00B4D8','#E91E63','#009688'];
  const bg=color||cs[Math.abs(name?.charCodeAt(0)||0)%cs.length];
  return <div style={{width:size,height:size,borderRadius:size*.32,background:bg,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:size*.4,fontWeight:700,flexShrink:0}}>{name?.charAt(0)||'?'}</div>;
}
function Toggle({on,toggle}){ return <button className={`gr-tsw ${on?'on':'off'}`} onClick={e=>{e.stopPropagation();toggle();}}/>; }

const ALL_MENUS=[{id:'cal',icon:'cal',label:'캘린더'},{id:'map',icon:'map',label:'맵'},{id:'memo',icon:'edit',label:'메모'},{id:'todo',icon:'check',label:'할일'},{id:'diary',icon:'book',label:'피드'},{id:'budget',icon:'wallet',label:'가계부'},{id:'alarm',icon:'bell',label:'알림'}];
const DEF_SETTINGS = {
  schCats:[{id:'sc1',name:'업무',color:'#4A90D9'},{id:'sc2',name:'개인',color:'#F09819'},{id:'sc3',name:'건강',color:'#27AE60'},{id:'sc4',name:'공부',color:'#8E44AD'},{id:'sc5',name:'소셜',color:'#00B4D8'},{id:'sc6',name:'기타',color:'#95A5A6'}],
  expCats:[{id:'ec1',name:'식비'},{id:'ec2',name:'교통'},{id:'ec3',name:'쇼핑'},{id:'ec4',name:'의료'},{id:'ec5',name:'기타'}],
  incCats:[{id:'ic1',name:'급여'},{id:'ic2',name:'부수입'},{id:'ic3',name:'기타'}],
  paymentMethods:[{id:'pm1',name:'신용카드',type:'card'},{id:'pm2',name:'계좌이체',type:'account'},{id:'pm3',name:'현금',type:'cash'}],
};

/* ── Get or create user ID ── */
function getUserId() {
  let id = localStorage.getItem('goroom_user_id');
  if (!id) { id = uid(); localStorage.setItem('goroom_user_id', id); }
  return id;
}

/* ── LOGIN PAGE ── */
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) return setError('이메일과 비밀번호를 입력하세요');
    setLoading(true); setError('');
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      const user = { id: data.user.id, email: data.user.email, nickname: data.user.user_metadata?.name || email.split('@')[0] };
      localStorage.setItem('goroom_user_id', user.id);
      onLogin(user);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !nickname) return setError('모든 항목을 입력하세요');
    if (password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다');
    setLoading(true); setError('');
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { name: nickname } } });
      if (err) throw err;
      if (data.session) {
        const user = { id: data.user.id, email: data.user.email, nickname };
        localStorage.setItem('goroom_user_id', user.id);
        onLogin(user);
      } else {
        setError('가입 완료! 이메일 인증 후 로그인해주세요.');
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true); setError('');
    try {
      const opts = { redirectTo: window.location.origin };
      // 카카오: account_email 권한이 없으므로 scope를 직접 오버라이드
      if (provider === 'kakao') {
        opts.scopes = 'profile_nickname profile_image';
        opts.queryParams = { scope: 'profile_nickname profile_image' };
      }
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: opts,
      });
      if (err) throw err;
    } catch (e) { setError(e.message); setLoading(false); }
  };

  const handlePinLogin = () => {
    setError('PIN 로그인은 이메일 가입 후 설정에서 등록할 수 있습니다.');
  };

  if (mode === 'main') return (
    <div className="gr-login-wrap">
      <div className="gr-login-card">
        <div className="gr-login-logo">
          <div className="gr-login-logo-icon">구</div>
          <div className="gr-login-logo-text">구<span>롬</span></div>
          <div className="gr-login-subtitle">스케줄 · 가계부 · 메모</div>
        </div>
        <div className="gr-login-buttons">
          <button className="gr-login-btn gr-login-btn-email" onClick={() => setMode('email-login')}>
            <I n="mail" size={18}/> <span>이메일로 시작하기</span>
          </button>
          <button className="gr-login-btn gr-login-btn-google" onClick={() => handleSocialLogin('google')}>
            <svg style={{width:18,height:18}} viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span>구글로 시작하기</span>
          </button>
          <button className="gr-login-btn gr-login-btn-kakao" onClick={() => handleSocialLogin('kakao')}>
            <svg style={{width:18,height:18}} viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-1.18 4.36c-.1.36.32.64.64.43l5.08-3.35c.26.02.53.03.8.03 5.52 0 10-3.58 10-7.94S17.52 3 12 3z"/></svg>
            <span>카카오로 시작하기</span>
          </button>
          <div className="gr-login-divider"><span>또는</span></div>
          <button className="gr-login-btn gr-login-btn-pin" onClick={() => setMode('pin')}>
            <I n="pin" size={18}/> <span>PIN 코드로 로그인</span>
          </button>
        </div>
        <div className="gr-login-footer">
          아직 계정이 없나요? <button className="gr-login-link" onClick={() => setMode('email-signup')}>회원가입</button>
        </div>
      </div>
      <div className="gr-login-platform-badge">
        {window.innerWidth >= 768 ? '💻 데스크톱' : '📱 모바일'} · 모든 기기에서 동기화
      </div>
    </div>
  );

  if (mode === 'email-login') return (
    <div className="gr-login-wrap">
      <div className="gr-login-card">
        <button className="gr-login-back" onClick={() => { setMode('main'); setError(''); }}><I n="back" size={20}/></button>
        <div className="gr-login-logo" style={{marginBottom:24}}>
          <div className="gr-login-logo-text" style={{fontSize:24}}>이메일 로그인</div>
        </div>
        {error && <div className="gr-login-error">{error}</div>}
        <div className="gr-login-form">
          <div className="gr-login-field">
            <I n="mail" size={16} color="#999"/>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일 주소" autoFocus/>
          </div>
          <div className="gr-login-field">
            <I n="lock" size={16} color="#999"/>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호" onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}/>
          </div>
          <button className="gr-login-submit" onClick={handleEmailLogin} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>
        <div className="gr-login-footer">
          계정이 없나요? <button className="gr-login-link" onClick={() => { setMode('email-signup'); setError(''); }}>회원가입</button>
        </div>
      </div>
    </div>
  );

  if (mode === 'email-signup') return (
    <div className="gr-login-wrap">
      <div className="gr-login-card">
        <button className="gr-login-back" onClick={() => { setMode('main'); setError(''); }}><I n="back" size={20}/></button>
        <div className="gr-login-logo" style={{marginBottom:24}}>
          <div className="gr-login-logo-text" style={{fontSize:24}}>회원가입</div>
        </div>
        {error && <div className="gr-login-error">{error}</div>}
        <div className="gr-login-form">
          <div className="gr-login-field">
            <I n="user" size={16} color="#999"/>
            <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="닉네임" autoFocus/>
          </div>
          <div className="gr-login-field">
            <I n="mail" size={16} color="#999"/>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일 주소"/>
          </div>
          <div className="gr-login-field">
            <I n="lock" size={16} color="#999"/>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호 (6자 이상)" onKeyDown={e => e.key === 'Enter' && handleEmailSignup()}/>
          </div>
          <button className="gr-login-submit" onClick={handleEmailSignup} disabled={loading}>
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </div>
        <div className="gr-login-footer">
          이미 계정이 있나요? <button className="gr-login-link" onClick={() => { setMode('email-login'); setError(''); }}>로그인</button>
        </div>
      </div>
    </div>
  );

  if (mode === 'pin') return (
    <div className="gr-login-wrap">
      <div className="gr-login-card">
        <button className="gr-login-back" onClick={() => { setMode('main'); setError(''); setPin(''); }}><I n="back" size={20}/></button>
        <div className="gr-login-logo" style={{marginBottom:24}}>
          <div className="gr-login-logo-text" style={{fontSize:24}}>PIN 로그인</div>
          <div className="gr-login-subtitle">4~6자리 숫자를 입력하세요</div>
        </div>
        {error && <div className="gr-login-error">{error}</div>}
        <div className="gr-pin-dots">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className={`gr-pin-dot ${i < pin.length ? 'filled' : ''}`}/>
          ))}
        </div>
        <div className="gr-pin-pad">
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((v, i) => (
            <button key={i} className={`gr-pin-key ${v === '' ? 'empty' : ''}`}
              onClick={() => {
                if (v === '⌫') setPin(p => p.slice(0, -1));
                else if (typeof v === 'number' && pin.length < 6) setPin(p => p + String(v));
              }}>
              {v}
            </button>
          ))}
        </div>
        <button className="gr-login-submit" onClick={handlePinLogin} disabled={loading || pin.length < 4} style={{marginTop:16}}>
          {loading ? '확인 중...' : '확인'}
        </button>
      </div>
    </div>
  );

  return null;
}

/* ── AUTH WRAPPER ── */
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // 세션에서 유저 정보 추출 헬퍼
  const extractUser = (session) => {
    if (!session?.user) return null;
    const u = session.user;
    const meta = u.user_metadata || {};
    const nickname = meta.full_name || meta.name || meta.preferred_username || u.email?.split('@')[0] || '나';
    return { id: u.id, email: u.email, nickname, avatarUrl: meta.avatar_url || meta.picture || null };
  };

  useEffect(() => {
    let mounted = true;

    // 1) onAuthStateChange 먼저 등록 — INITIAL_SESSION 이벤트로 세션 확인
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'INITIAL_SESSION') {
        // 앱 로드 시 최초 세션 확인 (getSession 대체)
        const info = extractUser(session);
        if (info) {
          localStorage.setItem('goroom_user_id', info.id);
          setUser({ id: info.id, email: info.email, nickname: info.nickname });
        }
        setAuthChecked(true);
        // OAuth hash 정리
        if (window.location.hash.includes('access_token') || window.location.search.includes('error')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const info = extractUser(session);
        if (info) {
          localStorage.setItem('goroom_user_id', info.id);
          setUser({ id: info.id, email: info.email, nickname: info.nickname });

          // SIGNED_IN일 때만 goroom_users 자동 생성
          if (event === 'SIGNED_IN') {
            const { data: existing } = await supabase.from('goroom_users').select('id').eq('id', info.id).single();
            if (!existing) {
              const linkCode = 'goroom-' + Math.random().toString(36).slice(2, 10);
              await supabase.from('goroom_users').insert({
                id: info.id, nickname: info.nickname, status_msg: '', profile_img: info.avatarUrl,
                profile_bg: null, link_code: linkCode, birthday: '',
              });
            }
          }
        }
        setAuthChecked(true);
      }

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('goroom_user_id');
        setUser(null);
        setAuthChecked(true);
      }
    });

    // 2) 안전망: 3초 뒤에도 authChecked가 false면 만료된 토큰 정리 후 강제 진행
    const timeout = setTimeout(() => {
      if (mounted) setAuthChecked(prev => {
        if (!prev) {
          console.warn('Auth check timeout — clearing stale tokens');
          // 만료된/손상된 토큰이 hang의 원인이므로 정리
          const sbKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
          if (sbKey) localStorage.removeItem(sbKey);
          localStorage.removeItem('goroom_user_id');
          setUser(null);
          return true;
        }
        return prev;
      });
    }, 3000);

    return () => { mounted = false; clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  const handleLogin = (u) => setUser(u);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('goroom_user_id');
    setUser(null);
  };

  if (!authChecked) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
      <style>{CSS}</style>
      <div className="gr-loading-spinner"/>
    </div>
  );

  if (!user) return (
    <>
      <style>{CSS}</style>
      <LoginPage onLogin={handleLogin}/>
    </>
  );

  return <AppMain authUser={user} onLogout={handleLogout}/>;
}

function AppMain({ authUser, onLogout }){
  const bp = useBreakpoint();
  const isWide = bp === 'desktop' || bp === 'tablet';
  const [tab, setTab] = useState('friends');
  const [page, setPage] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = useMemo(() => getUserId(), []);

  const [me, setMe] = useState({id:userId,nickname:'나',statusMsg:'',linkCode:'',bio:'',profileImg:null,profileBg:null,birthday:''});
  const [friends, setFriends] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTab, setRoomTab] = useState('cal');
  const [subPage, setSubPage] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [editProfile, setEditProfile] = useState(false);
  const [schDetail, setSchDetail] = useState(null);

  /* ── Load data from Supabase on mount ── */
  useEffect(() => {
    // 데이터 로딩 타임아웃 (8초) — hang 방지
    const loadTimeout = setTimeout(() => { setLoading(prev => { if(prev){ console.warn('Data load timeout — forcing loading=false'); return false; } return prev; }); }, 8000);
    (async () => {
      try {
        // 1. Ensure user exists
        const { data: existingUser } = await supabase.from('goroom_users').select('*').eq('id', userId).single();
        if (existingUser) {
          setMe({
            id: existingUser.id,
            nickname: existingUser.nickname || '나',
            statusMsg: existingUser.status_msg || '',
            linkCode: existingUser.link_code || '',
            bio: '',
            profileImg: existingUser.profile_img || null,
            profileBg: existingUser.profile_bg || null,
            birthday: existingUser.birthday || '',
          });
        } else {
          const linkCode = 'goroom-' + shortId();
          const newUser = { id: userId, nickname: '나', status_msg: '', profile_img: null, profile_bg: null, link_code: linkCode, birthday: '' };
          await supabase.from('goroom_users').insert(newUser);
          setMe(prev => ({ ...prev, linkCode }));
        }

        // 2. Load friends
        const { data: friendRows } = await supabase.from('goroom_friends').select('*').eq('user_id', userId);
        if (friendRows && friendRows.length > 0) {
          const friendIds = friendRows.map(f => f.friend_id);
          const { data: friendUsers } = await supabase.from('goroom_users').select('*').in('id', friendIds);
          const friendMap = {};
          (friendUsers || []).forEach(u => { friendMap[u.id] = u; });
          setFriends(friendRows.map(fr => {
            const u = friendMap[fr.friend_id] || {};
            return {
              id: fr.friend_id,
              nickname: u.nickname || '?',
              statusMsg: u.status_msg || '',
              isPublic: true,
              birthday: u.birthday || '',
              favorite: fr.favorite || false,
              bio: '',
              profileImg: u.profile_img || null,
              profileBg: u.profile_bg || null,
              updatedAt: null,
              _friendRowId: fr.id,
            };
          }));
        }

        // 3. Load rooms
        const { data: memberRows } = await supabase.from('goroom_room_members').select('room_id, role').eq('user_id', userId);
        const roomIds = (memberRows || []).map(m => m.room_id);

        if (roomIds.length > 0) {
          const { data: roomRows } = await supabase.from('goroom_rooms').select('*').in('id', roomIds);
          const loadedRooms = [];
          for (const r of (roomRows || [])) {
            const { data: allMembers } = await supabase.from('goroom_room_members').select('user_id, role').eq('room_id', r.id);
            const { data: schedules } = await supabase.from('goroom_schedules').select('*').eq('room_id', r.id);
            const { data: memos } = await supabase.from('goroom_memos').select('*').eq('room_id', r.id);
            const { data: todos } = await supabase.from('goroom_todos').select('*').eq('room_id', r.id);
            const { data: diaries } = await supabase.from('goroom_diaries').select('*').eq('room_id', r.id);

            loadedRooms.push({
              id: r.id,
              name: r.name,
              desc: r.description || '',
              isPersonal: r.is_personal || false,
              isPublic: r.is_public !== false,
              thumbnailUrl: r.thumbnail_url || '',
              members: (allMembers || []).map(m => m.user_id),
              newCount: 0,
              nearestSchedule: null,
              menus: {cal:true,map:false,memo:true,todo:true,diary:true,budget:true,alarm:true,...(r.menus||{})},
              settings: { ...DEF_SETTINGS, ...(r.settings || {}) },
              schedules: (schedules || []).map(s => ({
                id: s.id, title: s.title, date: s.date, time: s.time || '', memo: s.memo || '',
                color: s.color || '#4A90D9', catId: s.cat_id || '', images: s.images || [],
                location: s.location || '', locationDetail: s.location_detail || '',
                createdAt: new Date(s.created_at || Date.now()).getTime(), createdBy: s.created_by,
                todos: s.todos || [], dday: s.dday || false,
                repeat: s.repeat || null, alarm: s.alarm || null,
                budget: s.budget || null,
              })),
              memos: (memos || []).map(m => ({
                id: m.id, title: m.title, content: m.content || '', pinned: m.pinned || false,
                createdAt: new Date(m.created_at || Date.now()).getTime(), createdBy: m.created_by,
              })),
              todos: (todos || []).map(t => ({
                id: t.id, text: t.text, done: t.done || false,
                createdAt: new Date(t.created_at || Date.now()).getTime(), createdBy: t.created_by,
                doneAt: t.done_at ? new Date(t.done_at).getTime() : null, doneBy: t.done_by || null,
              })),
              diaries: (diaries || []).map(d => ({
                id: d.id, title: d.content ? '' : '', content: d.content || '', mood: d.mood || '', weather: d.weather || '',
                images: d.images || [], likes: d.likes || [], comments: d.comments || [],
                date: fmt(new Date(d.created_at || Date.now())),
                createdAt: new Date(d.created_at || Date.now()).getTime(), createdBy: d.created_by,
              })),
            });
          }
          setRooms(loadedRooms);
        } else {
          // No rooms — create default personal room
          const roomId = uid();
          await supabase.from('goroom_rooms').insert({
            id: roomId, owner_id: userId, name: '내 캘린더', description: '개인 일정',
            is_personal: true, is_public: true,
            menus: {cal:true,memo:true,todo:true,diary:true,budget:true,alarm:true},
            settings: DEF_SETTINGS,
          });
          await supabase.from('goroom_room_members').insert({ room_id: roomId, user_id: userId, role: 'owner' });
          setRooms([{
            id: roomId, name: '내 캘린더', desc: '개인 일정', isPersonal: true, isPublic: true,
            members: [userId], newCount: 0, nearestSchedule: null,
            menus: {cal:true,memo:true,todo:true,diary:true,budget:true,alarm:true},
            settings: { ...DEF_SETTINGS }, schedules: [], memos: [], todos: [], diaries: [],
          }]);
        }
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        clearTimeout(loadTimeout);
        setLoading(false);
      }
    })();
    return () => clearTimeout(loadTimeout);
  }, [userId]);

  const openProfile = (id) => { setSelectedId(id); setPage(id===userId?'profile':'friend-profile'); };
  const openRoom = (id) => { setSelectedId(id); setRoomTab('cal'); setSubPage(null); setPage('room'); };
  const goBack = () => { if(subPage){ setSubPage(null); } else {
    // PC(와이드)에서는 탭 기본 페이지로 복귀, 모바일에서는 사이드바로
    if(isWide) {
      if(tab==='friends'){ setSelectedId(userId); setPage('profile'); }
      else if(tab==='rooms'){ const myRoom=rooms.find(r=>r.isPersonal); if(myRoom){setSelectedId(myRoom.id);setRoomTab('cal');setPage('room');} else {setPage(null);setSelectedId(null);} }
      else if(tab==='more'){ setPage('my-info'); setSelectedId(null); }
      else { setPage(null); setSelectedId(null); }
    } else { setPage(null); setSelectedId(null); }
    setSchDetail(null);
  }};

  // PC(와이드)에서만 초기 로드 시 탭 기본 페이지 설정
  useEffect(() => {
    if(!loading && !page && isWide) {
      if(tab==='friends'){ setSelectedId(userId); setPage('profile'); }
      else if(tab==='rooms'){ const myRoom=rooms.find(r=>r.isPersonal); if(myRoom){setSelectedId(myRoom.id);setRoomTab('cal');setPage('room');} }
      else if(tab==='more'){ setPage('my-info'); }
    }
  }, [loading, isWide]);

  const updateRoom = useCallback((rid, fn) => setRooms(p => p.map(r => r.id === rid ? fn(r) : r)), []);

  const toggleFav = async (fid) => {
    const f = friends.find(x => x.id === fid);
    if (!f) return;
    const newFav = !f.favorite;
    setFriends(p => p.map(x => x.id === fid ? { ...x, favorite: newFav } : x));
    try {
      await supabase.from('goroom_friends').update({ favorite: newFav }).eq('id', f._friendRowId);
    } catch (e) { console.error('toggleFav error:', e); }
  };

  const getName = useCallback((id) => {
    if (id === userId) return me.nickname || '나';
    const f = friends.find(x => x.id === id);
    return f?.nickname || '?';
  }, [userId, me.nickname, friends]);

  /* ── Profile save ── */
  const saveProfile = async (updatedMe) => {
    try {
      let profileImgUrl = updatedMe.profileImg;
      let profileBgUrl = updatedMe.profileBg;

      // Upload profile image if it's base64
      if (updatedMe.profileImg && updatedMe.profileImg.startsWith('data:')) {
        // Delete old profile images
        try {
          const { data: oldFiles } = await supabase.storage.from(STORAGE_BUCKET).list(`user/${userId}`, { search: 'profile_' });
          if (oldFiles && oldFiles.length > 0) {
            await supabase.storage.from(STORAGE_BUCKET).remove(oldFiles.map(f => `user/${userId}/${f.name}`));
          }
        } catch(e) {}
        const blob = await fileToBlob(updatedMe.profileImg);
        if (blob) {
          const path = `user/${userId}/profile_${Date.now()}.jpg`;
          profileImgUrl = await uploadFile(path, blob);
        }
      }

      // Upload background image if it's base64
      if (updatedMe.profileBg && updatedMe.profileBg.startsWith('data:')) {
        try {
          const { data: oldFiles } = await supabase.storage.from(STORAGE_BUCKET).list(`user/${userId}`, { search: 'bg_' });
          if (oldFiles && oldFiles.length > 0) {
            await supabase.storage.from(STORAGE_BUCKET).remove(oldFiles.map(f => `user/${userId}/${f.name}`));
          }
        } catch(e) {}
        const blob = await fileToBlob(updatedMe.profileBg);
        if (blob) {
          const path = `user/${userId}/bg_${Date.now()}.jpg`;
          profileBgUrl = await uploadFile(path, blob);
        }
      }

      await supabase.from('goroom_users').update({
        nickname: updatedMe.nickname,
        status_msg: updatedMe.statusMsg,
        profile_img: profileImgUrl,
        profile_bg: profileBgUrl,
        birthday: updatedMe.birthday,
      }).eq('id', userId);

      setMe(prev => ({ ...prev, ...updatedMe, profileImg: profileImgUrl, profileBg: profileBgUrl }));
    } catch (e) {
      console.error('saveProfile error:', e);
    }
  };

  /* ── Room CRUD helpers (Supabase-backed) ── */
  const saveSchedule = async (roomId, sch) => {
    // Upload images
    const imageUrls = [];
    for (let i = 0; i < (sch.images || []).length; i++) {
      const img = sch.images[i];
      if (img && img.startsWith('data:')) {
        const blob = await fileToBlob(img);
        if (blob) {
          const path = `calendar/${roomId}/sch_${sch.id}_${i}_${Date.now()}.jpg`;
          const url = await uploadFile(path, blob);
          if (url) imageUrls.push(url);
        }
      } else if (img) {
        imageUrls.push(img);
      }
    }

    const row = {
      id: sch.id, room_id: roomId, created_by: userId,
      title: sch.title, color: sch.color, date: sch.date, time: sch.time || null,
      cat_id: sch.catId || null, memo: sch.memo || null,
      location: sch.location || null, location_detail: sch.locationDetail || null,
      dday: sch.dday || false, repeat: sch.repeat || null,
      alarm: sch.alarm || null, budget: sch.budget || null,
      todos: sch.todos || [], images: imageUrls,
    };
    try {
      await supabase.from('goroom_schedules').insert(row);
    } catch (e) { console.error('saveSchedule error:', e); }

    return { ...sch, images: imageUrls };
  };

  const deleteSchedule = async (roomId, schId, images) => {
    try {
      // Delete images from storage
      if (images && images.length > 0) {
        for (const imgUrl of images) {
          const path = imgUrl.split('/storage/v1/object/public/goroom/')[1];
          if (path) await deleteFile(path);
        }
      }
      await supabase.from('goroom_schedules').delete().eq('id', schId);
    } catch (e) { console.error('deleteSchedule error:', e); }
  };

  const saveMemo = async (roomId, memo) => {
    try {
      await supabase.from('goroom_memos').insert({
        id: memo.id, room_id: roomId, created_by: userId,
        title: memo.title, content: memo.content, pinned: memo.pinned || false,
      });
    } catch (e) { console.error('saveMemo error:', e); }
  };

  const deleteMemo = async (memoId) => {
    try { await supabase.from('goroom_memos').delete().eq('id', memoId); } catch (e) { console.error(e); }
  };

  const updateMemoPin = async (memoId, pinned) => {
    try { await supabase.from('goroom_memos').update({ pinned }).eq('id', memoId); } catch (e) { console.error(e); }
  };

  const saveTodo = async (roomId, todo) => {
    try {
      await supabase.from('goroom_todos').insert({
        id: todo.id, room_id: roomId, created_by: userId,
        text: todo.text, done: false,
      });
    } catch (e) { console.error('saveTodo error:', e); }
  };

  const deleteTodo = async (todoId) => {
    try { await supabase.from('goroom_todos').delete().eq('id', todoId); } catch (e) { console.error(e); }
  };

  const updateTodoDone = async (todoId, done) => {
    try {
      await supabase.from('goroom_todos').update({
        done, done_by: done ? userId : null, done_at: done ? new Date().toISOString() : null,
      }).eq('id', todoId);
    } catch (e) { console.error(e); }
  };

  const saveDiary = async (roomId, diary) => {
    const imageUrls = [];
    for (let i = 0; i < (diary.images || []).length; i++) {
      const img = diary.images[i];
      if (img && img.startsWith('data:')) {
        const blob = await fileToBlob(img);
        if (blob) {
          const path = `calendar/${roomId}/diary_${diary.id}_${i}_${Date.now()}.jpg`;
          const url = await uploadFile(path, blob);
          if (url) imageUrls.push(url);
        }
      } else if (img) {
        imageUrls.push(img);
      }
    }
    try {
      await supabase.from('goroom_diaries').insert({
        id: diary.id, room_id: roomId, created_by: userId,
        content: diary.content || '', mood: diary.mood || null, weather: diary.weather || null,
        images: imageUrls, likes: [], comments: [],
      });
    } catch (e) { console.error('saveDiary error:', e); }
    return { ...diary, images: imageUrls };
  };

  const deleteDiary = async (diaryId, images) => {
    try {
      if (images && images.length > 0) {
        for (const imgUrl of images) {
          const path = imgUrl.split('/storage/v1/object/public/goroom/')[1];
          if (path) await deleteFile(path);
        }
      }
      await supabase.from('goroom_diaries').delete().eq('id', diaryId);
    } catch (e) { console.error(e); }
  };

  const updateDiaryLikes = async (diaryId, likes) => {
    try { await supabase.from('goroom_diaries').update({ likes }).eq('id', diaryId); } catch (e) { console.error(e); }
  };

  const updateDiaryComments = async (diaryId, comments) => {
    try { await supabase.from('goroom_diaries').update({ comments }).eq('id', diaryId); } catch (e) { console.error(e); }
  };

  const updateRoomInDb = async (roomId, updates) => {
    try { await supabase.from('goroom_rooms').update(updates).eq('id', roomId); } catch (e) { console.error(e); }
  };

  const createRoom = async (roomData) => {
    const roomId = uid();
    try {
      let thumbnailUrl = '';
      if (roomData.thumbnailFile) {
        const blob = await fileToBlob(roomData.thumbnailFile);
        if (blob) {
          const path = `calendar/${roomId}/thumbnail_${Date.now()}.jpg`;
          thumbnailUrl = await uploadFile(path, blob) || '';
        }
      }
      await supabase.from('goroom_rooms').insert({
        id: roomId, owner_id: userId, name: roomData.name, description: roomData.desc || '',
        is_personal: false, is_public: roomData.isPublic,
        menus: roomData.menus,
        settings: DEF_SETTINGS,
        thumbnail_url: thumbnailUrl || null,
      });
      // Add owner
      await supabase.from('goroom_room_members').insert({ room_id: roomId, user_id: userId, role: 'owner' });
      // Add other members
      for (const memberId of (roomData.members || [])) {
        if (memberId !== userId) {
          await supabase.from('goroom_room_members').insert({ room_id: roomId, user_id: memberId, role: 'member' });
        }
      }
    } catch (e) { console.error('createRoom error:', e); }
    return roomId;
  };

  const deleteRoom = async (roomId) => {
    try {
      await supabase.from('goroom_schedules').delete().eq('room_id', roomId);
      await supabase.from('goroom_memos').delete().eq('room_id', roomId);
      await supabase.from('goroom_todos').delete().eq('room_id', roomId);
      await supabase.from('goroom_diaries').delete().eq('room_id', roomId);
      await supabase.from('goroom_room_members').delete().eq('room_id', roomId);
      await supabase.from('goroom_rooms').delete().eq('id', roomId);
      await deleteFolder(`calendar/${roomId}`);
    } catch (e) { console.error('deleteRoom error:', e); }
  };

  const addFriendByCode = async (code) => {
    try {
      const { data: friendUser } = await supabase.from('goroom_users').select('*').eq('link_code', code).single();
      if (!friendUser) { alert('코드에 해당하는 사용자를 찾을 수 없습니다.'); return; }
      if (friendUser.id === userId) { alert('자기 자신을 추가할 수 없습니다.'); return; }
      // Check if already friends
      const existing = friends.find(f => f.id === friendUser.id);
      if (existing) { alert('이미 친구입니다.'); return; }
      const { data: inserted } = await supabase.from('goroom_friends').insert({
        user_id: userId, friend_id: friendUser.id, favorite: false,
      }).select().single();
      setFriends(prev => [...prev, {
        id: friendUser.id, nickname: friendUser.nickname || '?', statusMsg: friendUser.status_msg || '',
        isPublic: true, birthday: friendUser.birthday || '', favorite: false, bio: '',
        profileImg: friendUser.profile_img || null, profileBg: friendUser.profile_bg || null,
        updatedAt: null, _friendRowId: inserted?.id,
      }]);
      alert('친구가 추가되었습니다!');
    } catch (e) { console.error('addFriend error:', e); alert('친구 추가 실패'); }
  };

  if (loading) {
    return <div className="gr-root"><style>{CSS}</style><div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="gr-loading-spinner"/></div></div>;
  }

  const renderDetail = () => {
    const sb = !isWide;

    /* 스케줄 상세 */
    if(page==='sch-detail' && schDetail){
      const s = schDetail;
      const room = rooms.find(r => r.schedules.some(sc => sc.id === s.id));
      const st = room?.settings || DEF_SETTINGS;
      const pmName = s.budget?.pmId ? (st.paymentMethods || DEF_SETTINGS.paymentMethods).find(p=>p.id===s.budget.pmId)?.name || '' : '';
      return <div className="gr-panel">
        <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">스케줄 상세</div><div style={{display:'flex',gap:4}}>{room && <button className="gr-icon-btn" onClick={async ()=>{
          await deleteSchedule(room.id, s.id, s.images);
          updateRoom(room.id, r=>({...r,schedules:r.schedules.filter(sc=>sc.id!==s.id)}));
          goBack();
        }}><I n="trash" size={18} color="var(--gr-exp)"/></button>}</div></div>
        <div className="gr-pg-body">
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}><div style={{width:6,height:32,borderRadius:3,background:s.color||'var(--gr-acc)'}}/><div><div style={{fontSize:18,fontWeight:700}}>{s.title}</div><div style={{fontSize:13,color:'var(--gr-t3)'}}>{s.date} {s.time||''}</div></div></div>
          {s.location&&<div className="gr-det-section"><div className="gr-det-label">📍 장소</div><div style={{fontSize:14,color:'var(--gr-t2)'}}>{s.location}</div>{s.locationDetail&&s.locationDetail!==s.location&&<div style={{fontSize:12,color:'var(--gr-t3)',marginTop:2}}>{s.locationDetail}</div>}</div>}
          {s.memo&&<div className="gr-det-section"><div className="gr-det-label">메모</div><div style={{fontSize:14,color:'var(--gr-t2)',whiteSpace:'pre-wrap'}}>{s.memo}</div></div>}
          {s.todos?.length>0&&<div className="gr-det-section"><div className="gr-det-label">할 일 ({s.todos.filter(t=>t.done).length}/{s.todos.length})</div>{s.todos.map(t=><div key={t.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}><div style={{width:18,height:18,borderRadius:'50%',border:'2px solid '+(t.done?'var(--gr-acc)':'var(--gr-brd)'),background:t.done?'var(--gr-acc)':'none',display:'flex',alignItems:'center',justifyContent:'center'}}>{t.done&&<I n="check" size={10} color="#fff"/>}</div><span style={{fontSize:14,textDecoration:t.done?'line-through':'none',color:t.done?'var(--gr-t3)':'var(--gr-text)'}}>{t.text}</span></div>)}</div>}
          {s.dday&&<div className="gr-det-section"><div className="gr-det-label">D-day</div><div style={{fontSize:24,fontWeight:800,color:'var(--gr-acc)'}}>D-{Math.max(0,Math.ceil((new Date(s.date)-new Date())/864e5))}</div></div>}
          {s.repeat&&<div className="gr-det-section"><div className="gr-det-label">반복</div><div style={{fontSize:14}}>{{daily:'매일',weekly:'매주',monthly:'매월',yearly:'매년',custom:`${s.repeat.interval}일마다`}[s.repeat.type]}{s.repeat.endDate?` ~ ${s.repeat.endDate}`:' (계속)'}</div></div>}
          {s.alarm&&<div className="gr-det-section"><div className="gr-det-label">알람</div><div style={{fontSize:14}}>🔔 {{'10m':'10분 전','30m':'30분 전','1h':'1시간 전','1d':'하루 전'}[s.alarm.before]||s.alarm.before}{s.alarm.message?` — ${s.alarm.message}`:''}</div></div>}
          {s.budget&&<div className="gr-det-section"><div className="gr-det-label">가계부</div><div style={{fontSize:18,fontWeight:700,color:s.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}>{s.budget.type==='income'?'+':'-'}{s.budget.amount?.toLocaleString()}원</div>{s.budget.bCatName&&<div style={{fontSize:12,color:'var(--gr-t3)',marginTop:4}}>{s.budget.bCatName}</div>}{pmName&&<div style={{fontSize:12,color:'var(--gr-t3)',marginTop:2}}>결제: {pmName}</div>}</div>}
          {s.images && s.images.length > 0 && <div className="gr-det-section"><div className="gr-det-label">이미지</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{s.images.map((img,i)=><img key={i} src={img} alt="" style={{width:80,height:80,objectFit:'cover',borderRadius:8}}/>)}</div></div>}
        </div>
      </div>;
    }

    /* 내 프로필 — 인라인 편집 모드 */
    if(page==='profile'){
      const myRoom=rooms.find(r=>r.isPersonal);
      const handleImg=(e,key)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setMe(p=>({...p,[key]:ev.target.result}));r.readAsDataURL(f);};
      const handleDone = async () => {
        setEditProfile(false);
        await saveProfile(me);
      };
      return <div className="gr-panel">
        <div className="gr-profile-bg" style={{background:me.profileBg?`url(${me.profileBg}) center/cover`:'linear-gradient(135deg,#FEE500 0%,#F5D800 100%)'}}>
          {sb&&<button className="gr-icon-btn" onClick={goBack} style={{position:'absolute',top:12,left:12,color:'#fff',zIndex:3}}><I n="back" size={20}/></button>}
          <div className="gr-profile-top-bar">
            {editProfile && <label className="gr-profile-top-btn-s"><I n="camera" size={16} color="#333"/> 배경<input type="file" accept="image/*" onChange={e=>handleImg(e,'profileBg')} style={{display:'none'}}/></label>}
            {editProfile ? <button className="gr-profile-top-btn" onClick={handleDone}>완료</button> : <button className="gr-profile-top-btn" onClick={()=>setEditProfile(true)}>프로필 편집</button>}
          </div>
        </div>
        <div className="gr-profile-info">
          <div className="gr-profile-avatar-wrap">
            {me.profileImg?<img src={me.profileImg} className="gr-profile-avatar-img" alt=""/>:<Avatar name={me.nickname} size={80}/>}
            {editProfile && <label className="gr-profile-avatar-edit"><I n="camera" size={14} color="#fff"/><input type="file" accept="image/*" onChange={e=>handleImg(e,'profileImg')} style={{display:'none'}}/></label>}
          </div>
          {editProfile ? <div style={{width:'100%',maxWidth:260,marginTop:4}}>
            <div className="gr-profile-edit-row"><input className="gr-profile-inline-input name" value={me.nickname} onChange={e=>setMe(p=>({...p,nickname:e.target.value}))}/><I n="pen" size={14} color="var(--gr-t3)"/></div>
            <div className="gr-profile-edit-row"><input className="gr-profile-inline-input" value={me.statusMsg} onChange={e=>setMe(p=>({...p,statusMsg:e.target.value}))} placeholder="상태메시지"/><I n="pen" size={14} color="var(--gr-t3)"/></div>
          </div> : <div>
            <div className="gr-profile-name">{me.nickname}</div>
            <div className="gr-profile-status">{me.statusMsg}</div>
          </div>}
        </div>
        <div style={{padding:'0 20px'}}><div className="gr-divider-line" style={{margin:'12px 0'}}/><div style={{fontSize:13,fontWeight:600,color:'var(--gr-t2)',marginBottom:8}}>내 캘린더</div></div>
        <MiniCal schedules={myRoom?.schedules||[]} onSchClick={(s)=>{setSchDetail(s);setPage('sch-detail');}}/>
      </div>;
    }

    /* 친구 프로필 */
    if(page==='friend-profile'){
      const f=friends.find(x=>x.id===selectedId); if(!f) return null;
      return <div className="gr-panel">
        <div className="gr-profile-bg" style={{background:f.profileBg?`url(${f.profileBg}) center/cover`:'linear-gradient(135deg,#4A90D9 0%,#00B4D8 100%)'}}>
          {sb&&<button className="gr-icon-btn" onClick={goBack} style={{position:'absolute',top:12,left:12,color:'#fff'}}><I n="back" size={20}/></button>}
          <button className="gr-profile-fav-btn" onClick={()=>toggleFav(f.id)}>{f.favorite?<I n="starFill" size={22} color="#FEE500"/>:<I n="star" size={22} color="#fff"/>}</button>
        </div>
        <div className="gr-profile-info">
          <div className="gr-profile-avatar">{f.profileImg?<img src={f.profileImg} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} alt=""/>:<Avatar name={f.nickname} size={80}/>}</div>
          <div className="gr-profile-name">{f.nickname}</div>
          <div className="gr-profile-status">{f.statusMsg||'상태메시지 없음'}</div>
          {f.bio&&<div className="gr-profile-bio">{f.bio}</div>}
        </div>
        {f.isPublic?<MiniCal schedules={[]}/>:<div className="gr-lock"><I n="lock" size={40} color="var(--gr-t3)"/><div style={{fontSize:16,fontWeight:700,color:'var(--gr-t2)'}}>비공개</div><div style={{fontSize:13,color:'var(--gr-t3)'}}>캘린더를 공개하지 않았습니다</div></div>}
      </div>;
    }

    if(page==='my-info') return <MyInfoPage goBack={goBack} sb={sb} me={me} setMe={setMe} saveProfile={saveProfile} authUser={authUser}/>;
    if(page==='add-friend') return <AddFriendPage goBack={goBack} me={me} addFriendByCode={addFriendByCode} sb={sb}/>;
    if(page==='notification-settings') return <NotificationSettings goBack={goBack} sb={sb}/>;
    if(page==='app-settings') return <AppSettings goBack={goBack} sb={sb} userId={userId} onLogout={onLogout}/>;

    if(page==='room'){
      const room=rooms.find(r=>r.id===selectedId); if(!room) return null;
      return <CalRoom room={room} goBack={goBack} roomTab={roomTab} setRoomTab={setRoomTab} friends={friends} subPage={subPage} setSubPage={setSubPage} updateRoom={updateRoom} sb={sb} me={me} userId={userId} onSchClick={(s)=>{setSchDetail(s);setPage('sch-detail');}} saveSchedule={saveSchedule} saveMemo={saveMemo} deleteMemo={deleteMemo} updateMemoPin={updateMemoPin} saveTodo={saveTodo} deleteTodo={deleteTodo} updateTodoDone={updateTodoDone} saveDiary={saveDiary} deleteDiary={deleteDiary} updateDiaryLikes={updateDiaryLikes} updateDiaryComments={updateDiaryComments} updateRoomInDb={updateRoomInDb} deleteSchedule={deleteSchedule} deleteRoom={deleteRoom} getName={getName}/>;
    }
    if(page==='add-room') return <AddRoomPage goBack={goBack} setRooms={setRooms} sb={sb} friends={friends} createRoom={createRoom} userId={userId}/>;
    return null;
  };

  const renderSidebar = () => (
    <div className="gr-sidebar">
      {tab==='friends'&&<><div className="gr-tab-top"><div className="gr-tab-top-title">친구</div><div className="gr-tab-top-actions"><button className="gr-tab-top-btn" onClick={()=>setPage('add-friend')}><I n="userPlus" size={20}/></button><button className="gr-tab-top-btn" onClick={()=>setSearchQ(searchQ?'':'.')}><I n="search" size={20}/></button></div></div>
        {searchQ!==''&&<div style={{padding:'0 20px 8px'}}><input className="gr-input" value={searchQ==='.'?'':searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="친구 검색" autoFocus style={{padding:'8px 12px',fontSize:13}}/></div>}
        <div className="gr-tab-body">
          <div className="gr-friend-me" onClick={()=>openProfile(userId)}><Avatar name={me.nickname} size={52} src={me.profileImg}/><div className="gr-friend-info"><div className="gr-friend-name">{me.nickname}</div><div className="gr-friend-status">{me.statusMsg}</div></div></div>
          <div className="gr-divider-line"/>
          {(()=>{
            const today=`${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
            const q=searchQ&&searchQ!=='.'?searchQ.toLowerCase():'';
            const filtered=q?friends.filter(f=>f.nickname.toLowerCase().includes(q)):friends;
            const birthdayF=filtered.filter(f=>f.birthday===today);
            const updatedF=filtered.filter(f=>f.updatedAt&&(Date.now()-f.updatedAt)<86400000*7);
            const favF=filtered.filter(f=>f.favorite);
            return <div>
              {birthdayF.length>0&&<div><div className="gr-section-label">🎂 생일인 친구 {birthdayF.length}</div>{birthdayF.map(f=> <div key={f.id} className={`gr-friend-row ${selectedId===f.id?'active':''}`} onClick={()=>openProfile(f.id)}><Avatar name={f.nickname} size={44} src={f.profileImg}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname} 🎂</div><div className="gr-friend-status">오늘 생일이에요!</div></div></div>)}</div>}
              {updatedF.length>0&&!q&&<div><div className="gr-section-label">업데이트한 친구 {updatedF.length}</div>{updatedF.map(f=> <div key={f.id} className={`gr-friend-row ${selectedId===f.id?'active':''}`} onClick={()=>openProfile(f.id)}><Avatar name={f.nickname} size={44} src={f.profileImg}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname}</div><div className="gr-friend-status">{f.statusMsg}</div></div></div>)}</div>}
              {favF.length>0&&<div><div className="gr-section-label">⭐ 즐겨찾는 친구 {favF.length}</div>{favF.map(f=> <div key={f.id} className={`gr-friend-row ${selectedId===f.id?'active':''}`} onClick={()=>openProfile(f.id)}><Avatar name={f.nickname} size={44} src={f.profileImg}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname} {!f.isPublic&&<I n="lock" size={11} color="var(--gr-t3)"/>}</div><div className="gr-friend-status">{f.statusMsg}</div></div></div>)}</div>}
              <div className="gr-section-label">친구 {filtered.length}</div>
              {filtered.map(f=> <div key={f.id} className={`gr-friend-row ${selectedId===f.id?'active':''}`} onClick={()=>openProfile(f.id)}><Avatar name={f.nickname} size={44} src={f.profileImg}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname} {f.favorite&&<I n="starFill" size={11} color="#FEE500"/>}{!f.isPublic&&<I n="lock" size={11} color="var(--gr-t3)"/>}</div><div className="gr-friend-status">{f.statusMsg}</div></div></div>)}
            </div>;
          })()}
        </div></>}
      {tab==='rooms'&&<><div className="gr-tab-top"><div className="gr-tab-top-title">캘린더</div><div className="gr-tab-top-actions"><button className="gr-tab-top-btn"><I n="search" size={20}/></button><button className="gr-tab-top-btn" onClick={()=>setPage('add-room')}><I n="plus" size={20}/></button></div></div><div className="gr-tab-body">{rooms.map(r=> <div key={r.id} className={`gr-room-row ${selectedId===r.id&&page==='room'?'active':''}`} onClick={()=>openRoom(r.id)}><Avatar name={r.name} size={52} color={r.isPersonal?'var(--gr-acc)':undefined} src={r.thumbnailUrl}/><div className="gr-room-info"><div className="gr-room-name">{r.name}{r.isPersonal&&<span className="gr-badge-my">MY</span>}{!r.isPublic&&<I n="lock" size={12} color="var(--gr-t3)"/>}</div><div className="gr-room-preview">{r.nearestSchedule||r.desc}</div></div><div className="gr-room-meta">{r.newCount>0&&<div className="gr-room-new">{r.newCount}</div>}<div className="gr-room-members"><I n="users" size={12} color="var(--gr-t3)"/> {r.members.length}</div></div></div>)}</div></>}
      {tab==='more'&&<><div className="gr-tab-top"><div className="gr-tab-top-title">더보기</div><div className="gr-tab-top-actions"/></div><div className="gr-tab-body" style={{padding:20}}>
        <div className="gr-more-item" onClick={()=>setPage('my-info')}><I n="info" size={20}/><span>내 정보</span></div>
        <div className="gr-more-item" onClick={()=>setPage('add-friend')}><I n="link" size={20}/><span>친구 추가 코드</span></div>
        <div className="gr-more-item" onClick={()=>setPage('notification-settings')}><I n="bell" size={20}/><span>알림 설정</span></div>
        <div className="gr-more-item" onClick={()=>setPage('app-settings')}><I n="gear" size={20}/><span>설정</span></div>
      </div></>}
      <div className="gr-btab"><button className={`gr-btab-btn ${tab==='friends'?'on':''}`} onClick={()=>{setTab('friends');if(isWide){openProfile(userId);}else{setPage(null);setSelectedId(null);}}}><I n="user" size={22}/><span>친구</span></button><button className={`gr-btab-btn ${tab==='rooms'?'on':''}`} onClick={()=>{setTab('rooms');if(isWide){const myRoom=rooms.find(r=>r.isPersonal);if(myRoom)openRoom(myRoom.id);}else{setPage(null);setSelectedId(null);}}}><I n="cal" size={22}/><span>캘린더</span></button><button className={`gr-btab-btn ${tab==='more'?'on':''}`} onClick={()=>{setTab('more');if(isWide){setPage('my-info');}else{setPage(null);setSelectedId(null);}}}><I n="more" size={22}/><span>더보기</span></button></div>
    </div>
  );

  const detail = renderDetail();
  if (isWide) return (<div className="gr-root"><style>{CSS}</style><div className="gr-layout-wide">{renderSidebar()}<div className="gr-main">{detail || <div className="gr-empty-main"><I n="cal" size={48} color="var(--gr-t3)"/><div style={{marginTop:12,fontSize:16,color:'var(--gr-t3)'}}>캘린더 또는 친구를 선택하세요</div></div>}</div></div></div>);
  return (<div className="gr-root"><style>{CSS}</style>{detail || renderSidebar()}</div>);
}

/* ── 더보기 > 친구 추가 코드 ── */
function AddFriendPage({goBack, me, addFriendByCode, sb}) {
  const [code, setCode] = useState('');
  const [adding, setAdding] = useState(false);
  const handleAdd = async () => {
    if (!code.trim()) return;
    setAdding(true);
    await addFriendByCode(code.trim());
    setAdding(false);
    setCode('');
  };
  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">친구 추가</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-pg-label">친구 추가 코드 입력</div>
      <input className="gr-input" value={code} onChange={e=>setCode(e.target.value)} placeholder="코드를 입력하세요" autoFocus onKeyDown={e=>e.key==='Enter'&&handleAdd()}/>
      <button className="gr-btn-primary" style={{marginTop:12}} onClick={handleAdd} disabled={adding}>{adding?'추가중...':'추가하기'}</button>
      <div className="gr-divider"><span>내 코드</span></div>
      <div className="gr-code-box"><span>{me.linkCode}</span><button className="gr-btn-copy" onClick={()=>{navigator.clipboard?.writeText(me.linkCode);alert('복사됨!');}}>복사</button></div>
    </div>
  </div>;
}

/* ── 더보기 > 알림 설정 ── */
function NotificationSettings({goBack, sb}) {
  const [scheduleNoti, setScheduleNoti] = useState(() => localStorage.getItem('gr_noti_schedule') !== 'false');
  const [friendNoti, setFriendNoti] = useState(() => localStorage.getItem('gr_noti_friend') !== 'false');
  const [feedNoti, setFeedNoti] = useState(() => localStorage.getItem('gr_noti_feed') !== 'false');

  const toggle = (key, val, setter) => {
    const newVal = !val;
    setter(newVal);
    localStorage.setItem(key, String(newVal));
  };

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">알림 설정</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-set-row"><span className="gr-set-label"><I n="cal" size={16}/> 스케줄 알림</span><Toggle on={scheduleNoti} toggle={()=>toggle('gr_noti_schedule',scheduleNoti,setScheduleNoti)}/></div>
      <div className="gr-set-row"><span className="gr-set-label"><I n="userPlus" size={16}/> 친구 요청 알림</span><Toggle on={friendNoti} toggle={()=>toggle('gr_noti_friend',friendNoti,setFriendNoti)}/></div>
      <div className="gr-set-row"><span className="gr-set-label"><I n="book" size={16}/> 피드 알림</span><Toggle on={feedNoti} toggle={()=>toggle('gr_noti_feed',feedNoti,setFeedNoti)}/></div>
    </div>
  </div>;
}

/* ── 더보기 > 내 정보 ── */
function MyInfoPage({goBack, sb, me, setMe, saveProfile, authUser}) {
  const [birthday, setBirthday] = useState(me.birthday || '');
  const [editBday, setEditBday] = useState(false);
  const [savingBday, setSavingBday] = useState(false);

  const [pwMode, setPwMode] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [snsMsg, setSnsMsg] = useState('');

  const saveBirthday = async () => {
    setSavingBday(true);
    const updated = { ...me, birthday };
    await saveProfile(updated);
    setSavingBday(false);
    setEditBday(false);
  };

  const changePassword = async () => {
    if (!newPw || !confirmPw) return setPwMsg('새 비밀번호를 입력하세요.');
    if (newPw.length < 6) return setPwMsg('비밀번호는 6자 이상이어야 합니다.');
    if (newPw !== confirmPw) return setPwMsg('새 비밀번호가 일치하지 않습니다.');
    setPwLoading(true); setPwMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwMsg('비밀번호가 변경되었습니다.');
      setCurPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => { setPwMsg(''); setPwMode(false); }, 1500);
    } catch (e) { setPwMsg(e.message); }
    setPwLoading(false);
  };

  const handleSnsLink = (provider) => {
    setSnsMsg(`${provider} 연동은 준비 중입니다.`);
    setTimeout(() => setSnsMsg(''), 2000);
  };

  const displayBday = birthday ? `${birthday.slice(5,7)}월 ${birthday.slice(8,10)}일` : '미설정';

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">내 정보</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">

      {/* 계정 정보 */}
      <div className="gr-pg-label">계정 정보</div>
      <div className="gr-myinfo-card">
        <div className="gr-myinfo-row">
          <span className="gr-myinfo-label"><I n="mail" size={14} color="var(--gr-t3)"/> 이메일</span>
          <span className="gr-myinfo-val">{authUser?.email || '없음'}</span>
        </div>
        <div className="gr-myinfo-row">
          <span className="gr-myinfo-label"><I n="user" size={14} color="var(--gr-t3)"/> 닉네임</span>
          <span className="gr-myinfo-val">{me.nickname}</span>
        </div>
        <div className="gr-myinfo-row">
          <span className="gr-myinfo-label"><I n="link" size={14} color="var(--gr-t3)"/> 친구 코드</span>
          <span className="gr-myinfo-val" style={{fontSize:12}}>{me.linkCode}</span>
        </div>
      </div>

      {/* 생일 */}
      <div className="gr-pg-label" style={{marginTop:20}}>생일</div>
      <div className="gr-myinfo-card">
        {editBday ? <div>
          <div style={{fontSize:12,color:'var(--gr-t3)',marginBottom:8}}>생일은 내 캘린더와 친구 목록에서 해당 날짜에 노출됩니다.</div>
          <input type="date" className="gr-input" value={birthday} onChange={e=>setBirthday(e.target.value)} style={{marginBottom:8}}/>
          <div style={{display:'flex',gap:6}}>
            <button className="gr-btn-sm" onClick={saveBirthday} disabled={savingBday}>{savingBday?'저장중...':'저장'}</button>
            <button className="gr-btn-sm-outline" onClick={()=>{setBirthday(me.birthday||'');setEditBday(false);}}>취소</button>
          </div>
        </div> : <div className="gr-myinfo-row" style={{cursor:'pointer'}} onClick={()=>setEditBday(true)}>
          <span className="gr-myinfo-label"><I n="cal" size={14} color="var(--gr-t3)"/> 생일</span>
          <span className="gr-myinfo-val">{displayBday} <I n="edit" size={12} color="var(--gr-t3)"/></span>
        </div>}
      </div>

      {/* 비밀번호 변경 */}
      <div className="gr-pg-label" style={{marginTop:20}}>보안</div>
      <div className="gr-myinfo-card">
        {pwMode ? <div>
          {pwMsg && <div className={`gr-login-error`} style={{marginBottom:8}}>{pwMsg}</div>}
          <div className="gr-login-field" style={{marginBottom:8}}>
            <I n="lock" size={14} color="#999"/>
            <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="새 비밀번호 (6자 이상)"/>
          </div>
          <div className="gr-login-field" style={{marginBottom:8}}>
            <I n="lock" size={14} color="#999"/>
            <input type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="새 비밀번호 확인" onKeyDown={e=>e.key==='Enter'&&changePassword()}/>
          </div>
          <div style={{display:'flex',gap:6}}>
            <button className="gr-btn-sm" onClick={changePassword} disabled={pwLoading}>{pwLoading?'변경중...':'변경'}</button>
            <button className="gr-btn-sm-outline" onClick={()=>{setPwMode(false);setPwMsg('');setNewPw('');setConfirmPw('');}}>취소</button>
          </div>
        </div> : <div className="gr-myinfo-row" style={{cursor:'pointer'}} onClick={()=>setPwMode(true)}>
          <span className="gr-myinfo-label"><I n="lock" size={14} color="var(--gr-t3)"/> 비밀번호 변경</span>
          <span className="gr-myinfo-val"><I n="right" size={14} color="var(--gr-t3)"/></span>
        </div>}
      </div>

      {/* SNS 연동 */}
      <div className="gr-pg-label" style={{marginTop:20}}>SNS 연동</div>
      {snsMsg && <div className="gr-login-error" style={{marginBottom:8}}>{snsMsg}</div>}
      <div className="gr-myinfo-card">
        <div className="gr-myinfo-row" style={{cursor:'pointer'}} onClick={()=>handleSnsLink('구글')}>
          <span className="gr-myinfo-label">
            <svg style={{width:14,height:14,verticalAlign:'middle'}} viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {' '}구글
          </span>
          <span className="gr-myinfo-val" style={{color:'var(--gr-t3)',fontSize:12}}>미연동 <I n="right" size={14} color="var(--gr-t3)"/></span>
        </div>
        <div className="gr-myinfo-row" style={{cursor:'pointer'}} onClick={()=>handleSnsLink('카카오')}>
          <span className="gr-myinfo-label">
            <svg style={{width:14,height:14,verticalAlign:'middle'}} viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-1.18 4.36c-.1.36.32.64.64.43l5.08-3.35c.26.02.53.03.8.03 5.52 0 10-3.58 10-7.94S17.52 3 12 3z"/></svg>
            {' '}카카오
          </span>
          <span className="gr-myinfo-val" style={{color:'var(--gr-t3)',fontSize:12}}>미연동 <I n="right" size={14} color="var(--gr-t3)"/></span>
        </div>
      </div>

    </div>
  </div>;
}

/* ── 더보기 > 설정 ── */
function AppSettings({goBack, sb, userId, onLogout}) {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleLogout = async () => {
    localStorage.removeItem('gr_noti_schedule');
    localStorage.removeItem('gr_noti_friend');
    localStorage.removeItem('gr_noti_feed');
    if (onLogout) { await onLogout(); }
    else { localStorage.removeItem('goroom_user_id'); window.location.reload(); }
  };

  const handleReset = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    try {
      // Delete all user data from Supabase
      const { data: memberRows } = await supabase.from('goroom_room_members').select('room_id').eq('user_id', userId);
      const roomIds = (memberRows || []).map(m => m.room_id);
      for (const rid of roomIds) {
        await supabase.from('goroom_schedules').delete().eq('room_id', rid);
        await supabase.from('goroom_memos').delete().eq('room_id', rid);
        await supabase.from('goroom_todos').delete().eq('room_id', rid);
        await supabase.from('goroom_diaries').delete().eq('room_id', rid);
        await supabase.from('goroom_room_members').delete().eq('room_id', rid);
        await supabase.from('goroom_rooms').delete().eq('id', rid);
        await deleteFolder(`calendar/${rid}`);
      }
      await supabase.from('goroom_friends').delete().eq('user_id', userId);
      await deleteFolder(`user/${userId}`);
      await supabase.from('goroom_users').delete().eq('id', userId);
      localStorage.removeItem('goroom_user_id');
      window.location.reload();
    } catch (e) {
      console.error('Reset error:', e);
      alert('초기화 실패');
    }
  };

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">설정</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-set-row"><span className="gr-set-label">테마</span><span className="gr-set-val">라이트 (준비중)</span></div>
      <div className="gr-set-row"><span className="gr-set-label">언어</span><span className="gr-set-val">한국어</span></div>
      <div className="gr-set-row"><span className="gr-set-label">앱 정보</span><span className="gr-set-val">GoRoom v2.0.0</span></div>
      <div style={{marginTop:24}}>
        <button className="gr-btn-primary" onClick={handleLogout} style={{background:'var(--gr-t2)',marginBottom:12}}>
          <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><I n="logout" size={16} color="#fff"/> 로그아웃</span>
        </button>
        <button className="gr-btn-danger" onClick={handleReset}>
          <I n="trash" size={16}/> {confirmReset ? '정말 초기화하시겠습니까? (다시 클릭)' : '데이터 초기화'}
        </button>
      </div>
    </div>
  </div>;
}

function MiniCal({schedules,onSchClick}){
  const [nav,setNav]=useState(new Date()); const [sel,setSel]=useState(new Date()); const today=useMemo(()=>new Date(),[]);
  const y=nav.getFullYear(),m=nav.getMonth(),fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),dip=new Date(y,m,0).getDate();
  const cells=[]; for(let i=0;i<fd;i++) cells.push({d:dip-fd+i+1,o:true,dt:new Date(y,m-1,dip-fd+i+1)}); for(let i=1;i<=dim;i++) cells.push({d:i,o:false,dt:new Date(y,m,i)}); const rem=7-cells.length%7; if(rem<7) for(let i=1;i<=rem;i++) cells.push({d:i,o:true,dt:new Date(y,m+1,i)});
  const mv=d=>{const n=new Date(nav);n.setMonth(n.getMonth()+d);setNav(n);}; const ts=fmt(today); const ss=fmt(sel);
  const dots=ds=>schedules.filter(s=>s.date===ds).slice(0,3);
  const selSchs=schedules.filter(s=>s.date===ss);
  return <div style={{flex:1,overflowY:'auto'}}>
    <div className="gr-cal-nav"><button className="gr-cal-nav-btn" onClick={()=>mv(-1)}><I n="left" size={18}/></button><h3>{y}년 {MO[m]}</h3><button className="gr-cal-nav-btn" onClick={()=>mv(1)}><I n="right" size={18}/></button></div>
    <div className="gr-cal-head">{DAYS.map(d=><span key={d}>{d}</span>)}</div>
    <div className="gr-cal-grid">{cells.map((c,i)=>{const ds=fmt(c.dt),dd=dots(ds); return <div key={i} className={`gr-cal-cell ${c.o?'ot':''} ${ds===ts?'tod':''} ${ds===ss&&ds!==ts?'sel':''}`} onClick={()=>setSel(c.dt)}><span className="gr-cal-d">{c.d}</span>{dd.length>0&&<div className="gr-cal-dots">{dd.map((sc,j)=><span key={j} style={{background:sc.color||'var(--gr-acc)'}}/>)}</div>}</div>;})}</div>
    <div className="gr-cal-sel-info"><div className="gr-cal-sel-date">{sel.getMonth()+1}월 {sel.getDate()}일 {DAYS[sel.getDay()]}요일</div>
      {selSchs.length===0?<div className="gr-cal-empty">스케줄이 없습니다</div>:selSchs.map(sc=> <SchCard key={sc.id} sc={sc} onClick={()=>onSchClick&&onSchClick(sc)}/>)}
    </div>
  </div>;
}

function RoomMap({schedules,sel}){
  const mapRef=useRef(null);
  const mapInstance=useRef(null);
  const ss=useMemo(()=>{
    const d=sel instanceof Date?sel.toISOString().slice(0,10):sel;
    return schedules.filter(s=>s.date===d&&s.location).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  },[schedules,sel]);

  useEffect(()=>{
    if(!mapRef.current||typeof window.kakao==='undefined') return;
    const kakao=window.kakao;
    if(!kakao.maps){return;}
    const init=()=>{
      const container=mapRef.current;
      if(!container) return;
      const map=new kakao.maps.Map(container,{center:new kakao.maps.LatLng(37.5665,126.978),level:5});
      mapInstance.current=map;
      if(ss.length===0) return;
      const geocoder=new kakao.maps.services.Geocoder();
      const places=new kakao.maps.services.Places();
      const bounds=new kakao.maps.LatLngBounds();
      const coords=[];
      let resolved=0;
      const MARKER_COLORS=['#4A90D9','#F09819','#27AE60','#8E44AD','#00B4D8','#E74C3C','#F5A928','#95A5A6'];
      ss.forEach((sc,idx)=>{
        const query=sc.locationDetail||sc.location;
        places.keywordSearch(query,(result,status)=>{
          resolved++;
          if(status===kakao.maps.services.Status.OK&&result.length>0){
            const pos=new kakao.maps.LatLng(result[0].y,result[0].x);
            coords[idx]=pos;
            bounds.extend(pos);
            const mColor=sc.color||MARKER_COLORS[idx%MARKER_COLORS.length];
            const markerContent=`<div style="display:flex;flex-direction:column;align-items:center;">
              <div style="background:${mColor};color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.2);border:2px solid #fff;">
                ${sc.time?'<span style="margin-right:4px;opacity:.85;">'+sc.time+'</span>':''}${sc.title}
              </div>
              <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${mColor};margin-top:-1px;"></div>
            </div>`;
            const overlay=new kakao.maps.CustomOverlay({position:pos,content:markerContent,yAnchor:1.3});
            overlay.setMap(map);
          }
          if(resolved===ss.length){
            // 연결선 그리기
            const validCoords=ss.map((_,i)=>coords[i]).filter(Boolean);
            if(validCoords.length>=2){
              const polyline=new kakao.maps.Polyline({path:validCoords,strokeWeight:3,strokeColor:'#F5A928',strokeOpacity:0.8,strokeStyle:'shortdash'});
              polyline.setMap(map);
              // 순서 표시 화살표 마커
              for(let i=0;i<validCoords.length-1;i++){
                const mid=new kakao.maps.LatLng(
                  (validCoords[i].getLat()+validCoords[i+1].getLat())/2,
                  (validCoords[i].getLng()+validCoords[i+1].getLng())/2
                );
                const arrow=new kakao.maps.CustomOverlay({position:mid,content:`<div style="background:#F5A928;color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.3);border:2px solid #fff;">${i+1}</div>`,yAnchor:0.5});
                arrow.setMap(map);
              }
            }
            if(validCoords.length>0){map.setBounds(bounds,80,80,80,80);}
          }
        },{size:1});
      });
    };
    if(kakao.maps.load) kakao.maps.load(init);
    else init();
  },[ss]);

  const dateStr=sel instanceof Date?sel.toISOString().slice(0,10):sel;
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
    <div ref={mapRef} style={{flex:1,minHeight:300,borderRadius:12,overflow:'hidden',border:'1px solid var(--gr-border)'}}/>
    {ss.length===0&&<div style={{padding:16,textAlign:'center',color:'var(--gr-t3)',fontSize:13}}>
      {dateStr} 에 장소가 등록된 스케줄이 없습니다
    </div>}
    {ss.length>0&&<div style={{padding:'12px 0',overflowY:'auto',maxHeight:200}}>
      <div style={{fontSize:12,color:'var(--gr-t3)',marginBottom:8,fontWeight:600}}>📍 {dateStr} 동선 ({ss.length}곳)</div>
      {ss.map((sc,i)=><div key={sc.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',fontSize:13}}>
        <div style={{width:22,height:22,borderRadius:'50%',background:sc.color||'#4A90D9',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:600}}>{sc.time&&<span style={{color:'var(--gr-t3)',marginRight:4}}>{sc.time}</span>}{sc.title}</div>
          <div style={{fontSize:12,color:'var(--gr-t3)'}}>{sc.location}</div>
        </div>
      </div>)}
    </div>}
  </div>;
}

function CalRoom({room,goBack,roomTab,setRoomTab,friends,subPage,setSubPage,updateRoom,sb,me,userId,onSchClick,saveSchedule,saveMemo,deleteMemo,updateMemoPin,saveTodo,deleteTodo,updateTodoDone,saveDiary,deleteDiary,updateDiaryLikes,updateDiaryComments,updateRoomInDb,deleteSchedule,deleteRoom,getName}){
  const [sel,setSel]=useState(new Date()); const [nav,setNav]=useState(new Date()); const today=useMemo(()=>new Date(),[]);
  const activeMenus=ALL_MENUS.filter(m=>room.menus[m.id]);
  const memberList=room.members.map(id=>id===userId?{id:userId,nickname:'나'}:friends.find(f=>f.id===id)||{id,nickname:'?'});
  const isMulti = room.members.length > 1;

  if(subPage==='settings') return <RoomSettings room={room} updateRoom={updateRoom} friends={friends} memberList={memberList} sb={sb} goBack={()=>setSubPage(null)} setSubPage={setSubPage} updateRoomInDb={updateRoomInDb} deleteRoom={deleteRoom} userId={userId}/>;
  if(subPage==='invite') return <InviteMembers room={room} updateRoom={updateRoom} friends={friends} sb={sb} goBack={()=>setSubPage(null)} userId={userId}/>;
  if(subPage==='add-schedule') return <div className="gr-panel"><ScheduleForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} selDate={fmt(sel)} sb={sb} saveSchedule={saveSchedule} userId={userId}/></div>;
  if(subPage==='add-memo') return <div className="gr-panel"><MemoForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} sb={sb} saveMemoDb={saveMemo} userId={userId}/></div>;
  if(subPage==='add-todo') return <div className="gr-panel"><SimpleForm title="새 할일" fields={[{k:'title',l:'할 일'}]} goBack={()=>setSubPage(null)} onSave={async v=>{
    const todo = {id:uid(),text:v.title,done:false,createdAt:Date.now(),createdBy:userId,doneAt:null,doneBy:null};
    updateRoom(room.id,r=>({...r,todos:[...r.todos,todo]}));
    await saveTodo(room.id, todo);
    setSubPage(null);
  }} sb={sb}/></div>;
  if(subPage==='add-diary') return <div className="gr-panel"><DiaryForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} sb={sb} saveDiaryDb={saveDiary} userId={userId}/></div>;
  if(subPage==='add-budget') return <div className="gr-panel"><BudgetForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} sb={sb} saveSchedule={saveSchedule} userId={userId}/></div>;
  const fabMap={cal:'add-schedule',memo:'add-memo',todo:'add-todo',diary:'add-diary',budget:'add-budget'};
  return <div className="gr-panel"><div className="gr-room-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-room-top-info"><div className="gr-room-top-name">{room.name}</div><div className="gr-room-top-members">{memberList.length}명</div></div><button className="gr-icon-btn" onClick={()=>setSubPage('settings')}><I n="gear" size={18}/></button></div><div className="gr-room-tabs">{activeMenus.map(m=> <button key={m.id} className={`gr-room-tab ${roomTab===m.id?'on':''}`} onClick={()=>setRoomTab(m.id)}><I n={m.icon} size={14}/> {m.label}</button>)}</div><div className="gr-room-body">{roomTab==='cal'&&<RoomCal nav={nav} setNav={setNav} sel={sel} setSel={setSel} today={today} schedules={room.schedules} onSchClick={onSchClick}/>}{roomTab==='memo'&&<RoomMemo memos={room.memos} room={room} updateRoom={updateRoom} deleteMemoDb={deleteMemo} updateMemoPinDb={updateMemoPin}/>}{roomTab==='todo'&&<RoomTodo todos={room.todos} room={room} updateRoom={updateRoom} isMulti={isMulti} getName={getName} deleteTodoDb={deleteTodo} updateTodoDoneDb={updateTodoDone} userId={userId}/>}{roomTab==='diary'&&<RoomDiary diaries={room.diaries} schedules={room.schedules} isMulti={isMulti} getName={getName} room={room} updateRoom={updateRoom} onSchClick={onSchClick} updateDiaryLikes={updateDiaryLikes} updateDiaryComments={updateDiaryComments} userId={userId}/>}{roomTab==='map'&&<RoomMap schedules={room.schedules} sel={sel}/>}{roomTab==='budget'&&<RoomBudget schedules={room.schedules} room={room}/>}{roomTab==='alarm'&&<div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>🔔</div>알림이 없습니다</div>}</div>{fabMap[roomTab]&&<button className="gr-fab" onClick={()=>setSubPage(fabMap[roomTab])}><I n="plus" size={24} color="#191919"/></button>}</div>;
}

function RoomSettings({room,updateRoom,friends,memberList,sb,goBack,setSubPage,updateRoomInDb,deleteRoom,userId}){
  const [name,setName]=useState(room.name); const [desc,setDesc]=useState(room.desc); const [editing,setEditing]=useState(false);
  const [addCatName,setAddCatName]=useState(''); const [addCatColor,setAddCatColor]=useState('#4A90D9');
  const [addExpName,setAddExpName]=useState(''); const [addIncName,setAddIncName]=useState('');
  const [addPmName, setAddPmName] = useState(''); const [addPmType, setAddPmType] = useState('card');
  const [thumbPreview,setThumbPreview]=useState(room.thumbnailUrl||'');
  const [thumbUploading,setThumbUploading]=useState(false);
  const thumbRef=useRef(null);
  const st = room.settings || DEF_SETTINGS;
  const paymentMethods = st.paymentMethods || DEF_SETTINGS.paymentMethods;

  const handleThumbChange=async(e)=>{
    const f=e.target.files?.[0]; if(!f) return;
    setThumbUploading(true);
    try {
      const { data: oldFiles } = await supabase.storage.from(STORAGE_BUCKET).list(`calendar/${room.id}`, { search: 'thumbnail_' });
      if(oldFiles&&oldFiles.length>0) await supabase.storage.from(STORAGE_BUCKET).remove(oldFiles.map(x=>`calendar/${room.id}/${x.name}`));
      const path=`calendar/${room.id}/thumbnail_${Date.now()}.jpg`;
      const url=await uploadFile(path,f);
      if(url){setThumbPreview(url);updateRoom(room.id,r=>({...r,thumbnailUrl:url}));await updateRoomInDb(room.id,{thumbnail_url:url});}
    }catch(err){console.error(err);}
    setThumbUploading(false);
  };
  const handleThumbRemove=async()=>{
    setThumbUploading(true);
    try{
      const { data: oldFiles } = await supabase.storage.from(STORAGE_BUCKET).list(`calendar/${room.id}`, { search: 'thumbnail_' });
      if(oldFiles&&oldFiles.length>0) await supabase.storage.from(STORAGE_BUCKET).remove(oldFiles.map(x=>`calendar/${room.id}/${x.name}`));
      setThumbPreview('');updateRoom(room.id,r=>({...r,thumbnailUrl:''}));await updateRoomInDb(room.id,{thumbnail_url:null});
    }catch(err){console.error(err);}
    setThumbUploading(false);
  };

  const saveInfo=async ()=>{
    const newName = name.trim()||room.name;
    const newDesc = desc.trim();
    updateRoom(room.id,r=>({...r,name:newName,desc:newDesc}));
    await updateRoomInDb(room.id, { name: newName, description: newDesc });
    setEditing(false);
  };
  const updSettings=(fn)=>{
    const newSettings = fn(room.settings||DEF_SETTINGS);
    updateRoom(room.id,r=>({...r,settings:newSettings}));
    updateRoomInDb(room.id, { settings: newSettings });
  };
  const addSchCat=()=>{if(!addCatName.trim())return; updSettings(s=>({...s,schCats:[...s.schCats,{id:shortId(),name:addCatName.trim(),color:addCatColor}]})); setAddCatName('');};
  const delSchCat=(id)=>updSettings(s=>({...s,schCats:s.schCats.filter(c=>c.id!==id)}));
  const addExpCat=()=>{if(!addExpName.trim())return; updSettings(s=>({...s,expCats:[...s.expCats,{id:shortId(),name:addExpName.trim()}]})); setAddExpName('');};
  const delExpCat=(id)=>updSettings(s=>({...s,expCats:s.expCats.filter(c=>c.id!==id)}));
  const addIncCat=()=>{if(!addIncName.trim())return; updSettings(s=>({...s,incCats:[...s.incCats,{id:shortId(),name:addIncName.trim()}]})); setAddIncName('');};
  const delIncCat=(id)=>updSettings(s=>({...s,incCats:s.incCats.filter(c=>c.id!==id)}));
  const addPm=()=>{if(!addPmName.trim())return; updSettings(s=>({...s,paymentMethods:[...(s.paymentMethods||[]),{id:shortId(),name:addPmName.trim(),type:addPmType}]})); setAddPmName('');};
  const delPm=(id)=>updSettings(s=>({...s,paymentMethods:(s.paymentMethods||[]).filter(c=>c.id!==id)}));

  const handleTogglePublic = async () => {
    updateRoom(room.id,r=>({...r,isPublic:!r.isPublic}));
    await updateRoomInDb(room.id, { is_public: !room.isPublic });
  };
  const handleToggleMenu = async (menuId) => {
    const newMenus = {...room.menus,[menuId]:!room.menus[menuId]};
    updateRoom(room.id,r=>({...r,menus:newMenus}));
    await updateRoomInDb(room.id, { menus: newMenus });
  };
  const handleDeleteRoom = async () => {
    if(!window.confirm('이 캘린더를 삭제하시겠습니까?')) return;
    await deleteRoom(room.id);
    window.location.reload();
  };
  const handleRemoveMember = async (memberId) => {
    updateRoom(room.id,r=>({...r,members:r.members.filter(x=>x!==memberId)}));
    try {
      await supabase.from('goroom_room_members').delete().eq('room_id', room.id).eq('user_id', memberId);
    } catch(e) { console.error(e); }
  };

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">캘린더 설정</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-pg-label">썸네일 이미지</div>
      <div className="gr-thumb-upload" onClick={()=>!thumbUploading&&thumbRef.current?.click()}>{thumbPreview?<><img src={thumbPreview} alt="" className="gr-thumb-img"/><button className="gr-thumb-remove" onClick={e=>{e.stopPropagation();handleThumbRemove();}}><I n="x" size={14} color="#fff"/></button></>:<div className="gr-thumb-placeholder"><I n="image" size={28} color="var(--gr-t3)"/><span style={{fontSize:12,color:'var(--gr-t3)',marginTop:4}}>{thumbUploading?'업로드중...':'이미지 선택'}</span></div>}</div>
      <input ref={thumbRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleThumbChange}/>
      <div className="gr-pg-label">캘린더 정보 {!editing&&<button className="gr-icon-btn-sm" onClick={()=>setEditing(true)}><I n="edit" size={14}/></button>}</div>
      {editing ? <div>
        <input className="gr-input" value={name} onChange={e=>setName(e.target.value)} placeholder="이름" style={{marginBottom:8}}/>
        <input className="gr-input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="설명"/>
        <div style={{display:'flex',gap:6,marginTop:8}}><button className="gr-btn-sm" onClick={saveInfo}>저장</button><button className="gr-btn-sm-outline" onClick={()=>{setName(room.name);setDesc(room.desc);setEditing(false);}}>취소</button></div>
      </div> : <div>
        <div className="gr-set-row"><span className="gr-set-label">이름</span><span className="gr-set-val">{room.name}</span></div>
        <div className="gr-set-row"><span className="gr-set-label">설명</span><span className="gr-set-val">{room.desc||'-'}</span></div>
      </div>}
      <div className="gr-set-row"><span className="gr-set-label">공개</span><Toggle on={room.isPublic} toggle={handleTogglePublic}/></div>

      <div className="gr-pg-label" style={{marginTop:20}}>멤버 ({memberList.length}) <button className="gr-btn-invite" onClick={()=>setSubPage('invite')}><I n="userPlus" size={14} color="#191919"/> 초대</button></div>
      {memberList.map(m=> <div key={m.id} className="gr-set-member"><Avatar name={m.nickname} size={32}/><span>{m.nickname}</span>{m.id!==userId&&<button className="gr-icon-btn-sm" style={{marginLeft:'auto'}} onClick={()=>handleRemoveMember(m.id)}><I n="x" size={14} color="var(--gr-exp)"/></button>}</div>)}

      <div className="gr-pg-label" style={{marginTop:20}}>기능 ON/OFF</div>

      {ALL_MENUS.map(m=> <div key={m.id}>
        <div className="gr-set-row"><span className="gr-set-label"><I n={m.icon} size={16}/> {m.label}</span><Toggle on={room.menus[m.id]} toggle={()=>handleToggleMenu(m.id)}/></div>

        {m.id==='cal' && room.menus.cal && <div className="gr-setting-detail">
          <div className="gr-setting-detail-title">스케줄 카테고리</div>
          <div className="gr-tag-list">{st.schCats.map(c=> <div key={c.id} className="gr-tag-item">
            <span className="gr-tag-dot" style={{background:c.color}}/><span>{c.name}</span>
            <button className="gr-icon-btn-sm" onClick={()=>delSchCat(c.id)}><I n="x" size={12} color="var(--gr-t3)"/></button>
          </div>)}</div>
          <div className="gr-tag-add">
            <div className="gr-clr-row" style={{marginBottom:6}}>{COLORS.slice(0,8).map(c=> <button key={c} className={`gr-clr-b-sm ${addCatColor===c?'on':''}`} style={{background:c}} onClick={()=>setAddCatColor(c)}/>)}</div>
            <div style={{display:'flex',gap:6}}><input className="gr-input" value={addCatName} onChange={e=>setAddCatName(e.target.value)} placeholder="카테고리 이름" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addSchCat()}/><button className="gr-btn-sm" onClick={addSchCat}>추가</button></div>
          </div>
        </div>}

        {m.id==='budget' && room.menus.budget && <div className="gr-setting-detail">
          <div className="gr-setting-detail-title">지출 카테고리</div>
          <div className="gr-tag-list">{st.expCats.map(c=> <div key={c.id} className="gr-tag-item">
            <span>{c.name}</span>
            <button className="gr-icon-btn-sm" onClick={()=>delExpCat(c.id)}><I n="x" size={12} color="var(--gr-t3)"/></button>
          </div>)}</div>
          <div style={{display:'flex',gap:6,marginBottom:12}}><input className="gr-input" value={addExpName} onChange={e=>setAddExpName(e.target.value)} placeholder="지출 카테고리" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addExpCat()}/><button className="gr-btn-sm" onClick={addExpCat}>추가</button></div>

          <div className="gr-setting-detail-title">수입 카테고리</div>
          <div className="gr-tag-list">{st.incCats.map(c=> <div key={c.id} className="gr-tag-item">
            <span>{c.name}</span>
            <button className="gr-icon-btn-sm" onClick={()=>delIncCat(c.id)}><I n="x" size={12} color="var(--gr-t3)"/></button>
          </div>)}</div>
          <div style={{display:'flex',gap:6,marginBottom:12}}><input className="gr-input" value={addIncName} onChange={e=>setAddIncName(e.target.value)} placeholder="수입 카테고리" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addIncCat()}/><button className="gr-btn-sm" onClick={addIncCat}>추가</button></div>

          <div className="gr-setting-detail-title">결제수단 관리</div>
          <div className="gr-tag-list">{paymentMethods.map(pm=> <div key={pm.id} className="gr-tag-item">
            <span>{pm.name}</span>
            <button className="gr-icon-btn-sm" onClick={()=>delPm(pm.id)}><I n="x" size={12} color="var(--gr-t3)"/></button>
          </div>)}</div>
          <div style={{display:'flex',gap:6}}>
            <input className="gr-input" value={addPmName} onChange={e=>setAddPmName(e.target.value)} placeholder="결제수단 이름" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addPm()}/>
            <select value={addPmType} onChange={e=>setAddPmType(e.target.value)} style={{padding:'8px',borderRadius:8,border:'1px solid var(--gr-brd)',fontSize:13,fontFamily:'var(--gr-ff)'}}>
              <option value="card">카드</option><option value="account">계좌</option><option value="cash">현금</option>
            </select>
            <button className="gr-btn-sm" onClick={addPm}>추가</button>
          </div>
        </div>}

        {m.id==='alarm' && room.menus.alarm && <div className="gr-setting-detail">
          <div style={{fontSize:12,color:'var(--gr-t3)'}}>스케줄 등록 시 알람을 설정할 수 있습니다.</div>
        </div>}
      </div>)}

      <button className="gr-btn-danger" style={{marginTop:24}} onClick={handleDeleteRoom}><I n="trash" size={16}/> 캘린더 삭제</button>
    </div>
  </div>;
}

function InviteMembers({room,updateRoom,friends,sb,goBack,userId}){
  const available=friends.filter(f=>!room.members.includes(f.id));
  const invite=async (fid)=>{
    updateRoom(room.id,r=>({...r,members:[...r.members,fid]}));
    try {
      await supabase.from('goroom_room_members').insert({ room_id: room.id, user_id: fid, role: 'member' });
    } catch(e) { console.error(e); }
    goBack();
  };
  return <div className="gr-panel"><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">멤버 초대</div><div style={{width:28}}/></div><div className="gr-pg-body">{available.length===0?<div className="gr-empty">초대 가능한 친구가 없습니다</div>:available.map(f=> <div key={f.id} className="gr-friend-row" onClick={()=>invite(f.id)}><Avatar name={f.nickname} size={40} src={f.profileImg}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname}</div><div className="gr-friend-status">{f.statusMsg}</div></div><button className="gr-btn-invite"><I n="plus" size={14} color="#fff"/> 초대</button></div>)}</div></div>;
}

function SchCard({sc,onClick}){
  const imgs=sc.images||[];
  return <div className="gr-sch-card" onClick={onClick} style={{cursor:'pointer'}}>
    {imgs.length>0&&<div className="gr-sch-thumb"><img src={imgs[0]} alt=""/>{imgs.length>1&&<span className="gr-sch-thumb-count">+{imgs.length-1}</span>}</div>}
    <div className="gr-sch-bar" style={{background:sc.color||'var(--gr-acc)'}}/>
    <div className="gr-sch-body"><div className="gr-sch-title">{sc.title}</div><div className="gr-sch-meta">{sc.time&&<span>{sc.time}</span>}{sc.memo&&<span>{sc.memo}</span>}</div>{sc.budget&&<div className="gr-sch-budget" style={{color:sc.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}>{sc.budget.type==='income'?'+':'-'}{sc.budget.amount?.toLocaleString()}원</div>}</div>
  </div>;
}

function RoomCal({nav,setNav,sel,setSel,today,schedules,onSchClick}){
  const y=nav.getFullYear(),m=nav.getMonth(),fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),dip=new Date(y,m,0).getDate();
  const ts=fmt(today),ss=fmt(sel); const cells=[];
  for(let i=0;i<fd;i++) cells.push({d:dip-fd+i+1,o:true,dt:new Date(y,m-1,dip-fd+i+1)}); for(let i=1;i<=dim;i++) cells.push({d:i,o:false,dt:new Date(y,m,i)}); const rem=7-cells.length%7; if(rem<7) for(let i=1;i<=rem;i++) cells.push({d:i,o:true,dt:new Date(y,m+1,i)});
  const mv=d=>{const n=new Date(nav);n.setMonth(n.getMonth()+d);setNav(n);}; const selSchs=schedules.filter(s=>s.date===ss); const dots=ds=>schedules.filter(s=>s.date===ds).slice(0,3);
  return <div><div className="gr-cal-nav"><button className="gr-cal-nav-btn" onClick={()=>mv(-1)}><I n="left" size={18}/></button><h3>{y}년 {MO[m]}</h3><button className="gr-cal-nav-btn" onClick={()=>mv(1)}><I n="right" size={18}/></button></div><div className="gr-cal-head">{DAYS.map(d=><span key={d}>{d}</span>)}</div><div className="gr-cal-grid">{cells.map((c,i)=>{const ds=fmt(c.dt),dd=dots(ds); return <div key={i} className={`gr-cal-cell ${c.o?'ot':''} ${ds===ts?'tod':''} ${ds===ss&&ds!==ts?'sel':''}`} onClick={()=>setSel(c.dt)}><span className="gr-cal-d">{c.d}</span>{dd.length>0&&<div className="gr-cal-dots">{dd.map((sc,j)=><span key={j} style={{background:sc.color||'var(--gr-acc)'}}/>)}</div>}</div>;})}</div><div className="gr-cal-sel-info"><div className="gr-cal-sel-date">{sel.getMonth()+1}월 {sel.getDate()}일 {DAYS[sel.getDay()]}요일</div>{selSchs.length===0?<div className="gr-cal-empty">스케줄이 없습니다</div>:selSchs.map(sc=> <SchCard key={sc.id} sc={sc} onClick={()=>onSchClick&&onSchClick(sc)}/>)}</div></div>;
}

function RoomMemo({memos,room,updateRoom,deleteMemoDb,updateMemoPinDb}){
  const [q,setQ]=useState(''); const [viewMode,setViewMode]=useState('box');
  const togglePin=async (id)=>{
    const memo = memos.find(m=>m.id===id);
    if(!memo) return;
    const newPinned = !memo.pinned;
    updateRoom(room.id,r=>({...r,memos:r.memos.map(m=>m.id===id?{...m,pinned:newPinned}:m)}));
    await updateMemoPinDb(id, newPinned);
  };
  const del=async (id)=>{
    updateRoom(room.id,r=>({...r,memos:r.memos.filter(m=>m.id!==id)}));
    await deleteMemoDb(id);
  };
  if(!memos.length) return <div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>📝</div>메모를 추가해보세요</div>;
  const filtered=memos.filter(m=>{if(!q.trim()) return true; const kw=q.toLowerCase(); return (m.title||'').toLowerCase().includes(kw)||(m.content||'').toLowerCase().includes(kw);}); const pinned=filtered.filter(m=>m.pinned); const normal=filtered.filter(m=>!m.pinned).sort((a,b)=>b.createdAt-a.createdAt); const all=[...pinned,...normal];
  return <div style={{padding:12}}><div className="gr-memo-toolbar"><div className="gr-memo-search"><I n="search" size={14} color="var(--gr-t3)"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="메모 검색..." className="gr-memo-search-input"/></div><div className="gr-memo-view-toggle"><button className={`gr-icon-btn-sm ${viewMode==='list'?'active':''}`} onClick={()=>setViewMode('list')}><I n="list" size={16}/></button><button className={`gr-icon-btn-sm ${viewMode==='box'?'active':''}`} onClick={()=>setViewMode('box')}><I n="grid" size={16}/></button></div></div>{filtered.length===0&&<div className="gr-cal-empty">검색 결과가 없습니다</div>}{viewMode==='box'?all.map(m=> <div key={m.id} className={`gr-memo-card ${m.pinned?'pinned':''}`}><div className="gr-memo-card-top"><div className="gr-memo-title">{m.title}</div><div className="gr-memo-card-actions"><button className="gr-icon-btn-sm" onClick={()=>togglePin(m.id)}><I n="pin" size={14} color={m.pinned?'var(--gr-acc)':'var(--gr-t3)'}/></button><button className="gr-icon-btn-sm" onClick={()=>del(m.id)}><I n="trash" size={14} color="var(--gr-exp)"/></button></div></div><div className="gr-memo-preview">{m.content?.slice(0,80)}</div><div className="gr-memo-date">{fmtTime(m.createdAt)}</div></div>):all.map(m=> <div key={m.id} className={`gr-memo-list-row ${m.pinned?'pinned':''}`}>{m.pinned&&<I n="pin" size={12} color="var(--gr-acc)"/>}<div className="gr-memo-list-title">{m.title}</div><div className="gr-memo-list-date">{fmtTime(m.createdAt)}</div><button className="gr-icon-btn-sm" onClick={()=>togglePin(m.id)}><I n="pin" size={14} color={m.pinned?'var(--gr-acc)':'var(--gr-t3)'}/></button><button className="gr-icon-btn-sm" onClick={()=>del(m.id)}><I n="trash" size={14} color="var(--gr-exp)"/></button></div>)}</div>;
}

function MemoForm({goBack,room,updateRoom,sb,saveMemoDb,userId}){
  const [title,setTitle]=useState(''); const [content,setContent]=useState('');
  const save=async ()=>{
    if(!title.trim()) return;
    const memo = {id:uid(),title:title.trim(),content,pinned:false,createdAt:Date.now(),createdBy:userId};
    updateRoom(room.id,r=>({...r,memos:[...r.memos,memo]}));
    await saveMemoDb(room.id, memo);
    goBack();
  };
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">새 메모</div><div style={{width:28}}/></div><div className="gr-pg-body"><div className="gr-pg-label">제목</div><input className="gr-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="메모 제목" autoFocus style={{marginBottom:12}}/><div className="gr-pg-label">내용</div><textarea className="gr-input" value={content} onChange={e=>setContent(e.target.value)} placeholder="내용을 입력하세요" rows={6} style={{resize:'none'}}/></div><div className="gr-save-bar"><button className="gr-save-btn" disabled={!title.trim()} onClick={save}>저장하기</button></div></div>;
}

function RoomTodo({todos,room,updateRoom,isMulti,getName,deleteTodoDb,updateTodoDoneDb,userId}){
  const toggle=async (id)=>{
    const t = todos.find(x=>x.id===id);
    if(!t) return;
    const newDone = !t.done;
    updateRoom(room.id,r=>({...r,todos:r.todos.map(t=>t.id===id?{...t,done:newDone,doneAt:newDone?Date.now():null,doneBy:newDone?userId:null}:t)}));
    await updateTodoDoneDb(id, newDone);
  };
  const del=async (id)=>{
    updateRoom(room.id,r=>({...r,todos:r.todos.filter(t=>t.id!==id)}));
    await deleteTodoDb(id);
  };
  if(!todos.length) return <div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>✅</div>할 일을 추가해보세요</div>;
  return <div style={{padding:12}}>{todos.map(t=> <div key={t.id} className="gr-todo-row">
    <button className={`gr-todo-cb ${t.done?'done':''}`} onClick={()=>toggle(t.id)}>{t.done&&<I n="check" size={14} color="#fff"/>}</button>
    <div style={{flex:1,minWidth:0}}>
      <span className={`gr-todo-text ${t.done?'done':''}`}>{t.text}</span>
      <div className="gr-todo-meta">
        {isMulti && t.createdBy && <span>{getName(t.createdBy)}</span>}
        {t.createdAt && <span>{fmtTime(t.createdAt)} 작성</span>}
        {t.done && t.doneAt && <span style={{color:'var(--gr-inc)'}}>
          {isMulti && t.doneBy && <span>{getName(t.doneBy)} · </span>}{fmtTime(t.doneAt)} 완료
        </span>}
      </div>
    </div>
    <button className="gr-todo-del" onClick={()=>del(t.id)}><I n="x" size={14}/></button>
  </div>)}</div>;
}

function ImageViewer({images,startIdx,onClose}){
  const [idx,setIdx]=useState(startIdx||0);
  return <div className="gr-img-viewer" onClick={onClose}>
    <button className="gr-img-viewer-close" onClick={onClose}><I n="x" size={24} color="#fff"/></button>
    <div className="gr-img-viewer-body" onClick={e=>e.stopPropagation()}>
      <img src={images[idx]} className="gr-img-viewer-img" alt=""/>
      {images.length>1&&<div className="gr-img-viewer-nav">
        <button className="gr-img-viewer-btn" onClick={()=>setIdx(p=>(p-1+images.length)%images.length)} disabled={images.length<=1}><I n="left" size={24} color="#fff"/></button>
        <span style={{color:'#fff',fontSize:14}}>{idx+1} / {images.length}</span>
        <button className="gr-img-viewer-btn" onClick={()=>setIdx(p=>(p+1)%images.length)} disabled={images.length<=1}><I n="right" size={24} color="#fff"/></button>
      </div>}
    </div>
  </div>;
}

function DiarySlider({images,onImgClick}){
  return <div className="gr-thr-slider">
    {images.map((img,i)=> <div key={i} className="gr-thr-slide" onClick={e=>{e.stopPropagation();onImgClick(i);}}>
      <img src={img} className="gr-thr-slide-img" alt=""/>
    </div>)}
    {images.length>1&&<div className="gr-thr-slide-count">{images.length} 장</div>}
  </div>;
}

function RoomDiary({diaries,schedules,isMulti,getName,room,updateRoom,onSchClick,updateDiaryLikes,updateDiaryComments,userId}){
  const [commentText,setCommentText]=useState('');
  const [viewerImgs,setViewerImgs]=useState(null);
  const [viewerIdx,setViewerIdx]=useState(0);
  const [replyTo,setReplyTo]=useState(null);

  const toggleLike=async (did,e)=>{
    e.stopPropagation();
    let newLikes;
    updateRoom(room.id,r=>({...r,diaries:r.diaries.map(d=>{
      if(d.id!==did) return d;
      const likes=d.likes||[];
      const already=likes.includes(userId);
      newLikes = already?likes.filter(x=>x!==userId):[...likes,userId];
      return {...d,likes:newLikes};
    })}));
    if(newLikes) await updateDiaryLikes(did, newLikes);
  };
  const addComment=async (did)=>{
    if(!commentText.trim()) return;
    const newComment = {id:shortId(),text:commentText.trim(),by:userId,at:Date.now()};
    let newComments;
    updateRoom(room.id,r=>({...r,diaries:r.diaries.map(d=>{
      if(d.id!==did) return d;
      newComments = [...(d.comments||[]),newComment];
      return {...d,comments:newComments};
    })}));
    setCommentText('');
    if(newComments) await updateDiaryComments(did, newComments);
  };
  const share=(d,e)=>{
    e.stopPropagation();
    const text=`${d.mood||''}${d.weather||''} ${d.title||''}\n${d.content?.slice(0,100)||''}`;
    if(navigator.share) navigator.share({title:d.title||'',text}).catch(()=>{});
    else {navigator.clipboard?.writeText(text);alert('복사됨!');}
  };

  if(!diaries.length) return <div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>📖</div>일기를 작성해보세요</div>;

  return <div className="gr-thr-feed">
    {viewerImgs&&<ImageViewer images={viewerImgs} startIdx={viewerIdx} onClose={()=>setViewerImgs(null)}/>}

    {diaries.sort((a,b)=>b.createdAt-a.createdAt).map(d=> <div key={d.id} className="gr-thr-post">
      <div className="gr-thr-post-header">
        <Avatar name={getName(d.createdBy||userId)} size={36}/>
        <div style={{flex:1}}>
          <div className="gr-thr-post-name">{getName(d.createdBy||userId)} <span className="gr-thr-post-time">{d.createdAt?fmtTime(d.createdAt):d.date}</span></div>
          <div className="gr-thr-post-text">{d.mood||''}{d.weather||''} {d.title||''}</div>
        </div>
        <button className="gr-icon-btn"><I n="more" size={18}/></button>
      </div>

      {d.content&&<div className="gr-thr-post-body">{d.content}</div>}

      {d.images&&d.images.length>0&&<DiarySlider images={d.images} onImgClick={(i)=>{setViewerImgs(d.images);setViewerIdx(i);}}/>}

      <div className="gr-thr-post-actions">
        <button className="gr-thr-act-btn" onClick={e=>toggleLike(d.id,e)}>
          {(d.likes||[]).includes(userId) ? <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--gr-exp)" stroke="var(--gr-exp)" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gr-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>}
          <span>{(d.likes||[]).length||''}</span>
        </button>
        <button className="gr-thr-act-btn" onClick={e=>{e.stopPropagation();setReplyTo(replyTo===d.id?null:d.id);}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gr-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>{(d.comments||[]).length||''}</span>
        </button>
        <button className="gr-thr-act-btn" onClick={e=>share(d,e)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gr-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>

      {(replyTo===d.id || (d.comments||[]).length>0) && <div className="gr-thr-comments">
        {(d.comments||[]).map(c=> <div key={c.id} className="gr-thr-comment">
          <Avatar name={getName(c.by)} size={28}/>
          <div style={{flex:1,minWidth:0}}>
            <div className="gr-thr-comment-header">
              <span className="gr-thr-comment-name">{getName(c.by)}</span>
              <span className="gr-thr-comment-time">{fmtTime(c.at)}</span>
            </div>
            <div className="gr-thr-comment-text">{c.text}</div>
          </div>
        </div>)}
        {replyTo===d.id&&<div className="gr-thr-comment-input">
          <Avatar name="나" size={28}/>
          <input className="gr-thr-comment-field" value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="댓글 달기..." onKeyDown={e=>{if(e.key==='Enter') addComment(d.id);}}/>
          <button className="gr-thr-comment-send" onClick={()=>addComment(d.id)} disabled={!commentText.trim()}>게시</button>
        </div>}
      </div>}
    </div>)}
  </div>;
}

function RoomBudget({schedules, room}){
  const [searchQ, setSearchQ] = useState('');
  const st = room?.settings || DEF_SETTINGS;
  const paymentMethods = st.paymentMethods || DEF_SETTINGS.paymentMethods;
  const getPmName = (pmId) => paymentMethods.find(p=>p.id===pmId)?.name || '';

  let budgets=schedules.filter(s=>s.budget);

  // Filter by search
  if (searchQ.trim()) {
    const q = searchQ.toLowerCase();
    budgets = budgets.filter(s => {
      const title = (s.title||'').toLowerCase();
      const catName = (s.budget.bCatName||'').toLowerCase();
      const pmName = getPmName(s.budget.pmId).toLowerCase();
      return title.includes(q) || catName.includes(q) || pmName.includes(q);
    });
  }

  const inc=budgets.filter(s=>s.budget.type==='income').reduce((a,s)=>a+s.budget.amount,0);
  const exp=budgets.filter(s=>s.budget.type==='expense').reduce((a,s)=>a+s.budget.amount,0);

  return <div style={{padding:12}}>
    {/* Search bar */}
    <div className="gr-memo-search" style={{marginBottom:12}}>
      <I n="search" size={14} color="var(--gr-t3)"/>
      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="항목, 카테고리, 결제수단 검색..." className="gr-memo-search-input"/>
    </div>
    <div className="gr-budget-summary"><div className="gr-budget-box"><div className="gr-budget-label">수입</div><div className="gr-budget-val" style={{color:'var(--gr-inc)'}}>+{inc.toLocaleString()}</div></div><div className="gr-budget-box"><div className="gr-budget-label">지출</div><div className="gr-budget-val" style={{color:'var(--gr-exp)'}}>-{exp.toLocaleString()}</div></div><div className="gr-budget-box"><div className="gr-budget-label">잔액</div><div className="gr-budget-val" style={{color:inc-exp>=0?'var(--gr-inc)':'var(--gr-exp)'}}>{(inc-exp).toLocaleString()}</div></div></div>
    {budgets.length===0?<div className="gr-cal-empty" style={{marginTop:20}}>내역이 없습니다</div>:budgets.sort((a,b)=>b.createdAt-a.createdAt).map(sc=> <div key={sc.id} className="gr-budget-row">
      <div className="gr-budget-dot" style={{background:sc.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}/>
      <div className="gr-budget-info">
        <div style={{fontWeight:500}}>{sc.title}</div>
        <div style={{fontSize:11,color:'var(--gr-t3)'}}>
          {sc.date}
          {sc.budget.bCatName && <span> · {sc.budget.bCatName}</span>}
          {sc.budget.pmId && getPmName(sc.budget.pmId) && <span> · {getPmName(sc.budget.pmId)}</span>}
        </div>
      </div>
      <div style={{fontWeight:700,color:sc.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}>{sc.budget.type==='income'?'+':'-'}{sc.budget.amount.toLocaleString()}원</div>
    </div>)}
  </div>;
}

function ToggleSection({icon,iconColor,label,on,toggle,children}){
  return <div>
    <div className="gr-toggle-row" onClick={toggle}><span style={{display:'flex',alignItems:'center',gap:8}}><I n={icon} size={16} color={iconColor}/> {label}</span><Toggle on={on} toggle={toggle}/></div>
    {on && <div className="gr-toggle-body">{children}</div>}
  </div>;
}

function ScheduleForm({goBack,room,updateRoom,selDate,sb,saveSchedule,userId}){
  const st = room.settings || DEF_SETTINGS;
  const menus = room.menus;
  const paymentMethods = st.paymentMethods || DEF_SETTINGS.paymentMethods;
  const [title,setTitle]=useState('');
  const [date,setDate]=useState(selDate);
  const [time,setTime]=useState('');
  const [memo,setMemo]=useState('');
  const [location,setLocation]=useState('');
  const [locationDetail,setLocationDetail]=useState('');
  const [addrQuery,setAddrQuery]=useState('');
  const [addrResults,setAddrResults]=useState([]);
  const [addrSearching,setAddrSearching]=useState(false);
  const [showAddrSearch,setShowAddrSearch]=useState(false);
  const [color,setColor]=useState(st.schCats[0]?.color||COLORS[0]);
  const [catId,setCatId]=useState(st.schCats[0]?.id||'');
  const [todos,setTodos]=useState([{id:shortId(),text:''}]);
  const [hasDday,setHasDday]=useState(false);
  const [hasRepeat,setHasRepeat]=useState(false);
  const [rpType,setRpType]=useState('daily');
  const [rpInterval,setRpInterval]=useState('1');
  const [rpEnd,setRpEnd]=useState('none');
  const [rpEndDate,setRpEndDate]=useState('');
  const [alBefore,setAlBefore]=useState('30m');
  const [alMsg,setAlMsg]=useState('');
  const [bType,setBType]=useState('expense');
  const [bAmt,setBAmt]=useState('');
  const [bCatId,setBCatId]=useState(st.expCats[0]?.id||'');
  const [bPmId, setBPmId] = useState(paymentMethods[0]?.id||'');
  const [images,setImages]=useState([]);
  const [saving, setSaving] = useState(false);
  const handleImages=(e)=>{Array.from(e.target.files).forEach(file=>{const r=new FileReader();r.onload=ev=>setImages(p=>[...p,ev.target.result]);r.readAsDataURL(file);});};
  const removeImage=(idx)=>setImages(p=>p.filter((_,i)=>i!==idx));

  const selectCat = (id) => { setCatId(id); const c=st.schCats.find(x=>x.id===id); if(c) setColor(c.color); };

  const searchAddr = async () => {
    if(!addrQuery.trim()) return;
    setAddrSearching(true);
    try {
      const res = await fetch(`https://dyotbojxtcqhcmrefofb.supabase.co/functions/v1/kakao-search?query=${encodeURIComponent(addrQuery.trim())}&size=10`);
      const data = await res.json();
      setAddrResults(data.documents || []);
    } catch(e) { console.error('주소 검색 오류:', e); setAddrResults([]); }
    setAddrSearching(false);
  };

  const selectAddr = (item) => {
    setLocation(item.place_name || item.address_name);
    setLocationDetail(item.road_address_name || item.address_name || '');
    setShowAddrSearch(false);
    setAddrResults([]);
    setAddrQuery('');
  };

  const save = async () => {
    if(!title.trim() || saving) return;
    setSaving(true);
    const bCats = bType==='expense' ? st.expCats : st.incCats;
    const bCatItem = bCats.find(c=>c.id===bCatId);
    const sch = {
      id:uid(), title:title.trim(), date, time, memo, location: location||null, locationDetail: locationDetail||null, color, catId, images, createdAt:Date.now(), createdBy:userId,
      todos: menus.todo ? todos.filter(t=>t.text.trim()).map(t=>({id:t.id,text:t.text.trim(),done:false})) : [],
      dday: hasDday,
      repeat: hasRepeat ? {type:rpType, interval:parseInt(rpInterval)||1, endDate:rpEnd==='date'?rpEndDate:null} : null,
      alarm: menus.alarm ? {before:alBefore, message:alMsg} : null,
      budget: menus.budget && bAmt ? {type:bType, amount:Number(bAmt), catId:bCatId, bCatName:bCatItem?.name||'', pmId:bPmId} : null,
    };
    const savedSch = await saveSchedule(room.id, sch);
    updateRoom(room.id, r=>({...r, schedules:[...r.schedules, savedSch]}));
    setSaving(false);
    goBack();
  };

  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">새 스케줄</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-pg-label" style={{marginTop:0}}>카테고리</div>
      <div className="gr-pills-scroll">{st.schCats.map(c=> <button key={c.id} className={`gr-pill-btn ${catId===c.id?'on':''}`} style={catId===c.id?{background:c.color,borderColor:c.color,color:'#fff'}:{}} onClick={()=>selectCat(c.id)}>{c.name}</button>)}</div>
      <input className="gr-input lg" value={title} onChange={e=>setTitle(e.target.value)} placeholder="스케줄명을 입력하세요" autoFocus/>
      <div className="gr-form-row">
        <div className="gr-form-half"><div className="gr-pg-label"><I n="cal" size={14}/> 날짜</div><input className="gr-input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="gr-form-half"><div className="gr-pg-label"><I n="clock" size={14}/> 시간</div><input className="gr-input" type="time" value={time} onChange={e=>setTime(e.target.value)}/></div>
      </div>

      {menus.cal && <div className="gr-form-divider">
        <div className="gr-form-sec-row"><span className="gr-form-sec-title"><I n="cal" size={14} color="#8B5CF6"/> 반복</span><Toggle on={hasRepeat} toggle={()=>setHasRepeat(!hasRepeat)}/></div>
        {hasRepeat && <div style={{paddingTop:8}}>
          <div className="gr-pills-scroll">{[['daily','매일'],['weekly','매주'],['monthly','매월'],['yearly','매년'],['custom','직접']].map(([k,v])=> <button key={k} className={`gr-pill-btn ${rpType===k?'on':''}`} style={rpType===k?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setRpType(k)}>{v}</button>)}</div>
          {rpType==='custom'&&<div><div className="gr-pg-label">간격 (일)</div><input className="gr-input" type="number" value={rpInterval} onChange={e=>setRpInterval(e.target.value)} placeholder="예: 3"/></div>}
          <div className="gr-pg-label">종료</div>
          <div className="gr-pills-scroll">
            <button className={`gr-pill-btn ${rpEnd==='none'?'on':''}`} style={rpEnd==='none'?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setRpEnd('none')}>계속</button>
            <button className={`gr-pill-btn ${rpEnd==='date'?'on':''}`} style={rpEnd==='date'?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setRpEnd('date')}>종료일</button>
          </div>
          {rpEnd==='date'&&<input className="gr-input" type="date" value={rpEndDate} onChange={e=>setRpEndDate(e.target.value)} style={{marginTop:6}}/>}
        </div>}
      </div>}

      <div className="gr-form-divider">
        <div className="gr-pg-label" style={{marginTop:0}}><I n="pin" size={14}/> 장소</div>
        {location ? (
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{flex:1,padding:'10px 12px',background:'var(--gr-bg)',borderRadius:10,fontSize:13}}>
              <div style={{fontWeight:600}}>{location}</div>
              {locationDetail && locationDetail!==location && <div style={{color:'var(--gr-t3)',fontSize:12,marginTop:2}}>{locationDetail}</div>}
            </div>
            <button className="gr-icon-btn" onClick={()=>{setLocation('');setLocationDetail('');}} style={{flexShrink:0}}><I n="close" size={16}/></button>
          </div>
        ) : showAddrSearch ? (
          <div>
            <div style={{display:'flex',gap:6}}>
              <input className="gr-input" value={addrQuery} onChange={e=>setAddrQuery(e.target.value)} placeholder="장소명 또는 주소 검색" autoFocus onKeyDown={e=>{if(e.key==='Enter')searchAddr();}} style={{flex:1}}/>
              <button className="gr-btn-sm" onClick={searchAddr} disabled={addrSearching} style={{whiteSpace:'nowrap',padding:'8px 14px',background:'var(--gr-acc)',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>{addrSearching?'...':'검색'}</button>
            </div>
            {addrResults.length>0 && <div style={{maxHeight:200,overflowY:'auto',marginTop:6,border:'1px solid var(--gr-border)',borderRadius:10,background:'#fff'}}>
              {addrResults.map((r,i)=> <div key={i} onClick={()=>selectAddr(r)} style={{padding:'10px 12px',cursor:'pointer',borderBottom:i<addrResults.length-1?'1px solid var(--gr-border)':'none',fontSize:13}} onMouseOver={e=>e.currentTarget.style.background='var(--gr-bg)'} onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                <div style={{fontWeight:600}}>{r.place_name}</div>
                <div style={{color:'var(--gr-t3)',fontSize:12}}>{r.road_address_name||r.address_name}</div>
              </div>)}
            </div>}
            {addrResults.length===0 && addrSearching===false && addrQuery && <div style={{padding:10,fontSize:13,color:'var(--gr-t3)',textAlign:'center'}}>검색 결과가 없습니다</div>}
            <button onClick={()=>{setShowAddrSearch(false);setAddrResults([]);setAddrQuery('');}} style={{marginTop:6,fontSize:12,color:'var(--gr-t3)',background:'none',border:'none',cursor:'pointer'}}>취소</button>
          </div>
        ) : (
          <button onClick={()=>setShowAddrSearch(true)} style={{width:'100%',padding:'10px 12px',border:'1.5px dashed var(--gr-border)',borderRadius:10,background:'none',color:'var(--gr-t3)',fontSize:13,cursor:'pointer',textAlign:'left'}}>📍 장소 검색하기</button>
        )}
      </div>

      {menus.memo && <div className="gr-form-divider">
        <div className="gr-pg-label" style={{marginTop:0}}>메모</div>
        <textarea className="gr-input" value={memo} onChange={e=>setMemo(e.target.value)} placeholder="메모 (선택)" rows={2} style={{resize:'none'}}/>
      </div>}

      {menus.todo && <div className="gr-form-divider">
        <div className="gr-form-sec-title"><I n="check" size={14} color="#3B82F6"/> 할 일 체크리스트</div>
        {todos.map(t=> <div key={t.id} className="gr-todo-input-row">
          <input className="gr-input" value={t.text} onChange={e=>setTodos(p=>p.map(x=>x.id===t.id?{...x,text:e.target.value}:x))} placeholder="할 일 입력" onKeyDown={e=>{if(e.key==='Enter') setTodos(p=>[...p,{id:shortId(),text:''}]);}}/>
          {todos.length>1&&<button className="gr-icon-btn" onClick={()=>setTodos(p=>p.filter(x=>x.id!==t.id))}><I n="x" size={16} color="var(--gr-t3)"/></button>}
        </div>)}
        <button className="gr-add-todo-btn" onClick={()=>setTodos(p=>[...p,{id:shortId(),text:''}])}>+ 할 일 추가</button>
      </div>}

      <div className="gr-form-divider">
        <div className="gr-form-sec-row"><span className="gr-form-sec-title"><I n="clock" size={14} color="#F97316"/> D-day 카운트다운</span><Toggle on={hasDday} toggle={()=>setHasDday(!hasDday)}/></div>
      </div>

      {menus.alarm && <div className="gr-form-divider">
        <div className="gr-form-sec-title"><I n="bell" size={14} color="#EAB308"/> 알람</div>
        <div className="gr-pills-scroll">{[['10m','10분 전'],['30m','30분 전'],['1h','1시간 전'],['1d','하루 전']].map(([k,v])=> <button key={k} className={`gr-pill-btn ${alBefore===k?'on':''}`} style={alBefore===k?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setAlBefore(k)}>{v}</button>)}</div>
        <input className="gr-input" value={alMsg} onChange={e=>setAlMsg(e.target.value)} placeholder="알림 메시지 (선택)"/>
      </div>}

      {menus.budget && <div className="gr-form-divider">
        <div className="gr-form-sec-title"><I n="wallet" size={14} color="#22C55E"/> 가계부</div>
        <div style={{display:'flex',gap:6,marginBottom:8}}><button className={`gr-type-btn ${bType==='expense'?'on-e':''}`} onClick={()=>{setBType('expense');setBCatId(st.expCats[0]?.id||'');}}>지출</button><button className={`gr-type-btn ${bType==='income'?'on-i':''}`} onClick={()=>{setBType('income');setBCatId(st.incCats[0]?.id||'');}}>수입</button></div>
        <div className="gr-pg-label">금액 (원)</div>
        <input className="gr-input lg" type="number" value={bAmt} onChange={e=>setBAmt(e.target.value)} placeholder="0"/>
        <div className="gr-pg-label">{bType==='expense'?'지출':'수입'} 카테고리</div>
        <div className="gr-pills-scroll">{(bType==='expense'?st.expCats:st.incCats).map(c=> <button key={c.id} className={`gr-pill-btn ${bCatId===c.id?'on':''}`} style={bCatId===c.id?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setBCatId(c.id)}>{c.name}</button>)}</div>
        <div className="gr-pg-label">결제수단</div>
        <div className="gr-pills-scroll">{paymentMethods.map(pm=> <button key={pm.id} className={`gr-pill-btn ${bPmId===pm.id?'on':''}`} style={bPmId===pm.id?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setBPmId(pm.id)}>{pm.name}</button>)}</div>
      </div>}

      <div className="gr-form-divider">
        <div className="gr-form-sec-title"><I n="image" size={14} color="var(--gr-t2)"/> 이미지 첨부</div>
        <div className="gr-diary-upload-area">
          {images.map((img,i)=> <div key={i} className="gr-diary-upload-thumb">
            <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}}/>
            <button className="gr-diary-upload-remove" onClick={()=>removeImage(i)}><I n="x" size={12} color="#fff"/></button>
          </div>)}
          <label className="gr-diary-upload-add">
            <I n="plus" size={24} color="var(--gr-t3)"/>
            <span style={{fontSize:11,color:'var(--gr-t3)',marginTop:2}}>추가</span>
            <input type="file" accept="image/*" multiple onChange={handleImages} style={{display:'none'}}/>
          </label>
        </div>
      </div>

      <div style={{height:20}}/>
    </div>
    <div className="gr-save-bar"><button className="gr-save-btn" disabled={!title.trim()||saving} onClick={save}>{saving?'저장중...':'저장하기'}</button></div>
  </div>;
}

const MOODS=['😊','😢','😡','😴','🥰','😎','🤔','😱','🤗','😤'];
const WEATHERS=['☀️','⛅','🌧️','❄️','🌪️','🌈','🌙','⚡'];

function DiaryForm({goBack,room,updateRoom,sb,saveDiaryDb,userId}){
  const [title,setTitle]=useState('');
  const [content,setContent]=useState('');
  const [images,setImages]=useState([]);
  const [mood,setMood]=useState('');
  const [weather,setWeather]=useState('');
  const [saving,setSaving]=useState(false);
  const handleImages=(e)=>{
    const files=Array.from(e.target.files);
    files.forEach(file=>{
      const reader=new FileReader();
      reader.onload=(ev)=>setImages(prev=>[...prev,ev.target.result]);
      reader.readAsDataURL(file);
    });
  };
  const removeImage=(idx)=>setImages(prev=>prev.filter((_,i)=>i!==idx));
  const save=async ()=>{
    if(!title.trim()||saving) return;
    setSaving(true);
    const diary = {id:uid(),title:title.trim(),content,images,mood,weather,date:fmt(new Date()),createdAt:Date.now(),createdBy:userId,likes:[],comments:[]};
    const savedDiary = await saveDiaryDb(room.id, diary);
    updateRoom(room.id,r=>({...r,diaries:[...r.diaries,savedDiary]}));
    setSaving(false);
    goBack();
  };
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">새 일기</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-pg-label">기분</div>
      <div className="gr-emoji-row">{MOODS.map(e=> <button key={e} className={`gr-emoji-btn ${mood===e?'on':''}`} onClick={()=>setMood(mood===e?'':e)}>{e}</button>)}</div>
      <div className="gr-pg-label">날씨</div>
      <div className="gr-emoji-row">{WEATHERS.map(e=> <button key={e} className={`gr-emoji-btn ${weather===e?'on':''}`} onClick={()=>setWeather(weather===e?'':e)}>{e}</button>)}</div>
      <div className="gr-pg-label">사진</div>
      <div className="gr-diary-upload-area">
        {images.map((img,i)=> <div key={i} className="gr-diary-upload-thumb">
          <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}}/>
          <button className="gr-diary-upload-remove" onClick={()=>removeImage(i)}><I n="x" size={12} color="#fff"/></button>
        </div>)}
        <label className="gr-diary-upload-add">
          <I n="plus" size={24} color="var(--gr-t3)"/>
          <span style={{fontSize:11,color:'var(--gr-t3)',marginTop:2}}>추가</span>
          <input type="file" accept="image/*" multiple onChange={handleImages} style={{display:'none'}}/>
        </label>
      </div>
      <div className="gr-pg-label">제목</div>
      <input className="gr-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="오늘의 제목" autoFocus style={{marginBottom:12}}/>
      <div className="gr-pg-label">내용</div>
      <textarea className="gr-input" value={content} onChange={e=>setContent(e.target.value)} placeholder="오늘의 일기를 작성하세요" rows={6} style={{resize:'none'}}/>
    </div>
    <div className="gr-save-bar"><button className="gr-save-btn" disabled={!title.trim()||saving} onClick={save}>{saving?'저장중...':'저장하기'}</button></div>
  </div>;
}

function SimpleForm({title:pt,fields,goBack,onSave,sb}){
  const [vals,setVals]=useState(()=>{const o={};fields.forEach(f=>o[f.k]='');return o;});
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">{pt}</div><div style={{width:28}}/></div><div className="gr-pg-body">{fields.map((f,i)=> <div key={f.k} style={{marginBottom:12}}><div className="gr-pg-label">{f.l}</div>{f.type==='textarea'?<textarea className="gr-input" value={vals[f.k]} onChange={e=>setVals(p=>({...p,[f.k]:e.target.value}))} placeholder={f.l} rows={4} style={{resize:'none'}}/>:<input className="gr-input" value={vals[f.k]} onChange={e=>setVals(p=>({...p,[f.k]:e.target.value}))} placeholder={f.l} autoFocus={i===0}/>}</div>)}</div><div className="gr-save-bar"><button className="gr-save-btn" disabled={!vals[fields[0].k]?.trim()} onClick={()=>onSave(vals)}>저장하기</button></div></div>;
}

function BudgetForm({goBack,room,updateRoom,sb,saveSchedule,userId}){
  const st = room.settings || DEF_SETTINGS;
  const paymentMethods = st.paymentMethods || DEF_SETTINGS.paymentMethods;
  const [title,setTitle]=useState(''); const [amount,setAmount]=useState(''); const [type,setType]=useState('expense');
  const [bCatId,setBCatId]=useState(st.expCats[0]?.id||'');
  const [bPmId,setBPmId]=useState(paymentMethods[0]?.id||'');
  const [saving,setSaving]=useState(false);

  const save=async ()=>{
    if(!title.trim()||!amount||saving) return;
    setSaving(true);
    const bCats = type==='expense' ? st.expCats : st.incCats;
    const bCatItem = bCats.find(c=>c.id===bCatId);
    const sch = {
      id:uid(),title:title.trim(),date:fmt(new Date()),time:'',memo:'',
      color:type==='income'?'#3182F6':'#F04452',
      budget:{type,amount:Number(amount),catId:bCatId,bCatName:bCatItem?.name||'',pmId:bPmId},
      createdAt:Date.now(),createdBy:userId,images:[],todos:[],
    };
    const savedSch = await saveSchedule(room.id, sch);
    updateRoom(room.id,r=>({...r,schedules:[...r.schedules,savedSch]}));
    setSaving(false);
    goBack();
  };
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">가계부 추가</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div style={{display:'flex',gap:6,marginBottom:16}}><button className={`gr-type-btn ${type==='expense'?'on-e':''}`} onClick={()=>{setType('expense');setBCatId(st.expCats[0]?.id||'');}}>지출</button><button className={`gr-type-btn ${type==='income'?'on-i':''}`} onClick={()=>{setType('income');setBCatId(st.incCats[0]?.id||'');}}>수입</button></div>
      <div className="gr-pg-label">항목명</div>
      <input className="gr-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 점심식사" autoFocus style={{marginBottom:12}}/>
      <div className="gr-pg-label">금액 (원)</div>
      <input className="gr-input lg" type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/>
      <div className="gr-pg-label">{type==='expense'?'지출':'수입'} 카테고리</div>
      <div className="gr-pills-scroll">{(type==='expense'?st.expCats:st.incCats).map(c=> <button key={c.id} className={`gr-pill-btn ${bCatId===c.id?'on':''}`} style={bCatId===c.id?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setBCatId(c.id)}>{c.name}</button>)}</div>
      <div className="gr-pg-label">결제수단</div>
      <div className="gr-pills-scroll">{paymentMethods.map(pm=> <button key={pm.id} className={`gr-pill-btn ${bPmId===pm.id?'on':''}`} style={bPmId===pm.id?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setBPmId(pm.id)}>{pm.name}</button>)}</div>
    </div>
    <div className="gr-save-bar"><button className="gr-save-btn" disabled={!title.trim()||!amount||saving} onClick={save}>{saving?'저장중...':'저장하기'}</button></div>
  </div>;
}

function AddRoomPage({goBack,setRooms,sb,friends,createRoom,userId}){
  const [name,setName]=useState(''); const [desc,setDesc]=useState(''); const [isPublic,setIsPublic]=useState(true);
  const [menus,setMenus]=useState({cal:true,memo:true,todo:true,diary:true,budget:true,alarm:true});
  const [selMembers,setSelMembers]=useState([]);
  const [saving,setSaving]=useState(false);
  const [thumbPreview,setThumbPreview]=useState(null);
  const [thumbFile,setThumbFile]=useState(null);
  const thumbRef=useRef(null);
  const handleThumb=(e)=>{const f=e.target.files?.[0]; if(!f) return; setThumbFile(f); const r=new FileReader(); r.onload=ev=>setThumbPreview(ev.target.result); r.readAsDataURL(f);};
  const removeThumb=()=>{setThumbPreview(null);setThumbFile(null);if(thumbRef.current)thumbRef.current.value='';};
  const toggleMenu=(id)=>setMenus(p=>({...p,[id]:!p[id]}));
  const toggleMember=(fid)=>setSelMembers(p=>p.includes(fid)?p.filter(x=>x!==fid):[...p,fid]);
  const save=async ()=>{
    if(!name.trim()||saving) return;
    setSaving(true);
    const roomData = {name:name.trim(),desc:desc.trim(),isPublic,menus,members:[userId,...selMembers],thumbnailFile:thumbFile};
    const roomId = await createRoom(roomData);
    setRooms(p=>[...p,{id:roomId,name:name.trim(),desc:desc.trim(),isPersonal:false,isPublic,thumbnailUrl:thumbPreview||'',members:[userId,...selMembers],newCount:0,nearestSchedule:null,menus,settings:{...DEF_SETTINGS},schedules:[],memos:[],todos:[],diaries:[]}]);
    setSaving(false);
    goBack();
  };
  return <div className="gr-panel"><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">새 캘린더방</div><div style={{width:28}}/></div><div className="gr-pg-body"><div className="gr-pg-label">썸네일 이미지</div><div className="gr-thumb-upload" onClick={()=>thumbRef.current?.click()}>{thumbPreview?<><img src={thumbPreview} alt="" className="gr-thumb-img"/><button className="gr-thumb-remove" onClick={e=>{e.stopPropagation();removeThumb();}}><I n="x" size={14} color="#fff"/></button></>:<div className="gr-thumb-placeholder"><I n="image" size={28} color="var(--gr-t3)"/><span style={{fontSize:12,color:'var(--gr-t3)',marginTop:4}}>이미지 선택</span></div>}</div><input ref={thumbRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleThumb}/><div className="gr-pg-label">캘린더명</div><input className="gr-input" value={name} onChange={e=>setName(e.target.value)} placeholder="이름" autoFocus style={{marginBottom:12}}/><div className="gr-pg-label">설명</div><input className="gr-input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="설명" style={{marginBottom:12}}/><div className="gr-pg-label">공개 여부</div><div style={{display:'flex',gap:8,marginBottom:16}}><button className={`gr-pill ${isPublic?'on':''}`} style={isPublic?{background:'var(--gr-acc)',color:'var(--gr-acc-text)'}:{}} onClick={()=>setIsPublic(true)}>공개</button><button className={`gr-pill ${!isPublic?'on':''}`} style={!isPublic?{background:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setIsPublic(false)}>비공개</button></div><div className="gr-pg-label">기능 ON/OFF</div>{ALL_MENUS.map(m=> <div key={m.id} className="gr-set-row"><span className="gr-set-label"><I n={m.icon} size={16}/> {m.label}</span><Toggle on={menus[m.id]} toggle={()=>toggleMenu(m.id)}/></div>)}<div className="gr-pg-label" style={{marginTop:16}}>멤버 초대 (선택)</div>{friends.map(f=> <div key={f.id} className="gr-friend-row" style={{padding:'8px 0'}} onClick={()=>toggleMember(f.id)}><Avatar name={f.nickname} size={32} src={f.profileImg}/><div className="gr-friend-info"><div className="gr-friend-name" style={{fontSize:13}}>{f.nickname}</div></div><div className={`gr-todo-cb ${selMembers.includes(f.id)?'done':''}`} style={{width:20,height:20}}>{selMembers.includes(f.id)&&<I n="check" size={12} color="#fff"/>}</div></div>)}</div><div className="gr-save-bar"><button className="gr-save-btn" disabled={!name.trim()||saving} onClick={save}>{saving?'만드는중...':'만들기'}</button></div></div>;
}

const CSS = `
:root{--gr-ff:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;--gr-bg:#FFF;--gr-bg2:#F5F5F5;--gr-brd:#EBEBEB;--gr-text:#191919;--gr-t2:#666;--gr-t3:#999;--gr-acc:#FEE500;--gr-acc-d:#F5D800;--gr-acc-text:#191919;--gr-inc:#3182F6;--gr-exp:#F04452;--gr-r:12px;--gr-r-sm:8px;--gr-sidebar-w:360px;--gr-tr:150ms ease}
*{margin:0;padding:0;box-sizing:border-box}
.gr-root{height:100vh;overflow:hidden}
.gr-layout-wide{display:flex;height:100vh;font-family:var(--gr-ff);color:var(--gr-text);background:var(--gr-bg)}
.gr-layout-wide .gr-sidebar{width:var(--gr-sidebar-w);min-width:var(--gr-sidebar-w);border-right:1px solid var(--gr-brd);display:flex;flex-direction:column;height:100vh;overflow:hidden}
.gr-layout-wide .gr-main{flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden}
.gr-sidebar{font-family:var(--gr-ff);color:var(--gr-text);background:var(--gr-bg);height:100vh;display:flex;flex-direction:column;overflow:hidden;font-size:14px;line-height:1.5}
.gr-panel{font-family:var(--gr-ff);color:var(--gr-text);background:var(--gr-bg);height:100vh;display:flex;flex-direction:column;overflow:hidden;font-size:14px;line-height:1.5;position:relative}
.gr-empty-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center}
.gr-icon-btn{background:none;border:none;cursor:pointer;color:var(--gr-text);padding:4px;display:flex}
.gr-icon-btn-sm{background:none;border:none;cursor:pointer;padding:4px;display:flex;border-radius:4px}.gr-icon-btn-sm:hover{background:var(--gr-bg2)}.gr-icon-btn-sm.active{background:var(--gr-bg2)}
.gr-header{padding:12px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--gr-brd);flex-shrink:0}
.gr-header-info{flex:1;display:flex;align-items:center;gap:10px}
.gr-lock{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:8px;padding:40px}
/* 프로필 */
.gr-profile-bg{position:relative;height:180px;display:flex;align-items:flex-start;justify-content:flex-end;padding:12px}
.gr-profile-top-bar{position:absolute;top:12px;right:12px;display:flex;align-items:center;gap:6px;z-index:2}
.gr-profile-top-btn{background:rgba(255,255,255,.85);border:none;border-radius:20px;padding:6px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--gr-ff)}
.gr-profile-top-btn-s{background:rgba(255,255,255,.85);border:none;border-radius:20px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--gr-ff);display:flex;align-items:center;gap:4px}
.gr-profile-fav-btn{position:absolute;top:12px;right:12px;background:none;border:none;cursor:pointer;padding:4px;display:flex;z-index:2}
.gr-profile-info{display:flex;flex-direction:column;align-items:center;padding:0 20px 16px;margin-top:-44px;position:relative;z-index:2}
.gr-profile-avatar-wrap{position:relative;width:84px;height:84px;margin-bottom:8px}
.gr-profile-avatar-wrap>div,.gr-profile-avatar-img{width:80px;height:80px;border-radius:50%;border:3px solid var(--gr-bg)}
.gr-profile-avatar-img{object-fit:cover}
.gr-profile-avatar-edit{position:absolute;bottom:0;right:0;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3}
.gr-profile-name{font-size:18px;font-weight:700}
.gr-profile-status{font-size:13px;color:var(--gr-t3);margin-top:2px}
.gr-profile-bio{font-size:12px;color:var(--gr-t2);margin-top:8px;text-align:center;padding:8px 12px;background:var(--gr-bg2);border-radius:var(--gr-r-sm);max-width:280px}
.gr-profile-edit-row{display:flex;align-items:center;gap:6px;margin-top:6px}
.gr-profile-inline-input{flex:1;border:none;border-bottom:1px solid var(--gr-brd);outline:none;font-size:13px;padding:4px 0;font-family:var(--gr-ff);color:var(--gr-text);background:transparent;text-align:center}
.gr-profile-inline-input.name{font-size:16px;font-weight:700}
.gr-profile-inline-input:focus{border-bottom-color:var(--gr-acc)}
.gr-profile-edit-upload{display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:var(--gr-r);cursor:pointer;margin-bottom:12px;overflow:hidden}
.gr-profile-edit-avatar{position:relative;width:80px;height:80px;margin:0 auto 12px;cursor:pointer}
.gr-profile-edit-avatar-overlay{position:absolute;inset:0;background:rgba(0,0,0,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 150ms}.gr-profile-edit-avatar:hover .gr-profile-edit-avatar-overlay{opacity:1}
/* 스케줄 상세 */
.gr-det-section{padding:12px 0;border-bottom:1px solid var(--gr-brd)}
.gr-det-section:last-child{border:none}
.gr-det-label{font-size:12px;color:var(--gr-t3);margin-bottom:4px}
.gr-tab-top{padding:16px 20px 12px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}.gr-tab-top-title{font-size:20px;font-weight:800}.gr-tab-top-actions{display:flex;gap:4px}
.gr-tab-top-btn{background:none;border:none;cursor:pointer;color:var(--gr-text);padding:8px;display:flex;border-radius:50%}.gr-tab-top-btn:active{background:var(--gr-bg2)}
.gr-tab-body{flex:1;overflow-y:auto}.gr-tab-body::-webkit-scrollbar{width:0}
.gr-btab{display:flex;border-top:1px solid var(--gr-brd);flex-shrink:0;background:var(--gr-bg)}
.gr-btab-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0 10px;border:none;background:none;cursor:pointer;font-size:10px;color:var(--gr-t3);font-family:var(--gr-ff)}.gr-btab-btn.on{color:var(--gr-text)}.gr-btab-btn.on svg{stroke:var(--gr-text)}
.gr-friend-me{display:flex;align-items:center;gap:14px;padding:14px 20px;cursor:pointer}.gr-friend-me:active{background:var(--gr-bg2)}
.gr-friend-row{display:flex;align-items:center;gap:14px;padding:10px 20px;cursor:pointer;transition:background var(--gr-tr)}.gr-friend-row:active,.gr-friend-row:hover{background:var(--gr-bg2)}.gr-friend-row.active{background:var(--gr-bg2)}
.gr-friend-info{flex:1;min-width:0}.gr-friend-name{font-size:15px;font-weight:600;display:flex;align-items:center;gap:4px}.gr-friend-status{font-size:12px;color:var(--gr-t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gr-divider-line{height:1px;background:var(--gr-brd);margin:8px 20px}.gr-section-label{font-size:12px;color:var(--gr-t3);padding:12px 20px 4px;font-weight:500}
.gr-room-row{display:flex;align-items:center;gap:14px;padding:14px 20px;cursor:pointer;transition:background var(--gr-tr)}.gr-room-row:active,.gr-room-row:hover{background:var(--gr-bg2)}.gr-room-row.active{background:var(--gr-bg2)}
.gr-room-info{flex:1;min-width:0}.gr-room-name{font-size:15px;font-weight:600;display:flex;align-items:center;gap:6px}
.gr-badge-my{font-size:10px;background:var(--gr-acc);color:var(--gr-acc-text);padding:1px 6px;border-radius:8px;font-weight:700}
.gr-room-preview{font-size:12px;color:var(--gr-t3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gr-room-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0}
.gr-room-new{background:var(--gr-acc);color:var(--gr-acc-text);font-size:11px;font-weight:700;min-width:20px;height:20px;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:0 6px}
.gr-room-members{font-size:11px;color:var(--gr-t3);display:flex;align-items:center;gap:3px}
.gr-more-item{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--gr-brd);font-size:15px;cursor:pointer}
.gr-room-top{padding:12px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--gr-brd);flex-shrink:0}.gr-room-top-info{flex:1}.gr-room-top-name{font-size:16px;font-weight:700}.gr-room-top-members{font-size:11px;color:var(--gr-t3)}
.gr-room-tabs{display:flex;padding:4px 12px;gap:2px;border-bottom:1px solid var(--gr-brd);overflow-x:auto;flex-shrink:0}.gr-room-tabs::-webkit-scrollbar{height:0}
.gr-room-tab{padding:8px 12px;border:none;background:none;cursor:pointer;font-size:12px;font-weight:500;color:var(--gr-t3);font-family:var(--gr-ff);border-radius:var(--gr-r-sm);white-space:nowrap;display:flex;align-items:center;gap:4px}.gr-room-tab.on{background:var(--gr-acc);color:var(--gr-acc-text);font-weight:600}
.gr-room-body{flex:1;overflow-y:auto}.gr-room-body::-webkit-scrollbar{width:0}
.gr-empty{text-align:center;padding:60px 20px;color:var(--gr-t3);font-size:14px;line-height:1.8}
.gr-fab{position:absolute;bottom:16px;right:16px;width:52px;height:52px;border-radius:50%;background:var(--gr-acc);border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;z-index:50;color:var(--gr-acc-text)}.gr-fab:active{transform:scale(.95)}
.gr-cal-nav{display:flex;align-items:center;justify-content:center;gap:16px;padding:12px 20px}.gr-cal-nav h3{font-size:15px;font-weight:700;min-width:110px;text-align:center}
.gr-cal-nav-btn{background:none;border:none;cursor:pointer;color:var(--gr-t3);padding:4px;display:flex;border-radius:50%}.gr-cal-nav-btn:active{background:var(--gr-bg2)}
.gr-cal-head{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;padding:0 16px}.gr-cal-head span{font-size:12px;color:var(--gr-t3);padding:6px 0;font-weight:500}.gr-cal-head span:first-child{color:var(--gr-exp)}.gr-cal-head span:last-child{color:var(--gr-inc)}
.gr-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);padding:0 16px;gap:2px}
.gr-cal-cell{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:10px;cursor:pointer;min-height:40px;gap:2px}.gr-cal-cell:active{background:var(--gr-bg2)}
.gr-cal-d{font-size:13px;font-weight:500;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%}
.gr-cal-cell.tod .gr-cal-d{background:var(--gr-acc);color:var(--gr-acc-text);font-weight:700}.gr-cal-cell.sel .gr-cal-d{outline:2px solid var(--gr-text)}.gr-cal-cell.ot{opacity:.25}
.gr-cal-dots{display:flex;gap:2px}.gr-cal-dots span{width:4px;height:4px;border-radius:50%}
.gr-cal-sel-info{padding:16px 20px;border-top:1px solid var(--gr-brd);margin-top:8px}.gr-cal-sel-date{font-size:13px;font-weight:600;color:var(--gr-t2);margin-bottom:8px}
.gr-cal-empty{text-align:center;padding:20px;color:var(--gr-t3);font-size:13px}
.gr-sch-card{display:flex;gap:10px;padding:12px;background:var(--gr-bg);border:1px solid var(--gr-brd);border-radius:var(--gr-r);margin-bottom:6px;align-items:center}.gr-sch-bar{width:4px;min-height:36px;border-radius:2px;flex-shrink:0;align-self:stretch}.gr-sch-thumb{width:48px;height:48px;border-radius:8px;flex-shrink:0;overflow:hidden;position:relative}.gr-sch-thumb img{width:100%;height:100%;object-fit:cover}.gr-sch-thumb-count{position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,.6);color:#fff;font-size:9px;padding:1px 4px;border-radius:4px}.gr-sch-body{flex:1;min-width:0}.gr-sch-title{font-size:14px;font-weight:600}.gr-sch-meta{font-size:12px;color:var(--gr-t3);display:flex;gap:8px;margin-top:2px}.gr-sch-budget{font-size:13px;font-weight:700;margin-top:4px}
.gr-pg-top{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--gr-brd);flex-shrink:0}.gr-pg-title{font-size:17px;font-weight:700}
.gr-pg-body{flex:1;overflow-y:auto;padding:16px 20px}.gr-pg-body::-webkit-scrollbar{width:0}
.gr-pg-label{font-size:13px;font-weight:600;color:var(--gr-t2);margin-bottom:6px;margin-top:12px;display:flex;align-items:center;gap:6px}.gr-pg-label:first-child{margin-top:0}
.gr-input{width:100%;padding:12px 14px;border:1px solid var(--gr-brd);border-radius:var(--gr-r-sm);font-size:14px;font-family:var(--gr-ff);outline:none;background:var(--gr-bg);color:var(--gr-text)}.gr-input:focus{border-color:var(--gr-acc)}.gr-input::placeholder{color:#ccc}.gr-input.lg{font-size:16px;font-weight:600;margin-bottom:12px}
.gr-btn-primary{width:100%;padding:14px;border-radius:var(--gr-r);border:none;background:var(--gr-acc);color:var(--gr-acc-text);font-size:15px;font-weight:700;cursor:pointer;font-family:var(--gr-ff)}.gr-btn-primary:hover{background:var(--gr-acc-d)}.gr-btn-primary:disabled{background:#eee;color:#bbb;cursor:default}
.gr-btn-danger{width:100%;padding:12px;border-radius:var(--gr-r-sm);border:1px solid var(--gr-exp);background:none;color:var(--gr-exp);font-size:14px;font-weight:600;cursor:pointer;font-family:var(--gr-ff);display:flex;align-items:center;justify-content:center;gap:6px}
.gr-btn-copy{background:var(--gr-acc);color:var(--gr-acc-text);border:none;padding:6px 14px;border-radius:var(--gr-r-sm);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--gr-ff)}
.gr-btn-sm{padding:8px 16px;border-radius:var(--gr-r-sm);border:none;background:var(--gr-acc);color:var(--gr-acc-text);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--gr-ff)}
.gr-btn-sm-outline{padding:8px 16px;border-radius:var(--gr-r-sm);border:1px solid var(--gr-brd);background:var(--gr-bg);color:var(--gr-t2);font-size:13px;cursor:pointer;font-family:var(--gr-ff)}
.gr-btn-invite{display:flex;align-items:center;gap:4px;padding:6px 12px;border-radius:var(--gr-r-sm);border:none;background:var(--gr-acc);color:var(--gr-acc-text);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--gr-ff);white-space:nowrap}
.gr-pill{padding:8px 16px;border-radius:20px;border:1px solid var(--gr-brd);font-size:13px;cursor:pointer;background:var(--gr-bg);color:var(--gr-t2);font-family:var(--gr-ff)}
.gr-divider{display:flex;align-items:center;gap:12px;margin:20px 0;color:var(--gr-t3);font-size:12px}.gr-divider::before,.gr-divider::after{content:'';flex:1;height:1px;background:var(--gr-brd)}
.gr-code-box{display:flex;align-items:center;justify-content:space-between;background:var(--gr-bg2);padding:12px 14px;border-radius:var(--gr-r-sm);font-size:14px;font-weight:600}
.gr-save-bar{padding:12px 20px;border-top:1px solid var(--gr-brd);flex-shrink:0}
.gr-save-btn{width:100%;padding:14px;border-radius:var(--gr-r);border:none;background:var(--gr-acc);color:var(--gr-acc-text);font-size:15px;font-weight:700;cursor:pointer;font-family:var(--gr-ff)}.gr-save-btn:hover{background:var(--gr-acc-d)}.gr-save-btn:disabled{background:#eee;color:#bbb;cursor:default}
.gr-clr-row{display:flex;gap:6px;flex-wrap:wrap}.gr-clr-b{width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer}.gr-clr-b.on{border-color:var(--gr-text);box-shadow:0 0 0 2px #fff inset}
.gr-form-row{display:flex;gap:8px;margin-bottom:12px}.gr-form-half{flex:1}
.gr-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-top:1px solid var(--gr-brd);cursor:pointer;font-weight:600;font-size:14px}
.gr-toggle-body{padding:0 0 14px;border-left:3px solid var(--gr-brd);margin-left:8px;padding-left:16px}
.gr-type-btn{flex:1;padding:10px;border-radius:var(--gr-r-sm);border:1px solid var(--gr-brd);font-size:14px;font-weight:600;cursor:pointer;text-align:center;background:var(--gr-bg);font-family:var(--gr-ff)}.gr-type-btn.on-e{background:#FEF2F2;border-color:var(--gr-exp);color:var(--gr-exp)}.gr-type-btn.on-i{background:#EFF6FF;border-color:var(--gr-inc);color:var(--gr-inc)}
.gr-tsw{width:44px;height:26px;border-radius:13px;border:none;cursor:pointer;position:relative;padding:0}.gr-tsw.off{background:#DDD}.gr-tsw.on{background:var(--gr-acc)}.gr-tsw::after{content:'';position:absolute;width:22px;height:22px;border-radius:50%;background:#fff;top:2px;box-shadow:0 1px 3px rgba(0,0,0,.15)}.gr-tsw.off::after{left:2px}.gr-tsw.on::after{left:20px}
.gr-set-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--gr-brd)}.gr-set-label{font-size:14px;display:flex;align-items:center;gap:8px}.gr-set-val{font-size:14px;color:var(--gr-t2)}
.gr-set-member{display:flex;align-items:center;gap:10px;padding:8px 0}
.gr-memo-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.gr-memo-search{flex:1;display:flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid var(--gr-brd);border-radius:var(--gr-r-sm);background:var(--gr-bg2)}
.gr-memo-search-input{border:none;outline:none;background:transparent;flex:1;font-size:13px;font-family:var(--gr-ff);color:var(--gr-text)}.gr-memo-search-input::placeholder{color:var(--gr-t3)}
.gr-memo-view-toggle{display:flex;gap:2px}
.gr-memo-card{padding:14px;border:1px solid var(--gr-brd);border-radius:var(--gr-r);margin-bottom:8px}.gr-memo-card.pinned{border-color:var(--gr-acc);background:#FFFDE6}
.gr-memo-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.gr-memo-card-actions{display:flex;gap:2px;flex-shrink:0}
.gr-memo-title{font-size:14px;font-weight:600}.gr-memo-preview{font-size:12px;color:var(--gr-t3);margin-top:4px;line-height:1.5}.gr-memo-date{font-size:11px;color:var(--gr-t3);margin-top:6px}
.gr-memo-list-row{display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--gr-brd)}.gr-memo-list-row.pinned{background:#FFFAF0}
.gr-memo-list-title{flex:1;font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gr-memo-list-date{font-size:11px;color:var(--gr-t3);white-space:nowrap}
.gr-sub-form{margin-top:12px;padding:12px;border:1px dashed var(--gr-brd);border-radius:var(--gr-r-sm);background:var(--gr-bg2)}
.gr-sub-form-label{font-size:12px;font-weight:600;color:var(--gr-t2);margin-bottom:8px;display:flex;align-items:center;gap:4px}
.gr-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.gr-pills-scroll{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;padding-bottom:4px;flex-wrap:nowrap}.gr-pills-scroll::-webkit-scrollbar{height:0}.gr-pills-scroll .gr-pill-btn{flex-shrink:0}
.gr-emoji-row{display:flex;gap:4px;overflow-x:auto;margin-bottom:12px;padding-bottom:4px}.gr-emoji-row::-webkit-scrollbar{height:0}
.gr-emoji-btn{width:36px;height:36px;border-radius:50%;border:2px solid transparent;background:var(--gr-bg2);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}.gr-emoji-btn.on{border-color:var(--gr-acc);background:#FFFDE6}
/* Threads 피드 */
.gr-thr-feed{padding:0}
.gr-thr-post{padding:14px 16px;border-bottom:1px solid var(--gr-brd)}
.gr-thr-post-header{display:flex;align-items:flex-start;gap:10px;margin-bottom:6px}
.gr-thr-post-name{font-size:14px;font-weight:700}.gr-thr-post-time{font-size:12px;color:var(--gr-t3);font-weight:400;margin-left:6px}
.gr-thr-post-text{font-size:14px;color:var(--gr-text);margin-top:1px}
.gr-thr-post-body{font-size:14px;color:var(--gr-t2);line-height:1.6;padding:0 0 8px 46px;white-space:pre-wrap}
.gr-thr-slider{display:flex;gap:6px;overflow-x:auto;margin:8px 0 8px 46px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}.gr-thr-slider::-webkit-scrollbar{height:0}
.gr-thr-slide{flex-shrink:0;width:85%;max-width:360px;scroll-snap-align:start;border-radius:var(--gr-r);overflow:hidden;cursor:pointer;position:relative}
.gr-thr-slide-img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block}
.gr-thr-slide-count{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;pointer-events:none}
.gr-thr-post-actions{display:flex;gap:2px;padding:8px 0 4px 46px}
.gr-thr-act-btn{display:flex;align-items:center;gap:4px;background:none;border:none;cursor:pointer;padding:6px 12px;border-radius:20px;font-size:13px;color:var(--gr-t3);font-family:var(--gr-ff)}.gr-thr-act-btn:hover{background:var(--gr-bg2)}.gr-thr-act-btn span{min-width:12px}
.gr-thr-comments{padding:8px 0 0 46px}
.gr-thr-comment{display:flex;gap:8px;padding:8px 0}
.gr-thr-comment-header{display:flex;align-items:center;gap:6px}
.gr-thr-comment-name{font-size:13px;font-weight:700}
.gr-thr-comment-time{font-size:11px;color:var(--gr-t3)}
.gr-thr-comment-text{font-size:13px;color:var(--gr-text);margin-top:2px;line-height:1.4}
.gr-thr-comment-input{display:flex;align-items:center;gap:8px;padding:10px 0}
.gr-thr-comment-field{flex:1;border:none;outline:none;font-size:13px;font-family:var(--gr-ff);color:var(--gr-text);padding:8px 0;background:transparent}.gr-thr-comment-field::placeholder{color:var(--gr-t3)}
.gr-thr-comment-send{background:none;border:none;color:var(--gr-acc);font-size:14px;font-weight:700;cursor:pointer;font-family:var(--gr-ff)}.gr-thr-comment-send:disabled{color:var(--gr-t3)}
/* 이미지 뷰어 */
.gr-img-viewer{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:999;display:flex;align-items:center;justify-content:center}
.gr-img-viewer-close{position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;z-index:1000;padding:8px}
.gr-img-viewer-body{display:flex;flex-direction:column;align-items:center;gap:16px;max-width:90vw;max-height:90vh}
.gr-img-viewer-img{max-width:90vw;max-height:80vh;object-fit:contain;border-radius:8px}
.gr-img-viewer-nav{display:flex;align-items:center;gap:20px}
.gr-img-viewer-btn{background:none;border:none;cursor:pointer;padding:8px;display:flex}
.gr-pill-btn{padding:6px 14px;border-radius:20px;border:1px solid var(--gr-brd);font-size:13px;cursor:pointer;background:var(--gr-bg);color:var(--gr-t2);font-family:var(--gr-ff);transition:all 150ms ease}
.gr-pill-btn.on{border-color:transparent;color:#fff}
.gr-todo-input-row{display:flex;gap:6px;align-items:center;margin-bottom:6px}
.gr-add-todo-btn{background:none;border:1px dashed var(--gr-brd);border-radius:var(--gr-r-sm);padding:8px;width:100%;cursor:pointer;color:var(--gr-t3);font-size:13px;font-family:var(--gr-ff)}.gr-add-todo-btn:hover{border-color:#bbb}
.gr-form-section{margin-top:16px;padding:14px;border:1px solid var(--gr-brd);border-radius:var(--gr-r);background:var(--gr-bg2)}
.gr-form-section-title{font-size:13px;font-weight:600;color:var(--gr-t2);margin-bottom:10px;display:flex;align-items:center;gap:6px}
.gr-form-section-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.gr-form-divider{padding:16px 0;border-top:1px solid var(--gr-brd)}
.gr-form-sec-title{font-size:13px;font-weight:600;color:var(--gr-t2);margin-bottom:10px;display:flex;align-items:center;gap:6px}
.gr-form-sec-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.gr-setting-detail{margin-left:24px;padding:10px 0 14px;border-bottom:1px solid var(--gr-brd)}
.gr-setting-detail-title{font-size:12px;font-weight:600;color:var(--gr-t2);margin-bottom:6px}
.gr-tag-list{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.gr-tag-item{display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:16px;background:var(--gr-bg2);font-size:12px}
.gr-tag-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.gr-tag-add{padding:8px;background:var(--gr-bg2);border-radius:var(--gr-r-sm);margin-top:6px}
.gr-clr-b-sm{width:20px;height:20px;border-radius:50%;border:2px solid transparent;cursor:pointer}.gr-clr-b-sm.on{border-color:var(--gr-text)}
.gr-todo-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--gr-brd)}
.gr-todo-cb{width:22px;height:22px;border-radius:50%;border:2px solid var(--gr-brd);display:flex;align-items:center;justify-content:center;cursor:pointer;background:none;flex-shrink:0}.gr-todo-cb.done{background:var(--gr-acc);border-color:var(--gr-acc)}
.gr-todo-text{flex:1;font-size:14px}.gr-todo-text.done{text-decoration:line-through;color:var(--gr-t3)}
.gr-todo-del{background:none;border:none;cursor:pointer;color:var(--gr-t3);padding:4px;display:flex}
.gr-todo-meta{display:flex;gap:6px;font-size:11px;color:var(--gr-t3);margin-top:2px;flex-wrap:wrap}
.gr-diary-card{padding:14px;border:1px solid var(--gr-brd);border-radius:var(--gr-r);margin-bottom:12px}
.gr-diary-author{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;margin-bottom:8px}
.gr-diary-images{display:flex;gap:6px;overflow-x:auto;margin-bottom:10px;padding-bottom:4px}.gr-diary-images::-webkit-scrollbar{height:0}
.gr-diary-img-wrap{flex-shrink:0;width:120px;height:120px;border-radius:8px;overflow:hidden}
.gr-diary-img{width:100%;height:100%;object-fit:cover}
.gr-diary-date{font-size:11px;color:var(--gr-t3);margin-top:6px}.gr-diary-title{font-size:14px;font-weight:600;margin-bottom:4px}.gr-diary-content{font-size:13px;color:var(--gr-t2);line-height:1.6}
.gr-diary-upload-area{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.gr-diary-upload-thumb{width:80px;height:80px;border-radius:8px;overflow:hidden;position:relative;flex-shrink:0}
.gr-thumb-upload{width:100%;height:120px;border:2px dashed var(--gr-brd);border-radius:var(--gr-r);display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;position:relative;margin-bottom:16px;transition:border-color var(--gr-tr)}.gr-thumb-upload:hover{border-color:var(--gr-acc)}
.gr-thumb-img{width:100%;height:100%;object-fit:cover}
.gr-thumb-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center}
.gr-thumb-remove{position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,.6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2}
.gr-diary-upload-remove{position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,.5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center}
.gr-diary-upload-add{width:80px;height:80px;border-radius:8px;border:2px dashed var(--gr-brd);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
.gr-budget-summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px}
.gr-budget-box{padding:14px 8px;border-radius:var(--gr-r);border:1px solid var(--gr-brd);text-align:center}.gr-budget-label{font-size:11px;color:var(--gr-t3);margin-bottom:4px}.gr-budget-val{font-size:16px;font-weight:700}
.gr-budget-row{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--gr-brd)}.gr-budget-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.gr-budget-info{flex:1}
@media(min-width:481px)and(max-width:1024px){:root{--gr-sidebar-w:320px}.gr-cal-cell{min-height:36px}}
@media(min-width:1025px){:root{--gr-sidebar-w:380px}.gr-cal-cell{min-height:44px}.gr-cal-d{width:32px;height:32px;font-size:14px}}
@media(max-width:480px){.gr-sidebar,.gr-panel{max-width:100vw}.gr-cal-cell{min-height:38px}}
.gr-myinfo-card{background:var(--gr-bg);border:1px solid var(--gr-brd);border-radius:var(--gr-r);padding:4px 16px;margin-bottom:4px}
.gr-myinfo-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--gr-brd)}.gr-myinfo-row:last-child{border-bottom:none}
.gr-myinfo-label{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--gr-text)}
.gr-myinfo-val{font-size:14px;color:var(--gr-text);display:flex;align-items:center;gap:4px}
.gr-loading-spinner{width:28px;height:28px;border:3px solid var(--gr-brd);border-top-color:var(--gr-acc);border-radius:50%;animation:gr-spin .6s linear infinite}
@keyframes gr-spin{to{transform:rotate(360deg)}}
.gr-login-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;font-family:var(--gr-ff);background:linear-gradient(135deg,#FFFEF5 0%,#FFF9DB 50%,#FFF3BF 100%);position:relative;overflow:hidden}
.gr-login-wrap::before{content:'';position:absolute;width:400px;height:400px;background:radial-gradient(circle,rgba(245,169,40,.2) 0%,transparent 70%);top:-100px;right:-100px;border-radius:50%}
.gr-login-wrap::after{content:'';position:absolute;width:300px;height:300px;background:radial-gradient(circle,rgba(59,130,246,.08) 0%,transparent 70%);bottom:-80px;left:-80px;border-radius:50%}
.gr-login-card{background:#fff;border-radius:20px;padding:40px 32px;width:100%;max-width:400px;box-shadow:0 8px 40px rgba(0,0,0,.06);position:relative;z-index:1}
.gr-login-logo{text-align:center;margin-bottom:32px}
.gr-login-logo-icon{width:64px;height:64px;background:var(--gr-acc);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:var(--gr-acc-text);margin:0 auto 12px;box-shadow:0 4px 12px rgba(254,229,0,.4)}
.gr-login-logo-text{font-size:28px;font-weight:800;letter-spacing:-1px;color:var(--gr-text)}.gr-login-logo-text span{color:var(--gr-acc)}
.gr-login-subtitle{font-size:13px;color:var(--gr-t3);margin-top:4px;letter-spacing:1px}
.gr-login-buttons{display:flex;flex-direction:column;gap:10px}
.gr-login-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:14px;border-radius:var(--gr-r);border:1px solid var(--gr-brd);font-size:14px;font-weight:600;cursor:pointer;font-family:var(--gr-ff);transition:all 150ms;background:#fff;color:var(--gr-text)}
.gr-login-btn:hover{box-shadow:0 2px 8px rgba(0,0,0,.08);transform:translateY(-1px)}
.gr-login-btn-email{background:var(--gr-text);color:#fff;border-color:var(--gr-text)}.gr-login-btn-email:hover{background:#333}
.gr-login-btn-google{background:#fff}.gr-login-btn-google:hover{background:#F8F9FA}
.gr-login-btn-kakao{background:#FEE500;border-color:#FEE500;color:#3C1E1E}.gr-login-btn-kakao:hover{background:#F5D800}
.gr-login-btn-pin{background:var(--gr-bg2);border-color:var(--gr-bg2);color:var(--gr-t2)}.gr-login-btn-pin:hover{background:#EFEFEF}
.gr-login-divider{display:flex;align-items:center;gap:12px;margin:6px 0;color:var(--gr-t3);font-size:12px}.gr-login-divider::before,.gr-login-divider::after{content:'';flex:1;height:1px;background:var(--gr-brd)}
.gr-login-footer{text-align:center;margin-top:20px;font-size:13px;color:var(--gr-t3)}
.gr-login-link{background:none;border:none;color:var(--gr-acc);font-weight:600;cursor:pointer;font-family:var(--gr-ff);font-size:13px}
.gr-login-back{position:absolute;top:16px;left:16px;background:none;border:none;cursor:pointer;color:var(--gr-t3);padding:4px;display:flex}
.gr-login-error{background:#FEF2F2;color:var(--gr-exp);padding:10px 14px;border-radius:var(--gr-r-sm);font-size:13px;margin-bottom:12px;text-align:center}
.gr-login-form{display:flex;flex-direction:column;gap:10px}
.gr-login-field{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--gr-brd);border-radius:var(--gr-r-sm);transition:border 150ms}
.gr-login-field:focus-within{border-color:var(--gr-acc)}
.gr-login-field input{flex:1;border:none;outline:none;font-size:14px;font-family:var(--gr-ff);background:transparent;color:var(--gr-text)}
.gr-login-field input::placeholder{color:#ccc}
.gr-login-submit{padding:14px;border-radius:var(--gr-r);border:none;background:var(--gr-acc);color:var(--gr-acc-text);font-size:15px;font-weight:700;cursor:pointer;font-family:var(--gr-ff);transition:all 150ms;margin-top:4px}.gr-login-submit:hover{background:var(--gr-acc-d)}.gr-login-submit:disabled{background:#eee;color:#bbb;cursor:default}
.gr-login-platform-badge{position:absolute;bottom:20px;font-size:12px;color:var(--gr-t3);z-index:1;background:rgba(255,255,255,.7);padding:4px 12px;border-radius:20px}
.gr-pin-dots{display:flex;justify-content:center;gap:12px;margin-bottom:24px}
.gr-pin-dot{width:14px;height:14px;border-radius:50%;border:2px solid var(--gr-brd);transition:all .2s}.gr-pin-dot.filled{background:var(--gr-text);border-color:var(--gr-text)}
.gr-pin-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:260px;margin:0 auto}
.gr-pin-key{width:100%;aspect-ratio:1.4;border:none;border-radius:var(--gr-r);font-size:22px;font-weight:600;cursor:pointer;font-family:var(--gr-ff);background:var(--gr-bg2);color:var(--gr-text);transition:all .1s}.gr-pin-key:active{background:var(--gr-brd);transform:scale(.95)}.gr-pin-key.empty{background:transparent;cursor:default}
`;
