const { useState, useEffect, useCallback, useMemo } = React;

// ═══════════════════════════════════════════════
// 구롬 (Goroom) — 웹/앱/데스크톱 통합 버전
// Supabase 연동 준비 완료 구조
// ═══════════════════════════════════════════════

// ─── SUPABASE CONFIG ───
const SUPABASE_URL = "https://dyotbojxtcqhcmrefofb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3Rib2p4dGNxaGNtcmVmb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU2NTIsImV4cCI6MjA5MDI5MTY1Mn0.dJp5-vqXoW_9s-Br2vyn8sx2fo2wDWpNWlr5tqgddqo";

// ─── SUPABASE CLIENT ───
const _sbHeaders = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };
let _sbToken = null;
const sbHeaders = () => _sbToken 
  ? { ..._sbHeaders, Authorization: `Bearer ${_sbToken}` }
  : _sbHeaders;

const SB = {
  // Auth
  async signUp(email, password, nickname) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST', headers: _sbHeaders,
      body: JSON.stringify({ email, password, data: { name: nickname } })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || data.msg || '회원가입 실패');
    if (data.access_token) _sbToken = data.access_token;
    return data;
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: _sbHeaders,
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error_description || data.msg || '로그인 실패');
    if (data.access_token) _sbToken = data.access_token;
    return data;
  },
  async signOut() { _sbToken = null; },
  async getUser(token) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { ..._sbHeaders, Authorization: `Bearer ${token}` }
    });
    return await res.json();
  },
  // DB helpers
  async select(table, userId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}&order=created_at.desc`, {
      headers: { ...sbHeaders(), Prefer: 'return=representation' }
    });
    return await res.json();
  },
  async upsert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST', headers: { ...sbHeaders(), Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },
  async delete(table, id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE', headers: sbHeaders()
    });
  }
};

// ─── STORAGE LAYER (Supabase + localStorage 캐시) ───
const Storage = {
  async load(userId) {
    try {
      // 로컬 캐시 먼저 로드 (빠른 표시)
      const cached = localStorage.getItem(`goroom-${userId}`);
      // 서버에서 최신 데이터 가져오기
      const [schedules, memos, settingsArr] = await Promise.all([
        SB.select('schedules', userId),
        SB.select('memos', userId),
        SB.select('user_settings', userId)
      ]);
      if (Array.isArray(schedules) && Array.isArray(memos)) {
        const settings = settingsArr?.[0] || {};
        const data = {
          schedules: schedules.map(s => ({
            ...s, date: s.date, budget: s.budget || null,
            todos: s.todos || [], repeat: s.repeat || null, alarm: s.alarm || null
          })),
          memos,
          settings: {
            schCats: settings.sch_cats || DEFAULTS.settings.schCats,
            expCats: settings.exp_cats || DEFAULTS.settings.expCats,
            incCats: settings.inc_cats || DEFAULTS.settings.incCats,
            pms: settings.payment_methods || DEFAULTS.settings.pms,
          }
        };
        localStorage.setItem(`goroom-${userId}`, JSON.stringify(data));
        return data;
      }
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Load error:', e);
      const cached = localStorage.getItem(`goroom-${userId}`);
      return cached ? JSON.parse(cached) : null;
    }
  },
  async save(userId, data) {
    try { localStorage.setItem(`goroom-${userId}`, JSON.stringify(data)); } catch {}
  },
  async saveSchedule(userId, schedule) {
    try {
      await SB.upsert('schedules', {
        id: schedule.id, user_id: userId, title: schedule.title, color: schedule.color,
        date: schedule.date, time: schedule.time || null, cat_id: schedule.catId,
        memo: schedule.memo || null, dday: schedule.dday || false,
        repeat: schedule.repeat, alarm: schedule.alarm, budget: schedule.budget,
        todos: schedule.todos || []
      });
    } catch (e) { console.error('Save schedule error:', e); }
  },
  async deleteSchedule(id) {
    try { await SB.delete('schedules', id); } catch (e) { console.error('Delete error:', e); }
  },
  async saveMemo(userId, memo) {
    try {
      await SB.upsert('memos', {
        id: memo.id, user_id: userId, title: memo.title, content: memo.content
      });
    } catch (e) { console.error('Save memo error:', e); }
  },
  async deleteMemo(id) {
    try { await SB.delete('memos', id); } catch (e) { console.error('Delete error:', e); }
  },
  async saveSettings(userId, settings) {
    try {
      await SB.upsert('user_settings', {
        user_id: userId,
        sch_cats: settings.schCats,
        exp_cats: settings.expCats,
        inc_cats: settings.incCats,
        payment_methods: settings.pms
      });
    } catch (e) { console.error('Save settings error:', e); }
  },
  async loadAuth() {
    try {
      const r = localStorage.getItem("goroom-auth");
      if (!r) return null;
      const auth = JSON.parse(r);
      // 토큰 복원
      if (auth.access_token) {
        _sbToken = auth.access_token;
        // 토큰 유효성 확인
        const user = await SB.getUser(auth.access_token);
        if (user?.id) return auth;
      }
      return null;
    } catch { return null; }
  },
  async saveAuth(auth) {
    try { localStorage.setItem("goroom-auth", JSON.stringify(auth)); } catch {}
  },
  async clearAuth() {
    try { localStorage.removeItem("goroom-auth"); _sbToken = null; } catch {}
  }
};

// ─── UTILS ───
const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtM = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const uid = () => Math.random().toString(36).slice(2,10);
const DAYS = ['일','월','화','수','목','금','토'];
const MO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const COLORS = ['#4A90D9','#F09819','#27AE60','#8E44AD','#E74C3C','#00B4D8','#95A5A6','#E91E63','#FF9800','#009688','#795548','#607D8B'];
const diffD = (a,b) => { const x=new Date(a.getFullYear(),a.getMonth(),a.getDate()), y=new Date(b.getFullYear(),b.getMonth(),b.getDate()); return Math.ceil((x-y)/864e5); };
const addMo = (d,n) => { const r=new Date(d); r.setMonth(r.getMonth()+n); return r; };

const DEFAULTS = {
  settings: {
    schCats:[{id:'sc1',name:'업무',color:'#4A90D9'},{id:'sc2',name:'개인',color:'#F09819'},{id:'sc3',name:'건강',color:'#27AE60'},{id:'sc4',name:'공부',color:'#8E44AD'},{id:'sc5',name:'소셜',color:'#00B4D8'},{id:'sc6',name:'기타',color:'#95A5A6'}],
    expCats:[{id:'ec1',name:'식비'},{id:'ec2',name:'교통'},{id:'ec3',name:'쇼핑'},{id:'ec4',name:'의료'},{id:'ec5',name:'문화'},{id:'ec6',name:'교육'},{id:'ec7',name:'주거'},{id:'ec8',name:'기타'}],
    incCats:[{id:'ic1',name:'급여'},{id:'ic2',name:'부수입'},{id:'ic3',name:'용돈'},{id:'ic4',name:'기타'}],
    pms:[{id:'pm1',type:'card',name:'신용카드'},{id:'pm2',type:'account',name:'계좌이체'},{id:'pm3',type:'cash',name:'현금'}],
  },
  schedules:[], memos:[]
};

function isRepeatOn(s,ds){
  if(!s.repeat||s.date===ds)return false;
  const o=new Date(s.date),t=new Date(ds);
  if(t<=o)return false;
  if(s.repeat.endDate&&t>new Date(s.repeat.endDate))return false;
  const dd=Math.round((t-o)/864e5);
  switch(s.repeat.type){
    case'daily':return dd%(s.repeat.interval||1)===0;
    case'weekly':return dd%(7*(s.repeat.interval||1))===0&&t.getDay()===o.getDay();
    case'monthly':return t.getDate()===o.getDate()&&((t.getFullYear()-o.getFullYear())*12+t.getMonth()-o.getMonth())%(s.repeat.interval||1)===0;
    case'yearly':return t.getDate()===o.getDate()&&t.getMonth()===o.getMonth();
    case'custom':return dd%(s.repeat.interval||1)===0;
    default:return false;
  }
}
function getSchsForDate(schs,ds){
  const r=[];
  schs.forEach(s=>{if(s.date===ds)r.push(s);else if(s.repeat&&isRepeatOn(s,ds))r.push({...s,_vDate:ds,_isRepeat:true});});
  return r.sort((a,b)=>(a.time||'99').localeCompare(b.time||'99'));
}

// ─── ICONS ───
const I=({n,size=20,color})=>{
  const s={width:size,height:size,display:'inline-block',verticalAlign:'middle'};
  const p={stroke:color||'currentColor',strokeWidth:2,fill:'none',strokeLinecap:'round',strokeLinejoin:'round'};
  const m={
    left:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="15 18 9 12 15 6"/></svg>,
    right:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="9 6 15 12 9 18"/></svg>,
    plus:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    back:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    cal:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    clock:<svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    wallet:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
    trash:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
    fire:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M12 2c0 4-4 6-4 10a4 4 0 008 0c0-4-4-6-4-10z"/></svg>,
    home:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    edit:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    gear:<svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    bell:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    repeat:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>,
    logout:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    user:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    mail:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 7 12 13 2 7"/></svg>,
    lock:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    pin:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  };
  return m[n]||null;
};

// ─── useWindowSize ───
function useWinW(){
  const [w,setW]=useState(typeof window!=='undefined'?window.innerWidth:400);
  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[]);
  return w;
}

// ═══════════════════════════════════════════════
// AUTH: 로그인 화면
// ═══════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('main'); // main, email-login, email-signup, pin
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
      const data = await SB.signIn(email, password);
      const user = { id: data.user.id, email: data.user.email, nickname: data.user.user_metadata?.name || email.split('@')[0], provider: 'email', access_token: data.access_token };
      await Storage.saveAuth(user);
      onLogin(user);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !nickname) return setError('모든 항목을 입력하세요');
    if (password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다');
    setLoading(true); setError('');
    try {
      const data = await SB.signUp(email, password, nickname);
      if (data.access_token) {
        const user = { id: data.user.id, email: data.user.email, nickname, provider: 'email', access_token: data.access_token };
        await Storage.saveAuth(user);
        onLogin(user);
      } else {
        setError('가입 완료! 이메일 인증 후 로그인해주세요.');
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleSocialLogin = (provider) => {
    setError(`${provider === 'google' ? '구글' : '카카오'} 로그인은 준비 중입니다. 이메일로 가입해주세요.`);
  };

  const handlePinLogin = () => {
    setError('PIN 로그인은 이메일 가입 후 설정에서 등록할 수 있습니다.');
  };

  // ─── Main Login Screen ───
  if (mode === 'main') return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">구</div>
          <div className="login-logo-text">구<span>롬</span></div>
          <div className="login-subtitle">스케줄 · 가계부 · 메모</div>
        </div>

        <div className="login-buttons">
          <button className="login-btn login-btn-email" onClick={() => setMode('email-login')}>
            <I n="mail" size={18}/> <span>이메일로 시작하기</span>
          </button>
          <button className="login-btn login-btn-google" onClick={() => handleSocialLogin('google')}>
            <svg style={{width:18,height:18}} viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span>구글로 시작하기</span>
          </button>
          <button className="login-btn login-btn-kakao" onClick={() => handleSocialLogin('kakao')}>
            <svg style={{width:18,height:18}} viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-1.18 4.36c-.1.36.32.64.64.43l5.08-3.35c.26.02.53.03.8.03 5.52 0 10-3.58 10-7.94S17.52 3 12 3z"/></svg>
            <span>카카오로 시작하기</span>
          </button>

          <div className="login-divider"><span>또는</span></div>

          <button className="login-btn login-btn-pin" onClick={() => setMode('pin')}>
            <I n="pin" size={18}/> <span>PIN 코드로 로그인</span>
          </button>
        </div>

        <div className="login-footer">
          아직 계정이 없나요? <button className="login-link" onClick={() => setMode('email-signup')}>회원가입</button>
        </div>
      </div>
      <div className="login-platform-badge">
        {window.innerWidth >= 768 ? '💻 데스크톱' : '📱 모바일'} · 모든 기기에서 동기화
      </div>
    </div>
  );

  // ─── Email Login ───
  if (mode === 'email-login') return (
    <div className="login-wrap">
      <div className="login-card">
        <button className="login-back" onClick={() => { setMode('main'); setError(''); }}><I n="back" size={20}/></button>
        <div className="login-logo" style={{marginBottom:24}}>
          <div className="login-logo-text" style={{fontSize:24}}>이메일 로그인</div>
        </div>
        {error && <div className="login-error">{error}</div>}
        <div className="login-form">
          <div className="login-field">
            <I n="mail" size={16} color="#999"/>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일 주소" autoFocus/>
          </div>
          <div className="login-field">
            <I n="lock" size={16} color="#999"/>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호" onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}/>
          </div>
          <button className="login-submit" onClick={handleEmailLogin} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>
        <div className="login-footer">
          계정이 없나요? <button className="login-link" onClick={() => { setMode('email-signup'); setError(''); }}>회원가입</button>
        </div>
      </div>
    </div>
  );

  // ─── Email Signup ───
  if (mode === 'email-signup') return (
    <div className="login-wrap">
      <div className="login-card">
        <button className="login-back" onClick={() => { setMode('main'); setError(''); }}><I n="back" size={20}/></button>
        <div className="login-logo" style={{marginBottom:24}}>
          <div className="login-logo-text" style={{fontSize:24}}>회원가입</div>
        </div>
        {error && <div className="login-error">{error}</div>}
        <div className="login-form">
          <div className="login-field">
            <I n="user" size={16} color="#999"/>
            <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="닉네임" autoFocus/>
          </div>
          <div className="login-field">
            <I n="mail" size={16} color="#999"/>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일 주소"/>
          </div>
          <div className="login-field">
            <I n="lock" size={16} color="#999"/>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호 (6자 이상)" onKeyDown={e => e.key === 'Enter' && handleEmailSignup()}/>
          </div>
          <button className="login-submit" onClick={handleEmailSignup} disabled={loading}>
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </div>
        <div className="login-footer">
          이미 계정이 있나요? <button className="login-link" onClick={() => { setMode('email-login'); setError(''); }}>로그인</button>
        </div>
      </div>
    </div>
  );

  // ─── PIN Login ───
  if (mode === 'pin') return (
    <div className="login-wrap">
      <div className="login-card">
        <button className="login-back" onClick={() => { setMode('main'); setError(''); setPin(''); }}><I n="back" size={20}/></button>
        <div className="login-logo" style={{marginBottom:24}}>
          <div className="login-logo-text" style={{fontSize:24}}>PIN 로그인</div>
          <div className="login-subtitle">4~6자리 숫자를 입력하세요</div>
        </div>
        {error && <div className="login-error">{error}</div>}
        <div className="pin-dots">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`}/>
          ))}
        </div>
        <div className="pin-pad">
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((v, i) => (
            <button key={i} className={`pin-key ${v === '' ? 'empty' : ''}`}
              onClick={() => {
                if (v === '⌫') setPin(p => p.slice(0, -1));
                else if (typeof v === 'number' && pin.length < 6) setPin(p => p + String(v));
              }}>
              {v}
            </button>
          ))}
        </div>
        <button className="login-submit" onClick={handlePinLogin} disabled={loading || pin.length < 4} style={{marginTop:16}}>
          {loading ? '확인 중...' : '확인'}
        </button>
      </div>
    </div>
  );

  return null;
}

// ═══════════════════════════════════════════════
// MAIN APP (기존 Goroom에 Auth 레이어 추가)
// ═══════════════════════════════════════════════
function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    Storage.loadAuth().then(u => {
      if (u) setUser(u);
      setAuthChecked(true);
    });
  }, []);

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => {
    SB.signOut();
    Storage.clearAuth();
    setUser(null);
  };

  if (!authChecked) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--ff)',color:'#999'}}>
      <style>{CSS}</style>
      <div className="loading-spinner"/>
    </div>
  );

  if (!user) return (
    <>
      <style>{CSS}</style>
      <LoginPage onLogin={handleLogin}/>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <Goroom user={user} onLogout={handleLogout}/>
    </>
  );
}

// ═══════════════════════════════════════════════
// GOROOM MAIN (기존 코드 + user/logout 통합)
// ═══════════════════════════════════════════════
function Goroom({ user, onLogout }){
  const [data,setData]=useState(DEFAULTS);
  const [ok,setOk]=useState(false);
  const [page,setPage]=useState('main');
  const [tab,setTab]=useState('dash');
  const [calTab,setCalTab]=useState('month');
  const [sel,setSel]=useState(new Date());
  const [nav,setNav]=useState(new Date());
  const [detId,setDetId]=useState(null);
  const [memoId,setMemoId]=useState(null);
  const today=useMemo(()=>new Date(),[]);
  const ww=useWinW();
  const isDesk=ww>=768;

  useEffect(()=>{Storage.load(user.id).then(d=>{if(d)setData({...DEFAULTS,...d,settings:{...DEFAULTS.settings,...(d.settings||{})}});setOk(true);});},[user.id]);
  useEffect(()=>{if(ok)Storage.save(user.id, data);},[data,ok]);

  const upd=useCallback((k,fn)=>setData(p=>({...p,[k]:fn(p[k])})),[]);
  const updS=useCallback(fn=>setData(p=>({...p,settings:fn(p.settings)})),[]);
  const go=(p,id)=>{setPage(p);setDetId(id||null);};
  const goMemo=id=>{setMemoId(id||null);setPage('memo-edit');};

  if(!ok)return<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--ff)',color:'#999'}}><div className="loading-spinner"/></div>;

  const navItems=[['home','dash','대시보드'],['cal','cal','캘린더'],['edit','memo','메모'],['wallet','budget','가계부'],['gear','settings','설정']];

  const overlay = page==='add'? <AddPage sel={sel} data={data} upd={upd} back={()=>go('main')} isDesk={isDesk}/>
    : page==='detail'? <DetailPage id={detId} data={data} upd={upd} back={()=>go('main')} isDesk={isDesk}/>
    : page==='memo-edit'? <MemoEdit id={memoId} data={data} upd={upd} back={()=>go('main')} isDesk={isDesk}/>
    : null;

  return(
    <div className={`gr ${isDesk?'desk':''}`}>
      {isDesk && page==='main' && <div className="sidebar">
        <div className="sb-logo">구<span>롬</span></div>
        <div className="sb-date">{today.getFullYear()}.{today.getMonth()+1}.{today.getDate()} {DAYS[today.getDay()]}</div>
        <div className="sb-user">
          <I n="user" size={14}/> <span>{user.nickname || user.email}</span>
        </div>
        <nav className="sb-nav">
          {navItems.map(([ic,id,lb])=>
            <button key={id} className={`sb-btn ${tab===id?'on':''}`} onClick={()=>setTab(id)}><I n={ic} size={18}/><span>{lb}</span></button>
          )}
        </nav>
        {tab!=='settings'&&<button className="sb-add" onClick={()=>tab==='memo'?goMemo(null):go('add')}><I n="plus" size={18}/> {tab==='memo'?'새 메모':'새 스케줄'}</button>}
        <button className="sb-logout" onClick={onLogout}><I n="logout" size={16}/> 로그아웃</button>
      </div>}

      {overlay && (isDesk
        ? <div className="desk-overlay"><div className="desk-panel">{overlay}</div></div>
        : overlay
      )}

      {page==='main' && <>
        {!isDesk && <div className="top">
          <div className="top-t">구롬</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button className="top-b" onClick={()=>{setSel(new Date());setNav(new Date());}}>오늘</button>
            <button className="top-b" onClick={onLogout}><I n="logout" size={18}/></button>
          </div>
        </div>}

        <div className={`main-area ${isDesk?'desk-main':''}`}>
          <div className="main-col">
            {tab==='dash'&&<Dash data={data} today={today} go={go} isDesk={isDesk} user={user}/>}
            {tab==='cal'&&<Cal data={data} sel={sel} setSel={setSel} nav={nav} setNav={setNav} today={today} go={go} calTab={calTab} setCalTab={setCalTab} isDesk={isDesk}/>}
            {tab==='memo'&&<MemoList data={data} upd={upd} goMemo={goMemo}/>}
            {tab==='budget'&&<BudgetTab data={data} sel={sel} setSel={setSel} go={go} isDesk={isDesk}/>}
            {tab==='settings'&&<Settings data={data} updS={updS}/>}
          </div>

          {isDesk && tab==='cal' && <div className="right-panel">
            <RightPanel data={data} sel={sel} today={today} go={go}/>
          </div>}
          {isDesk && tab==='dash' && <div className="right-panel">
            <DashRight data={data} today={today} go={go}/>
          </div>}
        </div>

        {!isDesk && <>
          {tab!=='settings'&&<button className="fab" onClick={()=>tab==='memo'?goMemo(null):go('add')}><I n="plus" size={24}/></button>}
          <div className="btab">
            {navItems.map(([ic,id,lb])=>
              <button key={id} className={`bt-b ${tab===id?'on':''}`} onClick={()=>setTab(id)}><I n={ic} size={20}/>{lb}</button>
            )}
          </div>
        </>}
      </>}
    </div>
  );
}

// ═══ RIGHT PANEL ═══
function RightPanel({data,sel,today,go}){
  const ds=fmt(sel), schs=getSchsForDate(data.schedules,ds);
  const isToday=fmt(today)===ds;
  return<div>
    <div className="rp-head"><h3>{sel.getMonth()+1}월 {sel.getDate()}일 {DAYS[sel.getDay()]}요일</h3>{isToday&&<span className="rp-today">오늘</span>}</div>
    <div className="rp-count">{schs.length}개의 스케줄</div>
    {schs.length===0?<div className="empty-sm">스케줄이 없습니다</div>:
      schs.map(s=><SchCard key={s.id+(s._vDate||'')} s={s} data={data} onClick={()=>go('detail',s.id)}/>)}
  </div>;
}
function DashRight({data,today,go}){
  const ddays=data.schedules.filter(s=>s.dday).map(s=>({...s,diff:diffD(new Date(s.date),today)})).filter(s=>s.diff>=0).sort((a,b)=>a.diff-b.diff).slice(0,8);
  return<div>
    <h3 className="rp-head" style={{marginBottom:12}}>D-day</h3>
    {ddays.length===0?<div className="empty-sm">D-day가 없습니다</div>:
      ddays.map(s=><div key={s.id} className="dday-row" onClick={()=>go('detail',s.id)}>
        <span className="dday-name">{s.title}</span><span className="dday-badge">{s.diff===0?'D-Day!':`D-${s.diff}`}</span>
      </div>)}
    <h3 className="rp-head" style={{marginTop:20,marginBottom:12}}>최근 메모</h3>
    {data.memos.length===0?<div className="empty-sm">메모가 없습니다</div>:
      [...data.memos].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,4).map(m=>
        <div key={m.id} style={{padding:'8px 0',borderBottom:'1px solid var(--brd)'}}>
          <div style={{fontWeight:600,fontSize:13}}>{m.title||'제목 없음'}</div>
          <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>{m.content?.slice(0,40)}</div>
        </div>
      )}
  </div>;
}

// ═══ DASHBOARD ═══
function Dash({data,today,go,isDesk,user}){
  const ds=fmt(today);
  const todaySchs=getSchsForDate(data.schedules,ds);
  const ms=fmtM(today);
  const mSchs=data.schedules.filter(s=>s.date?.startsWith(ms)&&s.budget);
  const inc=mSchs.filter(s=>s.budget.type==='income').reduce((a,s)=>a+s.budget.amount,0);
  const exp=mSchs.filter(s=>s.budget.type==='expense').reduce((a,s)=>a+s.budget.amount,0);

  return<div style={{padding:'16px 20px'}}>
    <div className="dash-welcome">안녕하세요, <strong>{user.nickname || '사용자'}</strong>님</div>
    <h2 className="sec-t">오늘의 스케줄</h2>
    {todaySchs.length===0?<div className="empty-sm">오늘 스케줄이 없습니다</div>:
      <div className={isDesk?'desk-grid':''}>{todaySchs.slice(0,6).map(s=><SchCard key={s.id+(s._vDate||'')} s={s} data={data} onClick={()=>go('detail',s.id)}/>)}</div>}
    {!isDesk && <>
      <h2 className="sec-t" style={{marginTop:20}}>다가오는 D-day</h2>
      {data.schedules.filter(s=>s.dday).map(s=>({...s,diff:diffD(new Date(s.date),today)})).filter(s=>s.diff>=0).sort((a,b)=>a.diff-b.diff).slice(0,5).map(s=>
        <div key={s.id} className="dday-row" onClick={()=>go('detail',s.id)}><span className="dday-name">{s.title}</span><span className="dday-badge">{s.diff===0?'D-Day!':`D-${s.diff}`}</span></div>
      )}
    </>}
    <h2 className="sec-t" style={{marginTop:20}}>이번 달 가계부</h2>
    <div className="dash-budget">
      <div className="db-box"><div className="db-l">수입</div><div className="db-v" style={{color:'var(--inc)'}}>+{inc.toLocaleString()}</div></div>
      <div className="db-box"><div className="db-l">지출</div><div className="db-v" style={{color:'var(--exp)'}}>-{exp.toLocaleString()}</div></div>
      <div className="db-box"><div className="db-l">잔액</div><div className="db-v" style={{color:inc-exp>=0?'var(--inc)':'var(--exp)'}}>{(inc-exp).toLocaleString()}</div></div>
    </div>
  </div>;
}

// ═══ CALENDAR ═══
function Cal({data,sel,setSel,nav,setNav,today,go,calTab,setCalTab,isDesk}){
  return<div>
    <div className="ctabs">{[['month','월'],['week','주'],['day','일'],['year','연']].map(([id,l])=>
      <button key={id} className={`ct ${calTab===id?'on':''}`} onClick={()=>setCalTab(id)}>{l}</button>
    )}</div>
    {calTab==='month'&&<MonthV nav={nav} setNav={setNav} sel={sel} setSel={setSel} data={data} today={today} go={go} isDesk={isDesk}/>}
    {calTab==='week'&&<WeekV sel={sel} data={data} today={today} go={go}/>}
    {calTab==='day'&&<DayV sel={sel} setSel={setSel} data={data} today={today} go={go}/>}
    {calTab==='year'&&<YearV nav={nav} setNav={setNav} data={data} today={today} setSel={setSel} setCalTab={setCalTab}/>}
  </div>;
}
function MonthV({nav,setNav,sel,setSel,data,today,go,isDesk}){
  const y=nav.getFullYear(),m=nav.getMonth(),fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),dip=new Date(y,m,0).getDate();
  const ts=fmt(today),ss=fmt(sel);
  const cells=[];
  for(let i=0;i<fd;i++)cells.push({d:dip-fd+i+1,o:true,dt:new Date(y,m-1,dip-fd+i+1)});
  for(let i=1;i<=dim;i++)cells.push({d:i,o:false,dt:new Date(y,m,i)});
  const rem=7-cells.length%7;if(rem<7)for(let i=1;i<=rem;i++)cells.push({d:i,o:true,dt:new Date(y,m+1,i)});
  const mv=d=>{const n=new Date(nav);n.setMonth(n.getMonth()+d);setNav(n);};
  const dots=ds=>getSchsForDate(data.schedules,ds).slice(0,3).map(s=>s.color||data.settings.schCats.find(c=>c.id===s.catId)?.color||'#95A5A6');
  const selSchs=getSchsForDate(data.schedules,ss);
  return<div>
    <div className="mnav"><button className="mn-b" onClick={()=>mv(-1)}><I n="left"/></button><h2>{y}년 {MO[m]}</h2><button className="mn-b" onClick={()=>mv(1)}><I n="right"/></button></div>
    <div className="chead">{DAYS.map(d=><span key={d}>{d}</span>)}</div>
    <div className={`cgrid ${isDesk?'cgrid-desk':''}`}>{cells.map((c,i)=>{
      const ds=fmt(c.dt),dd=dots(ds);
      return<div key={i} className={`cc ${c.o?'ot':''} ${ds===ts?'tod':''} ${ds===ss&&ds!==ts?'sel':''}`} onClick={()=>setSel(c.dt)}>
        <span className="dn">{c.d}</span>{dd.length>0&&<div className="dots">{dd.map((co,j)=><span key={j} style={{background:co}}/>)}</div>}
      </div>;
    })}</div>
    {!isDesk&&<><div className="day-h">{sel.getMonth()+1}월 {sel.getDate()}일 {DAYS[sel.getDay()]}요일</div>
      <div className="sl">{selSchs.length===0?<div className="empty-sm">스케줄이 없습니다</div>:
        selSchs.map(s=><SchCard key={s.id+(s._vDate||'')} s={s} data={data} onClick={()=>go('detail',s.id)}/>)}</div></>}
  </div>;
}
function WeekV({sel,data,today,go}){
  const st=new Date(sel);st.setDate(st.getDate()-st.getDay());
  const days=Array.from({length:7},(_,i)=>{const d=new Date(st);d.setDate(d.getDate()+i);return d;});
  const ts=fmt(today),hrs=Array.from({length:13},(_,i)=>i+7);
  return<div>
    <div className="whead">{days.map(d=>{const ds=fmt(d);return<div key={ds} className={`wd ${ds===ts?'wt':''}`}><div className="wdl">{DAYS[d.getDay()]}</div><div className="wdn">{d.getDate()}</div></div>;})}</div>
    {hrs.map(h=>{const evts=[];days.forEach(d=>{const ds=fmt(d);getSchsForDate(data.schedules,ds).filter(s=>s.time&&parseInt(s.time)===h).forEach(s=>evts.push(s));});
      return<div key={h} className="ws"><div className="wt-l">{String(h).padStart(2,'0')}:00</div><div className="we">{evts.map(e=><div key={e.id} className="wc" style={{background:(e.color||'#4A90D9')+'20',color:e.color||'#4A90D9'}} onClick={()=>go('detail',e.id)}>{e.title}</div>)}</div></div>;})}
  </div>;
}
function DayV({sel,setSel,data,today,go}){
  const ds=fmt(sel),schs=getSchsForDate(data.schedules,ds),it=fmt(today)===ds;
  const mv=d=>{const n=new Date(sel);n.setDate(n.getDate()+d);setSel(n);};
  return<div>
    <div className="mnav"><button className="mn-b" onClick={()=>mv(-1)}><I n="left"/></button><h2>{sel.getMonth()+1}월 {sel.getDate()}일 {DAYS[sel.getDay()]}요일{it&&<span style={{fontSize:12,color:'var(--acc)',marginLeft:6}}>오늘</span>}</h2><button className="mn-b" onClick={()=>mv(1)}><I n="right"/></button></div>
    <div className="sl">{schs.length===0?<div className="empty"><div className="empty-i">📅</div>스케줄이 없습니다</div>:
      schs.map(s=><SchCard key={s.id+(s._vDate||'')} s={s} data={data} onClick={()=>go('detail',s.id)}/>)}</div>
  </div>;
}
function YearV({nav,setNav,data,today,setSel,setCalTab}){
  const y=nav.getFullYear(),counts={};
  data.schedules.forEach(s=>{if(s.date?.startsWith(String(y)))counts[s.date]=(counts[s.date]||0)+1;});
  const gc=n=>!n?'var(--bg2)':n===1?'#FDDF68':n===2?'#FCC419':n<=4?'#F59F00':'#E67700';
  const sd=new Date(y,0,1).getDay(),wks=[];let cur=new Date(y,0,1-sd);
  for(let w=0;w<53;w++){const wk=[];for(let d=0;d<7;d++){wk.push(new Date(cur));cur.setDate(cur.getDate()+1);}wks.push(wk);}
  const mv=d=>{const n=new Date(nav);n.setFullYear(n.getFullYear()+d);setNav(n);};
  return<div>
    <div className="mnav"><button className="mn-b" onClick={()=>mv(-1)}><I n="left"/></button><h2>{y}년</h2><button className="mn-b" onClick={()=>mv(1)}><I n="right"/></button></div>
    <div className="hm"><div className="hm-g">{wks.map((wk,wi)=><div key={wi} className="hm-c">{wk.map((d,di)=>{const ds=fmt(d),c=counts[ds]||0;return<div key={di} className="hm-cl" style={{background:d.getFullYear()===y?gc(c):'transparent',cursor:d.getFullYear()===y?'pointer':'default'}} onClick={()=>{if(d.getFullYear()===y){setSel(d);setCalTab('day');}}}/>})}</div>)}</div>
      <div className="hm-lg">적음 {[0,1,2,3,5].map((n,i)=><div key={i} style={{width:11,height:11,borderRadius:2,background:gc(n),display:'inline-block'}}/>)} 많음</div>
    </div>
  </div>;
}

// ═══ SCHEDULE CARD ═══
function SchCard({s,data,onClick}){
  const cat=data.settings.schCats.find(c=>c.id===s.catId);
  const clr=s.color||cat?.color||'#95A5A6';
  const diff=s.dday?diffD(new Date(s.date),new Date()):null;
  const ddl=diff===null?null:diff===0?'D-Day':diff>0?`D-${diff}`:`D+${Math.abs(diff)}`;
  const td=s.todos?.filter(t=>t.done).length||0,tt=s.todos?.length||0;
  const inst=s.budget?.instGroupId?`${s.budget.instIndex}/${s.budget.instMonths}회`:null;
  return<div className="sc" onClick={onClick}>
    <div className="sc-bar" style={{background:clr}}/><div className="sc-body">
      <div className="sc-t">{s.title}{s._isRepeat&&<span className="sc-rp">🔄</span>}</div>
      <div className="sc-m">{s.time&&<span>{s.time}</span>}{cat&&<span>{cat.name}</span>}{s.alarm&&<span>🔔</span>}</div>
      <div className="sc-tags">
        {tt>0&&<span className="tg tg-todo">✓ {td}/{tt}</span>}
        {ddl&&<span className="tg tg-dd">{ddl}</span>}
        {s.budget&&<span className={`tg ${s.budget.type==='income'?'tg-inc':'tg-exp'}`}>{s.budget.type==='income'?'+':'-'}{s.budget.amount.toLocaleString()}원{inst&&` (${inst})`}</span>}
      </div>
    </div>
  </div>;
}

// ═══ MEMO ═══
function MemoList({data,upd,goMemo}){
  return<div style={{padding:'16px 20px'}}>
    <h2 className="sec-t">메모</h2>
    {data.memos.length===0?<div className="empty"><div className="empty-i">📝</div>메모를 추가해보세요</div>:
      <div className="memo-grid">{[...data.memos].sort((a,b)=>(b.updatedAt||b.createdAt)-(a.updatedAt||a.createdAt)).map(m=>
        <div key={m.id} className="memo-card" onClick={()=>goMemo(m.id)}>
          <div className="memo-t">{m.title||'제목 없음'}</div>
          <div className="memo-p">{m.content?.slice(0,80)||''}</div>
          <div className="memo-d">{new Date(m.updatedAt||m.createdAt).toLocaleDateString()}</div>
          <button className="memo-del" onClick={e=>{e.stopPropagation();upd('memos',arr=>arr.filter(x=>x.id!==m.id));}}><I n="trash" size={14}/></button>
        </div>
      )}</div>}
  </div>;
}
function MemoEdit({id,data,upd,back,isDesk}){
  const ex=id?data.memos.find(m=>m.id===id):null;
  const [title,setTitle]=useState(ex?.title||'');
  const [content,setContent]=useState(ex?.content||'');
  const save=()=>{
    if(!title.trim()&&!content.trim())return back();
    if(ex)upd('memos',arr=>arr.map(m=>m.id===id?{...m,title,content,updatedAt:Date.now()}:m));
    else upd('memos',arr=>[...arr,{id:uid(),title,content,createdAt:Date.now(),updatedAt:Date.now()}]);
    back();
  };
  return<div className={`add-pg ${isDesk?'desk-add':''}`}>
    <div className="top"><button className="top-b" onClick={save}><I n="back" size={20}/></button><div className="top-t">{ex?'메모 수정':'새 메모'}</div><button className="top-b" onClick={save} style={{color:'var(--acc)'}}>저장</button></div>
    <div className="add-sc">
      <input className="inp" value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목" style={{fontSize:18,fontWeight:600,border:'none',borderBottom:'2px solid var(--brd)',borderRadius:0,padding:'12px 0',marginBottom:16}} autoFocus/>
      <textarea className="inp" value={content} onChange={e=>setContent(e.target.value)} placeholder="내용을 입력하세요..." style={{resize:'none',minHeight:300,border:'none'}}/>
    </div>
  </div>;
}

// ═══ BUDGET ═══
function BudgetTab({data,sel,setSel,go,isDesk}){
  const ms=fmtM(sel);
  const mSchs=data.schedules.filter(s=>s.date?.startsWith(ms)&&s.budget);
  const inc=mSchs.filter(s=>s.budget.type==='income').reduce((a,s)=>a+s.budget.amount,0);
  const exp=mSchs.filter(s=>s.budget.type==='expense').reduce((a,s)=>a+s.budget.amount,0);
  const bal=inc-exp;
  const mv=d=>{const n=new Date(sel);n.setMonth(n.getMonth()+d);setSel(n);};
  const byPm={};mSchs.filter(s=>s.budget.type==='expense').forEach(s=>{const pm=data.settings.pms.find(p=>p.id===s.budget.pmId);const k=pm?.name||'기타';byPm[k]=(byPm[k]||0)+s.budget.amount;});
  const byCat={};mSchs.filter(s=>s.budget.type==='expense').forEach(s=>{const k=s.budget.bCatName||'기타';byCat[k]=(byCat[k]||0)+s.budget.amount;});
  return<div style={{padding:'8px 0'}}>
    <div className="mnav"><button className="mn-b" onClick={()=>mv(-1)}><I n="left"/></button><h2>{sel.getFullYear()}년 {MO[sel.getMonth()]}</h2><button className="mn-b" onClick={()=>mv(1)}><I n="right"/></button></div>
    <div className="dash-budget" style={{margin:'0 16px 12px'}}>
      <div className="db-box"><div className="db-l">수입</div><div className="db-v" style={{color:'var(--inc)'}}>+{inc.toLocaleString()}</div></div>
      <div className="db-box"><div className="db-l">지출</div><div className="db-v" style={{color:'var(--exp)'}}>-{exp.toLocaleString()}</div></div>
      <div className="db-box"><div className="db-l">잔액</div><div className="db-v" style={{color:bal>=0?'var(--inc)':'var(--exp)'}}>{bal>=0?'+':''}{bal.toLocaleString()}</div></div>
    </div>
    {isDesk && (Object.keys(byPm).length>0||Object.keys(byCat).length>0) && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:'0 16px',marginBottom:16}}>
      {Object.keys(byPm).length>0&&<div className="breakdown-box"><div className="bd-title">결제수단별</div>{Object.entries(byPm).map(([k,v])=><div key={k} className="bd-row"><span>{k}</span><span style={{fontWeight:600,color:'var(--exp)'}}>-{v.toLocaleString()}</span></div>)}</div>}
      {Object.keys(byCat).length>0&&<div className="breakdown-box"><div className="bd-title">카테고리별</div>{Object.entries(byCat).map(([k,v])=><div key={k} className="bd-row"><span>{k}</span><span style={{fontWeight:600,color:'var(--exp)'}}>-{v.toLocaleString()}</span></div>)}</div>}
    </div>}
    {!isDesk && Object.keys(byPm).length>0 && <div style={{padding:'0 16px',marginBottom:12}}>
      <div style={{fontSize:12,color:'var(--t3)',marginBottom:6}}>결제수단별 지출</div>
      {Object.entries(byPm).map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:13}}><span>{k}</span><span style={{fontWeight:600,color:'var(--exp)'}}>-{v.toLocaleString()}원</span></div>)}
    </div>}
    <div style={{padding:'0 16px'}}>
      {mSchs.length===0?<div className="empty"><div className="empty-i">💰</div>이 달의 내역이 없습니다</div>:
        [...mSchs].sort((a,b)=>b.date.localeCompare(a.date)).map(s=>{
          const pm=data.settings.pms.find(p=>p.id===s.budget.pmId);
          const inst=s.budget.instGroupId?` (${s.budget.instIndex}/${s.budget.instMonths}회)`:'';
          return<div key={s.id} className="b-row" onClick={()=>go('detail',s.id)}>
            <div className="b-dot" style={{background:s.budget.type==='income'?'var(--inc)':'var(--exp)'}}/><div className="b-info"><div className="b-t">{s.title}{inst}</div><div className="b-m">{s.date} · {pm?.name||''} · {s.budget.bCatName||''}</div></div>
            <div className="b-amt" style={{color:s.budget.type==='income'?'var(--inc)':'var(--exp)'}}>{s.budget.type==='income'?'+':'-'}{s.budget.amount.toLocaleString()}원</div>
          </div>;
        })}
    </div>
  </div>;
}

// ═══ SETTINGS ═══
function Settings({data,updS}){
  const [section,setSection]=useState(null);
  const [editId,setEditId]=useState(null);
  const [editVal,setEditVal]=useState('');
  const [editColor,setEditColor]=useState('#4A90D9');
  const [addVal,setAddVal]=useState('');
  const [addColor,setAddColor]=useState('#4A90D9');
  const [addType,setAddType]=useState('card');
  const sections=[{id:'schCats',label:'스케줄 카테고리',hasColor:true},{id:'expCats',label:'지출 카테고리'},{id:'incCats',label:'수입 카테고리'},{id:'pms',label:'결제수단',hasPmType:true}];
  const startEdit=(item,hasColor)=>{setEditId(item.id);setEditVal(item.name);if(hasColor)setEditColor(item.color||'#4A90D9');};
  const saveEdit=(key,hasColor)=>{if(!editVal.trim())return;updS(s=>({...s,[key]:s[key].map(x=>x.id===editId?{...x,name:editVal.trim(),...(hasColor?{color:editColor}:{})}:x)}));setEditId(null);};
  const del=(key,id)=>updS(s=>({...s,[key]:s[key].filter(x=>x.id!==id)}));
  const add=(key,hasColor,hasPmType)=>{if(!addVal.trim())return;updS(s=>({...s,[key]:[...s[key],{id:uid(),name:addVal.trim(),...(hasColor?{color:addColor}:{}),...(hasPmType?{type:addType}:{})}]}));setAddVal('');};

  if(section){
    const sec=sections.find(s=>s.id===section);
    const items=data.settings[section]||[];
    return<div style={{padding:'16px 20px'}}>
      <button className="top-b" onClick={()=>{setSection(null);setEditId(null);}} style={{marginBottom:12,display:'flex',alignItems:'center',gap:4}}><I n="back" size={18}/> 뒤로</button>
      <h2 className="sec-t">{sec.label}</h2>
      <div className="set-list">
        {items.map(item=>editId===item.id?(
          <div key={item.id} className="set-edit">
            {sec.hasColor&&<div className="clr-row" style={{marginBottom:6}}>{COLORS.map(c=><button key={c} className={`clr-b ${editColor===c?'on':''}`} style={{background:c}} onClick={()=>setEditColor(c)}/>)}</div>}
            <div style={{display:'flex',gap:6}}><input className="inp" value={editVal} onChange={e=>setEditVal(e.target.value)} style={{flex:1}} autoFocus onKeyDown={e=>e.key==='Enter'&&saveEdit(section,sec.hasColor)}/><button className="btn-p" onClick={()=>saveEdit(section,sec.hasColor)}>저장</button><button className="btn-g" onClick={()=>setEditId(null)}>취소</button></div>
          </div>
        ):(
          <div key={item.id} className="set-item">
            {sec.hasColor&&<span className="set-dot" style={{background:item.color}}/>}
            {sec.hasPmType&&<span className="tg" style={{fontSize:10,marginRight:4}}>{item.type==='card'?'카드':item.type==='account'?'계좌':'현금'}</span>}
            <span className="set-name">{item.name}</span>
            <div className="set-acts"><button className="btn-g" onClick={()=>startEdit(item,sec.hasColor)}>수정</button><button className="btn-d" onClick={()=>del(section,item.id)}>삭제</button></div>
          </div>
        ))}
      </div>
      <div className="set-add"><div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:8}}>추가</div>
        {sec.hasColor&&<div className="clr-row" style={{marginBottom:6}}>{COLORS.map(c=><button key={c} className={`clr-b ${addColor===c?'on':''}`} style={{background:c}} onClick={()=>setAddColor(c)}/>)}</div>}
        {sec.hasPmType&&<div className="pills" style={{marginBottom:8}}>{[['card','카드'],['account','계좌'],['cash','현금']].map(([k,v])=><button key={k} className={`pill ${addType===k?'on':''}`} style={addType===k?{background:'var(--text)',color:'#fff'}:{}} onClick={()=>setAddType(k)}>{v}</button>)}</div>}
        <div style={{display:'flex',gap:6}}><input className="inp" value={addVal} onChange={e=>setAddVal(e.target.value)} placeholder="이름 입력" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&add(section,sec.hasColor,sec.hasPmType)}/><button className="btn-p" onClick={()=>add(section,sec.hasColor,sec.hasPmType)}>추가</button></div>
      </div>
    </div>;
  }
  return<div style={{padding:'16px 20px'}}>
    <h2 className="sec-t">설정</h2>
    {sections.map(sec=><div key={sec.id} className="set-section" onClick={()=>setSection(sec.id)}>
      <span>{sec.label}</span><div style={{display:'flex',alignItems:'center',gap:4}}><span style={{fontSize:12,color:'var(--t3)'}}>{(data.settings[sec.id]||[]).length}개</span><I n="right" size={16} color="#999"/></div>
    </div>)}
    <div style={{marginTop:24,padding:16,borderRadius:'var(--r)',background:'var(--bg2)',fontSize:12,color:'var(--t3)',lineHeight:1.6}}>각 카테고리와 결제수단은 스케줄 등록 시 선택할 수 있습니다.</div>
  </div>;
}

// ═══ ADD PAGE ═══
function AddPage({sel,data,upd,back,isDesk}){
  const st=data.settings;
  const [title,setTitle]=useState('');
  const [color,setColor]=useState(st.schCats[0]?.color||'#4A90D9');
  const [date,setDate]=useState(fmt(sel));
  const [time,setTime]=useState('');
  const [catId,setCatId]=useState(st.schCats[0]?.id||'');
  const [memo,setMemo]=useState('');
  const [hasTodo,setHasTodo]=useState(false);
  const [hasDday,setHasDday]=useState(false);
  const [hasRepeat,setHasRepeat]=useState(false);
  const [hasAlarm,setHasAlarm]=useState(false);
  const [hasBudget,setHasBudget]=useState(false);
  const [todos,setTodos]=useState([{id:uid(),text:''}]);
  const [rpType,setRpType]=useState('daily');
  const [rpInterval,setRpInterval]=useState('1');
  const [rpEnd,setRpEnd]=useState('none');
  const [rpEndDate,setRpEndDate]=useState('');
  const [alBefore,setAlBefore]=useState('30m');
  const [alMsg,setAlMsg]=useState('');
  const [bType,setBType]=useState('expense');
  const [bAmt,setBAmt]=useState('');
  const [bCatId,setBCatId]=useState(st.expCats[0]?.id||'');
  const [bPmId,setBPmId]=useState(st.pms[0]?.id||'');
  const [bPayType,setBPayType]=useState('lump');
  const [bInstMonths,setBInstMonths]=useState('3');
  const [bIncStatus,setBIncStatus]=useState('deposited');
  const selPm=st.pms.find(p=>p.id===bPmId);
  const isCard=selPm?.type==='card';
  const canSave=title.trim().length>0;
  const selectCat=id=>{setCatId(id);const c=st.schCats.find(x=>x.id===id);if(c)setColor(c.color);};
  const handleSave=()=>{
    if(!canSave)return;
    const bCats=bType==='expense'?st.expCats:st.incCats;
    const bCatItem=bCats.find(c=>c.id===bCatId);
    const base={title:title.trim(),color,date,time,catId,memo,
      todos:hasTodo?todos.filter(t=>t.text.trim()).map(t=>({id:t.id,text:t.text.trim(),done:false})):[],
      dday:hasDday,
      repeat:hasRepeat?{type:rpType,interval:parseInt(rpInterval)||1,endDate:rpEnd==='date'?rpEndDate:null}:null,
      alarm:hasAlarm?{before:alBefore,message:alMsg}:null};
    if(hasBudget&&bAmt){
      const amt=Number(bAmt);
      if(isCard&&bPayType==='installment'&&parseInt(bInstMonths)>1){
        const months=parseInt(bInstMonths),per=Math.floor(amt/months),groupId=uid(),newSchs=[];
        for(let i=0;i<months;i++){const d=addMo(new Date(date),i);newSchs.push({...base,id:uid(),date:fmt(d),repeat:null,budget:{type:'expense',amount:i===months-1?amt-per*(months-1):per,catId:bCatId,bCatName:bCatItem?.name||'',pmId:bPmId,payType:'installment',instMonths:months,instIndex:i+1,instGroupId:groupId,incomeStatus:null},createdAt:Date.now()});}
        upd('schedules',arr=>[...arr,...newSchs]);
      }else{
        upd('schedules',arr=>[...arr,{...base,id:uid(),budget:{type:bType,amount:amt,catId:bCatId,bCatName:bCatItem?.name||'',pmId:bPmId,payType:isCard?'lump':null,instMonths:null,instIndex:null,instGroupId:null,incomeStatus:bType==='income'?bIncStatus:null},createdAt:Date.now()}]);
      }
    }else{upd('schedules',arr=>[...arr,{...base,id:uid(),budget:null,createdAt:Date.now()}]);}
    back();
  };
  return<div className={`add-pg ${isDesk?'desk-add':''}`}>
    <div className="top"><button className="top-b" onClick={back}><I n="back" size={20}/></button><div className="top-t">새 스케줄</div><div style={{width:28}}/></div>
    <div className="add-sc">
      <div style={{height:12}}/>
      <div className="field"><div className="clr-row" style={{marginBottom:8}}>{COLORS.map(c=><button key={c} className={`clr-b ${color===c?'on':''}`} style={{background:c}} onClick={()=>setColor(c)}/>)}</div>
        <input className="inp" value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목을 입력하세요" style={{fontSize:18,fontWeight:600,border:'none',borderBottom:'2px solid var(--brd)',borderRadius:0,padding:'12px 0'}} autoFocus/></div>
      <div style={{display:'flex',gap:8}}>
        <div className="field" style={{flex:1}}><div className="fl"><I n="cal" size={14}/> 날짜</div><input className="inp" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1}}><div className="fl"><I n="clock" size={14}/> 시간</div><input className="inp" type="time" value={time} onChange={e=>setTime(e.target.value)}/></div>
      </div>
      <div className="field"><div className="fl">스케줄 카테고리</div><div className="pills">{st.schCats.map(c=><button key={c.id} className={`pill ${catId===c.id?'on':''}`} style={catId===c.id?{background:c.color}:{}} onClick={()=>selectCat(c.id)}>{c.name}</button>)}</div></div>
      <div className="field"><div className="fl">메모</div><textarea className="inp" value={memo} onChange={e=>setMemo(e.target.value)} placeholder="메모 (선택)" rows={2} style={{resize:'none'}}/></div>
      <ToggleSection icon="check" iconColor="#3B82F6" label="할 일 체크리스트" on={hasTodo} toggle={()=>setHasTodo(!hasTodo)}>
        {todos.map(t=><div key={t.id} className="todo-r"><input className="todo-i" value={t.text} onChange={e=>setTodos(p=>p.map(x=>x.id===t.id?{...x,text:e.target.value}:x))} placeholder="할 일 입력" onKeyDown={e=>{if(e.key==='Enter')setTodos(p=>[...p,{id:uid(),text:''}]);}}/>{todos.length>1&&<button className="todo-d" onClick={()=>setTodos(p=>p.filter(x=>x.id!==t.id))}><I n="x" size={16}/></button>}</div>)}
        <button className="add-todo" onClick={()=>setTodos(p=>[...p,{id:uid(),text:''}])}>+ 할 일 추가</button>
      </ToggleSection>
      <ToggleSection icon="clock" iconColor="#F97316" label="D-day 카운트다운" on={hasDday} toggle={()=>setHasDday(!hasDday)}>
        <div style={{fontSize:13,color:'var(--t3)',padding:'4px 0'}}>설정한 날짜 기준으로 D-day가 자동 계산됩니다.</div>
      </ToggleSection>
      <ToggleSection icon="repeat" iconColor="#8B5CF6" label="반복" on={hasRepeat} toggle={()=>setHasRepeat(!hasRepeat)}>
        <div className="fl" style={{marginBottom:6}}>반복 유형</div>
        <div className="pills" style={{marginBottom:12}}>{[['daily','매일'],['weekly','매주'],['monthly','매월'],['yearly','매년'],['custom','직접입력']].map(([k,v])=><button key={k} className={`pill ${rpType===k?'on':''}`} style={rpType===k?{background:'var(--text)',color:'#fff'}:{}} onClick={()=>setRpType(k)}>{v}</button>)}</div>
        {rpType==='custom'&&<div className="field"><div className="fl">반복 간격 (일)</div><input className="inp" type="number" value={rpInterval} onChange={e=>setRpInterval(e.target.value)} placeholder="예: 3"/></div>}
        <div className="fl" style={{marginBottom:6}}>종료</div>
        <div className="pills"><button className={`pill ${rpEnd==='none'?'on':''}`} style={rpEnd==='none'?{background:'var(--text)',color:'#fff'}:{}} onClick={()=>setRpEnd('none')}>계속 반복</button><button className={`pill ${rpEnd==='date'?'on':''}`} style={rpEnd==='date'?{background:'var(--text)',color:'#fff'}:{}} onClick={()=>setRpEnd('date')}>종료일 선택</button></div>
        {rpEnd==='date'&&<input className="inp" type="date" value={rpEndDate} onChange={e=>setRpEndDate(e.target.value)} style={{marginTop:8}}/>}
      </ToggleSection>
      <ToggleSection icon="bell" iconColor="#EAB308" label="알람" on={hasAlarm} toggle={()=>setHasAlarm(!hasAlarm)}>
        <div className="fl" style={{marginBottom:6}}>알림 시간</div>
        <div className="pills" style={{marginBottom:12}}>{[['10m','10분 전'],['30m','30분 전'],['1h','1시간 전'],['1d','하루 전']].map(([k,v])=><button key={k} className={`pill ${alBefore===k?'on':''}`} style={alBefore===k?{background:'var(--text)',color:'#fff'}:{}} onClick={()=>setAlBefore(k)}>{v}</button>)}</div>
        <div className="field"><div className="fl">알림 메시지 (선택)</div><input className="inp" value={alMsg} onChange={e=>setAlMsg(e.target.value)} placeholder="예: 회의 준비하세요!"/></div>
      </ToggleSection>
      <ToggleSection icon="wallet" iconColor="#22C55E" label="가계부" on={hasBudget} toggle={()=>setHasBudget(!hasBudget)}>
        <div className="bt-row"><button className={`bt-b2 ${bType==='expense'?'on-e':''}`} onClick={()=>{setBType('expense');setBCatId(st.expCats[0]?.id||'');}}>지출</button><button className={`bt-b2 ${bType==='income'?'on-i':''}`} onClick={()=>{setBType('income');setBCatId(st.incCats[0]?.id||'');}}>수입</button></div>
        <div className="field"><div className="fl">금액 (원)</div><input className="inp" type="number" value={bAmt} onChange={e=>setBAmt(e.target.value)} placeholder="0" style={{fontSize:18,fontWeight:600}}/></div>
        <div className="field"><div className="fl">{bType==='expense'?'지출':'수입'} 카테고리</div><div className="pills">{(bType==='expense'?st.expCats:st.incCats).map(c=><button key={c.id} className={`pill ${bCatId===c.id?'on':''}`} style={bCatId===c.id?{background:'var(--text)',color:'#fff'}:{}} onClick={()=>setBCatId(c.id)}>{c.name}</button>)}</div></div>
        <div className="field"><div className="fl">결제수단</div><div className="pills">{st.pms.map(p=><button key={p.id} className={`pill ${bPmId===p.id?'on':''}`} style={bPmId===p.id?{background:'var(--text)',color:'#fff'}:{}} onClick={()=>{setBPmId(p.id);if(p.type!=='card')setBPayType('lump');}}>{p.type==='card'?'💳':p.type==='account'?'🏦':'💵'} {p.name}</button>)}</div></div>
        {bType==='expense'&&isCard&&<>
          <div className="field"><div className="fl">결제 방식</div><div className="bt-row"><button className={`bt-b2 ${bPayType==='lump'?'on-e':''}`} onClick={()=>setBPayType('lump')}>일시불</button><button className={`bt-b2 ${bPayType==='installment'?'on-e':''}`} onClick={()=>setBPayType('installment')}>할부</button></div></div>
          {bPayType==='installment'&&<div className="field"><div className="fl">할부 개월수</div><div className="pills">{['2','3','6','12'].map(m=><button key={m} className={`pill ${bInstMonths===m?'on':''}`} style={bInstMonths===m?{background:'var(--text)',color:'#fff'}:{}} onClick={()=>setBInstMonths(m)}>{m}개월</button>)}<input className="inp" type="number" value={bInstMonths} onChange={e=>setBInstMonths(e.target.value)} style={{width:80,padding:'6px 10px',fontSize:13}} placeholder="직접"/></div>
            {bAmt&&parseInt(bInstMonths)>1&&<div style={{fontSize:12,color:'var(--t3)',marginTop:6}}>월 {Math.floor(Number(bAmt)/parseInt(bInstMonths)).toLocaleString()}원씩 {bInstMonths}회 분할</div>}</div>}
        </>}
        {bType==='income'&&<div className="field"><div className="fl">입금 상태</div><div className="bt-row"><button className={`bt-b2 ${bIncStatus==='deposited'?'on-i':''}`} onClick={()=>setBIncStatus('deposited')}>입금완료</button><button className={`bt-b2 ${bIncStatus==='receivable'?'on-i':''}`} onClick={()=>setBIncStatus('receivable')}>미수금</button></div></div>}
      </ToggleSection>
      <div style={{height:20}}/>
    </div>
    <div className="save-bar"><button className="save-btn" disabled={!canSave} onClick={handleSave}>저장하기</button></div>
  </div>;
}

function ToggleSection({icon,iconColor,label,on,toggle,children}){
  return<><div className="stog" onClick={toggle}><div className="stog-l"><I n={icon} size={16} color={iconColor}/> {label}</div><button className={`tsw ${on?'on':'off'}`} onClick={e=>{e.stopPropagation();toggle();}}/></div>
    {on&&<div className="stog-body">{children}</div>}</>;
}

// ═══ DETAIL PAGE ═══
function DetailPage({id,data,upd,back,isDesk}){
  const sch=data.schedules.find(s=>s.id===id);
  if(!sch)return<div className={`add-pg ${isDesk?'desk-add':''}`}><div className="top"><button className="top-b" onClick={back}><I n="back"/></button><div className="top-t">상세</div><div style={{width:28}}/></div><div className="empty">스케줄을 찾을 수 없습니다</div></div>;
  const cat=data.settings.schCats.find(c=>c.id===sch.catId);
  const pm=sch.budget?data.settings.pms.find(p=>p.id===sch.budget.pmId):null;
  const today=new Date(),diff=sch.dday?diffD(new Date(sch.date),today):null;
  const ddl=diff===null?null:diff===0?'D-Day!':diff>0?`D-${diff}`:`D+${Math.abs(diff)}`;
  let instInfo=null;
  if(sch.budget?.instGroupId){const group=data.schedules.filter(s=>s.budget?.instGroupId===sch.budget.instGroupId);const total=group.reduce((a,s)=>a+s.budget.amount,0);const paid=group.filter(s=>new Date(s.date)<=today).reduce((a,s)=>a+s.budget.amount,0);instInfo={total,paid,remaining:total-paid,current:sch.budget.instIndex,months:sch.budget.instMonths,group};}
  const toggleTodo=tid=>upd('schedules',arr=>arr.map(s=>s.id!==id?s:{...s,todos:s.todos.map(t=>t.id===tid?{...t,done:!t.done}:t)}));
  const del=()=>{if(sch.budget?.instGroupId)upd('schedules',arr=>arr.filter(s=>s.budget?.instGroupId!==sch.budget.instGroupId));else upd('schedules',arr=>arr.filter(s=>s.id!==id));back();};
  const rpL={daily:'매일',weekly:'매주',monthly:'매월',yearly:'매년',custom:'직접설정'};
  const alL={'10m':'10분 전','30m':'30분 전','1h':'1시간 전','1d':'하루 전'};
  return<div className={`add-pg ${isDesk?'desk-add':''}`}>
    <div className="top"><button className="top-b" onClick={back}><I n="back" size={20}/></button><div className="top-t">상세</div><div style={{width:28}}/></div>
    <div className="add-sc" style={{padding:'16px 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}><div style={{width:6,height:32,borderRadius:3,background:sch.color||cat?.color||'#95A5A6'}}/><div><div style={{fontSize:20,fontWeight:700}}>{sch.title}</div><div style={{fontSize:13,color:'var(--t3)'}}>{cat?.name||'기타'}</div></div></div>
      <div className="det-s"><div className="det-l">일시</div><div className="det-v">{sch.date} {sch.time||''}</div></div>
      {sch.dday&&<div className="det-s"><div className="det-l">D-day</div><div style={{fontSize:28,fontWeight:800,color:diff===0?'var(--exp)':diff>0?'var(--acc)':'var(--t3)'}}>{ddl}</div></div>}
      {sch.repeat&&<div className="det-s"><div className="det-l">반복</div><div className="det-v">{rpL[sch.repeat.type]}{sch.repeat.type==='custom'?` (${sch.repeat.interval}일마다)`:''}{sch.repeat.endDate?` ~ ${sch.repeat.endDate}`:' (계속)'}</div></div>}
      {sch.alarm&&<div className="det-s"><div className="det-l">알람</div><div className="det-v">🔔 {alL[sch.alarm.before]||sch.alarm.before}{sch.alarm.message?` - ${sch.alarm.message}`:''}</div></div>}
      {sch.memo&&<div className="det-s"><div className="det-l">메모</div><div style={{fontSize:14,color:'var(--t2)',whiteSpace:'pre-wrap'}}>{sch.memo}</div></div>}
      {sch.todos?.length>0&&<div className="det-s"><div className="det-l">할 일 ({sch.todos.filter(t=>t.done).length}/{sch.todos.length})</div>{sch.todos.map(t=><div key={t.id} className="det-todo" onClick={()=>toggleTodo(t.id)}><div className={`det-cb ${t.done?'done':''}`}>{t.done&&<I n="check" size={12}/>}</div><span className={`det-tt ${t.done?'done':''}`}>{t.text}</span></div>)}</div>}
      {sch.budget&&<div className="det-s">
        <div className="det-l">가계부</div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <span className={`tg ${sch.budget.type==='income'?'tg-inc':'tg-exp'}`}>{sch.budget.type==='income'?'수입':'지출'}</span>
          <span style={{fontSize:18,fontWeight:700,color:sch.budget.type==='income'?'var(--inc)':'var(--exp)'}}>{sch.budget.type==='income'?'+':'-'}{sch.budget.amount.toLocaleString()}원</span>
          {sch.budget.bCatName&&<span className="tg">{sch.budget.bCatName}</span>}{pm&&<span className="tg">{pm.name}</span>}
          {sch.budget.incomeStatus&&<span className={`tg ${sch.budget.incomeStatus==='deposited'?'tg-inc':'tg-dd'}`}>{sch.budget.incomeStatus==='deposited'?'입금완료':'미수금'}</span>}
        </div>
        {instInfo&&<div style={{marginTop:10,padding:12,background:'var(--bg2)',borderRadius:'var(--r-sm)',fontSize:13}}>
          <div style={{fontWeight:600,marginBottom:4}}>할부 정보 ({instInfo.current}/{instInfo.months}회차)</div>
          <div>총 금액: {instInfo.total.toLocaleString()}원</div><div>납부 완료: {instInfo.paid.toLocaleString()}원</div>
          <div style={{fontWeight:600,color:'var(--exp)'}}>남은 금액: {instInfo.remaining.toLocaleString()}원</div>
          <div style={{marginTop:8,display:'flex',gap:3,flexWrap:'wrap'}}>{instInfo.group.sort((a,b)=>a.budget.instIndex-b.budget.instIndex).map(s=><div key={s.id} style={{width:24,height:24,borderRadius:4,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',background:new Date(s.date)<=new Date()?'var(--kakao)':'var(--brd)',color:'var(--text)',fontWeight:600}}>{s.budget.instIndex}</div>)}</div>
        </div>}
      </div>}
      <button className="del-btn" onClick={del}><I n="trash" size={16}/> {sch.budget?.instGroupId?'할부 전체 삭제':'삭제'}</button>
    </div>
  </div>;
}

// ═══ CSS ═══
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap');
:root{--ff:'Noto Sans KR',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;--bg:#FFF;--bg2:#F6F6F6;--brd:#EEE;--text:#191919;--t2:#666;--t3:#999;--kakao:#FEE500;--kakao-d:#F5D800;--acc:#3B82F6;--inc:#3182F6;--exp:#F04452;--suc:#34C759;--r:12px;--r-sm:8px;--sh:0 1px 3px rgba(0,0,0,.06);--tr:150ms ease}
*{margin:0;padding:0;box-sizing:border-box}

/* ═══ LOADING ═══ */
.loading-spinner{width:28px;height:28px;border:3px solid var(--brd);border-top-color:var(--kakao);border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* ═══ LOGIN ═══ */
.login-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;font-family:var(--ff);background:linear-gradient(135deg,#FFFEF5 0%,#FFF9DB 50%,#FFF3BF 100%);position:relative;overflow:hidden}
.login-wrap::before{content:'';position:absolute;width:400px;height:400px;background:radial-gradient(circle,rgba(254,229,0,.2) 0%,transparent 70%);top:-100px;right:-100px;border-radius:50%}
.login-wrap::after{content:'';position:absolute;width:300px;height:300px;background:radial-gradient(circle,rgba(59,130,246,.08) 0%,transparent 70%);bottom:-80px;left:-80px;border-radius:50%}
.login-card{background:#fff;border-radius:20px;padding:40px 32px;width:100%;max-width:400px;box-shadow:0 8px 40px rgba(0,0,0,.06);position:relative;z-index:1}
.login-logo{text-align:center;margin-bottom:32px}
.login-logo-icon{width:64px;height:64px;background:var(--kakao);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:var(--text);margin:0 auto 12px;box-shadow:0 4px 12px rgba(254,229,0,.4)}
.login-logo-text{font-size:28px;font-weight:800;letter-spacing:-1px;color:var(--text)}.login-logo-text span{color:var(--acc)}
.login-subtitle{font-size:13px;color:var(--t3);margin-top:4px;letter-spacing:1px}
.login-buttons{display:flex;flex-direction:column;gap:10px}
.login-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:14px;border-radius:var(--r);border:1px solid var(--brd);font-size:14px;font-weight:600;cursor:pointer;font-family:var(--ff);transition:all var(--tr);background:#fff;color:var(--text)}
.login-btn:hover{box-shadow:0 2px 8px rgba(0,0,0,.08);transform:translateY(-1px)}
.login-btn-email{background:var(--text);color:#fff;border-color:var(--text)}.login-btn-email:hover{background:#333}
.login-btn-google{background:#fff}.login-btn-google:hover{background:#F8F9FA}
.login-btn-kakao{background:#FEE500;border-color:#FEE500;color:#3C1E1E}.login-btn-kakao:hover{background:#F5D800}
.login-btn-pin{background:var(--bg2);border-color:var(--bg2);color:var(--t2)}.login-btn-pin:hover{background:#EFEFEF}
.login-divider{display:flex;align-items:center;gap:12px;margin:6px 0;color:var(--t3);font-size:12px}.login-divider::before,.login-divider::after{content:'';flex:1;height:1px;background:var(--brd)}
.login-footer{text-align:center;margin-top:20px;font-size:13px;color:var(--t3)}
.login-link{background:none;border:none;color:var(--acc);font-weight:600;cursor:pointer;font-family:var(--ff);font-size:13px}
.login-back{position:absolute;top:16px;left:16px;background:none;border:none;cursor:pointer;color:var(--t3);padding:4px;display:flex}
.login-error{background:#FEF2F2;color:var(--exp);padding:10px 14px;border-radius:var(--r-sm);font-size:13px;margin-bottom:12px;text-align:center}
.login-form{display:flex;flex-direction:column;gap:10px}
.login-field{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--brd);border-radius:var(--r-sm);transition:border var(--tr)}
.login-field:focus-within{border-color:var(--kakao-d)}
.login-field input{flex:1;border:none;outline:none;font-size:14px;font-family:var(--ff);background:transparent;color:var(--text)}
.login-field input::placeholder{color:#ccc}
.login-submit{padding:14px;border-radius:var(--r);border:none;background:var(--kakao);color:var(--text);font-size:15px;font-weight:700;cursor:pointer;font-family:var(--ff);transition:all var(--tr);margin-top:4px}.login-submit:hover{background:var(--kakao-d)}.login-submit:disabled{background:#eee;color:#bbb;cursor:default}
.login-platform-badge{position:absolute;bottom:20px;font-size:12px;color:var(--t3);z-index:1;background:rgba(255,255,255,.7);padding:4px 12px;border-radius:20px}

/* PIN pad */
.pin-dots{display:flex;justify-content:center;gap:12px;margin-bottom:24px}
.pin-dot{width:14px;height:14px;border-radius:50%;border:2px solid var(--brd);transition:all .2s}.pin-dot.filled{background:var(--text);border-color:var(--text)}
.pin-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:260px;margin:0 auto}
.pin-key{width:100%;aspect-ratio:1.4;border:none;border-radius:var(--r);font-size:22px;font-weight:600;cursor:pointer;font-family:var(--ff);background:var(--bg2);color:var(--text);transition:all .1s}.pin-key:active{background:var(--brd);transform:scale(.95)}.pin-key.empty{background:transparent;cursor:default}

/* ═══ MAIN APP ═══ */
.gr{font-family:var(--ff);color:var(--text);background:var(--bg);height:100vh;display:flex;flex-direction:column;overflow:hidden;font-size:14px;line-height:1.5;position:relative}
.gr:not(.desk){max-width:480px;margin:0 auto}
.gr.desk{flex-direction:row}
.sidebar{width:220px;border-right:1px solid var(--brd);display:flex;flex-direction:column;padding:20px 0;flex-shrink:0;background:var(--bg)}
.sb-logo{font-size:22px;font-weight:800;padding:0 20px;margin-bottom:4px;letter-spacing:-0.5px}.sb-logo span{color:var(--acc)}
.sb-date{font-size:12px;color:var(--t3);padding:0 20px;margin-bottom:8px}
.sb-user{font-size:12px;color:var(--t2);padding:0 20px;margin-bottom:20px;display:flex;align-items:center;gap:6px;background:var(--bg2);margin-left:12px;margin-right:12px;padding:8px 12px;border-radius:var(--r-sm)}
.sb-nav{display:flex;flex-direction:column;gap:2px;padding:0 8px;flex:1}
.sb-btn{display:flex;align-items:center;gap:10px;padding:10px 14px;border:none;background:none;border-radius:var(--r-sm);cursor:pointer;font-size:14px;color:var(--t2);font-family:var(--ff);transition:all var(--tr);text-align:left}
.sb-btn:hover{background:var(--bg2)}.sb-btn.on{background:var(--kakao);color:var(--text);font-weight:600}
.sb-add{margin:0 12px 8px;padding:10px;border-radius:var(--r-sm);border:none;background:var(--text);color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--ff);display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity var(--tr)}.sb-add:hover{opacity:.85}
.sb-logout{margin:0 12px;padding:8px 14px;border:none;background:none;border-radius:var(--r-sm);cursor:pointer;font-size:12px;color:var(--t3);font-family:var(--ff);display:flex;align-items:center;gap:8px;transition:all var(--tr)}.sb-logout:hover{background:var(--bg2);color:var(--exp)}
.dash-welcome{font-size:14px;color:var(--t2);margin-bottom:16px}
.desk-overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:100;display:flex;align-items:center;justify-content:center}
.desk-panel{background:var(--bg);border-radius:16px;width:520px;max-height:90vh;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.15);display:flex;flex-direction:column}
.desk-panel .add-pg{height:auto;max-height:90vh}.desk-panel .add-sc{max-height:calc(90vh - 120px)}
.desk-main{display:flex;flex:1;overflow:hidden}
.main-col{flex:1;overflow-y:auto}.main-col::-webkit-scrollbar{width:4px}.main-col::-webkit-scrollbar-thumb{background:var(--brd);border-radius:4px}
.right-panel{width:320px;border-left:1px solid var(--brd);padding:20px;overflow-y:auto;flex-shrink:0}
.right-panel::-webkit-scrollbar{width:4px}.right-panel::-webkit-scrollbar-thumb{background:var(--brd);border-radius:4px}
.rp-head{font-size:16px;font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:8px}
.rp-today{font-size:11px;background:var(--kakao);padding:2px 8px;border-radius:10px;font-weight:600}
.rp-count{font-size:12px;color:var(--t3);margin-bottom:12px}
.desk-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cgrid-desk{gap:4px}.cgrid-desk .cc{min-height:56px}
.breakdown-box{padding:12px;border-radius:var(--r);border:1px solid var(--brd)}
.bd-title{font-size:12px;color:var(--t3);margin-bottom:6px;font-weight:600}
.bd-row{display:flex;justify-content:space-between;padding:3px 0;font-size:13px}
.memo-grid{display:grid;gap:8px}
@media(min-width:768px){.memo-grid{grid-template-columns:1fr 1fr}}
.top{padding:12px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-bottom:1px solid var(--brd);background:var(--bg)}.top-t{font-size:18px;font-weight:700}.top-b{background:none;border:none;cursor:pointer;color:var(--t2);padding:4px;display:flex;align-items:center;font-family:var(--ff);font-size:13px;font-weight:500}
.main-area{flex:1;overflow:hidden;display:flex;flex-direction:column}
.main-area:not(.desk-main){overflow-y:auto}
.content{flex:1;overflow-y:auto}.content::-webkit-scrollbar{width:0}
.ctabs{display:flex;padding:8px 20px;gap:4px;background:var(--bg);flex-shrink:0}
.ct{padding:6px 16px;border-radius:20px;border:none;font-size:13px;cursor:pointer;font-family:var(--ff);font-weight:500;color:var(--t3);background:none;transition:all var(--tr)}.ct.on{background:var(--kakao);color:var(--text);font-weight:600}
.mnav{display:flex;align-items:center;justify-content:center;gap:16px;padding:8px 20px}.mnav h2{font-size:16px;font-weight:700;min-width:120px;text-align:center}
.mn-b{background:none;border:none;cursor:pointer;color:var(--t3);padding:4px;display:flex;border-radius:50%;transition:background var(--tr)}.mn-b:hover{background:var(--bg2)}
.chead{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;padding:0 16px}
.chead span{font-size:12px;color:var(--t3);padding:8px 0;font-weight:500}.chead span:first-child{color:var(--exp)}.chead span:last-child{color:var(--acc)}
.cgrid{display:grid;grid-template-columns:repeat(7,1fr);padding:0 16px;gap:2px}
.cc{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:12px;cursor:pointer;transition:background var(--tr);position:relative;gap:2px;min-height:44px}.cc:hover{background:var(--bg2)}
.cc .dn{font-size:13px;font-weight:500;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%}
.cc.tod .dn{background:var(--kakao);color:var(--text);font-weight:700}.cc.sel .dn{outline:2px solid var(--text)}.cc.ot{opacity:.25}
.dots{display:flex;gap:2px}.dots span{width:4px;height:4px;border-radius:50%}
.day-h{padding:16px 20px 8px;font-size:13px;color:var(--t3);font-weight:500}.sl{padding:0 16px}
.sc{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:var(--bg);border-radius:var(--r);margin-bottom:6px;border:1px solid var(--brd);cursor:pointer;transition:all var(--tr)}.sc:hover{border-color:#ddd;box-shadow:var(--sh)}
.sc-bar{width:4px;min-height:36px;border-radius:2px;flex-shrink:0;margin-top:2px}.sc-body{flex:1;min-width:0}
.sc-t{font-size:14px;font-weight:600;margin-bottom:2px}.sc-rp{font-size:12px;margin-left:4px}
.sc-m{font-size:12px;color:var(--t3);display:flex;flex-wrap:wrap;gap:8px}
.sc-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}
.tg{font-size:11px;padding:2px 8px;border-radius:10px;background:var(--bg2);color:var(--t2)}
.tg-todo{background:#EFF6FF;color:#3B82F6}.tg-dd{background:#FFF7ED;color:#F97316}.tg-inc{background:#F0FDF4;color:#22C55E}.tg-exp{background:#FEF2F2;color:#EF4444}
.btab{display:flex;border-top:1px solid var(--brd);flex-shrink:0;background:var(--bg)}
.bt-b{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0 10px;border:none;background:none;cursor:pointer;font-size:10px;color:var(--t3);font-family:var(--ff);transition:color var(--tr)}.bt-b.on{color:var(--text)}.bt-b.on svg{stroke:var(--text)}
.fab{position:absolute;bottom:68px;right:20px;width:52px;height:52px;border-radius:50%;background:var(--kakao);border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;z-index:50;color:var(--text)}
.add-pg{display:flex;flex-direction:column;height:100%}.desk-add{height:auto}
.add-sc{flex:1;overflow-y:auto;padding:0 20px 20px}.add-sc::-webkit-scrollbar{width:0}
.field{margin-bottom:16px}.fl{font-size:13px;font-weight:600;color:var(--t2);margin-bottom:8px;display:flex;align-items:center;gap:6px}
.inp{width:100%;padding:12px 14px;border:1px solid var(--brd);border-radius:var(--r-sm);font-size:15px;font-family:var(--ff);outline:none;transition:border var(--tr);background:var(--bg);color:var(--text)}.inp:focus{border-color:var(--kakao-d)}.inp::placeholder{color:#ccc}
.stog{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-top:1px solid var(--brd);cursor:pointer}
.stog-l{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600}
.stog-body{padding:0 0 14px;border-left:3px solid var(--brd);margin-left:8px;padding-left:16px}
.tsw{width:44px;height:26px;border-radius:13px;border:none;cursor:pointer;position:relative;transition:background var(--tr);padding:0}
.tsw.off{background:#DDD}.tsw.on{background:var(--kakao)}
.tsw::after{content:'';position:absolute;width:22px;height:22px;border-radius:50%;background:#fff;top:2px;transition:left var(--tr);box-shadow:0 1px 3px rgba(0,0,0,.15)}
.tsw.off::after{left:2px}.tsw.on::after{left:20px}
.pills{display:flex;flex-wrap:wrap;gap:6px}
.pill{padding:6px 14px;border-radius:20px;border:1px solid var(--brd);font-size:13px;cursor:pointer;background:var(--bg);color:var(--t2);font-family:var(--ff);transition:all var(--tr)}.pill.on{border-color:transparent;color:#fff}
.bt-row{display:flex;gap:6px;margin-bottom:12px}
.bt-b2{flex:1;padding:10px;border-radius:var(--r-sm);border:1px solid var(--brd);font-size:14px;font-weight:600;cursor:pointer;text-align:center;background:var(--bg);font-family:var(--ff);transition:all var(--tr)}
.bt-b2.on-e{background:#FEF2F2;border-color:var(--exp);color:var(--exp)}.bt-b2.on-i{background:#EFF6FF;border-color:var(--inc);color:var(--inc)}
.todo-r{display:flex;gap:8px;align-items:center;margin-bottom:6px}
.todo-i{flex:1;padding:8px 12px;border:1px solid var(--brd);border-radius:var(--r-sm);font-size:13px;font-family:var(--ff);outline:none}.todo-i:focus{border-color:var(--kakao-d)}
.todo-d{background:none;border:none;cursor:pointer;color:var(--t3);padding:4px;display:flex}
.add-todo{background:none;border:1px dashed var(--brd);border-radius:var(--r-sm);padding:8px;width:100%;cursor:pointer;color:var(--t3);font-size:13px;font-family:var(--ff);transition:all var(--tr)}.add-todo:hover{border-color:#bbb}
.save-bar{padding:12px 20px;border-top:1px solid var(--brd);flex-shrink:0;background:var(--bg)}
.save-btn{width:100%;padding:14px;border-radius:var(--r);border:none;background:var(--kakao);color:var(--text);font-size:15px;font-weight:700;cursor:pointer;font-family:var(--ff);transition:background var(--tr)}.save-btn:hover{background:var(--kakao-d)}.save-btn:disabled{background:#eee;color:#bbb;cursor:default}
.clr-row{display:flex;gap:6px;flex-wrap:wrap}
.clr-b{width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:all var(--tr)}.clr-b.on{border-color:var(--text);box-shadow:0 0 0 2px #fff inset}
.whead{display:flex;padding:8px 16px;gap:2px}
.wd{flex:1;text-align:center;padding:8px 0;border-radius:var(--r-sm)}.wd .wdl{font-size:11px;color:var(--t3)}.wd .wdn{font-size:16px;font-weight:600;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:2px auto}.wd.wt .wdn{background:var(--kakao)}
.ws{display:grid;grid-template-columns:48px 1fr;border-bottom:1px solid var(--brd);min-height:52px}.wt-l{font-size:11px;color:var(--t3);text-align:right;padding:4px 8px 0 0}.we{padding:4px;display:flex;flex-wrap:wrap;gap:4px}
.wc{font-size:11px;padding:2px 8px;border-radius:4px;white-space:nowrap;cursor:pointer}
.hm{padding:0 16px;overflow-x:auto}.hm-g{display:flex;gap:2px}.hm-c{display:flex;flex-direction:column;gap:2px}.hm-cl{width:11px;height:11px;border-radius:2px}
.hm-lg{display:flex;align-items:center;gap:3px;margin-top:8px;font-size:10px;color:var(--t3)}
.sec-t{font-size:18px;font-weight:700;margin-bottom:12px}
.empty{text-align:center;padding:48px 20px;color:var(--t3)}.empty-i{font-size:36px;margin-bottom:8px}.empty-sm{text-align:center;padding:20px;color:var(--t3);font-size:13px}
.dday-row{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border:1px solid var(--brd);border-radius:var(--r-sm);margin-bottom:6px;cursor:pointer;transition:all var(--tr)}.dday-row:hover{border-color:#ddd}
.dday-name{font-weight:500}.dday-badge{font-size:14px;font-weight:800;color:var(--acc)}
.dash-budget{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.db-box{padding:14px 12px;border-radius:var(--r);border:1px solid var(--brd);text-align:center}.db-l{font-size:11px;color:var(--t3);margin-bottom:4px}.db-v{font-size:16px;font-weight:700}
.b-row{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--brd);cursor:pointer}
.b-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.b-info{flex:1}.b-t{font-size:14px;font-weight:500}.b-m{font-size:11px;color:var(--t3)}.b-amt{font-size:14px;font-weight:700}
.det-s{padding:12px 0;border-bottom:1px solid var(--brd)}.det-s:last-child{border:none}.det-l{font-size:12px;color:var(--t3);margin-bottom:4px}.det-v{font-size:15px;font-weight:500}
.det-todo{display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer}
.det-cb{width:20px;height:20px;border-radius:50%;border:2px solid var(--brd);display:flex;align-items:center;justify-content:center;transition:all var(--tr);flex-shrink:0}
.det-cb.done{background:var(--kakao);border-color:var(--kakao-d)}.det-tt{font-size:14px}.det-tt.done{text-decoration:line-through;color:var(--t3)}
.del-btn{width:100%;padding:12px;border-radius:var(--r-sm);border:1px solid var(--exp);background:none;color:var(--exp);font-size:14px;font-weight:600;cursor:pointer;font-family:var(--ff);margin-top:12px;transition:all var(--tr)}.del-btn:hover{background:#FEF2F2}
.memo-card{padding:14px;border:1px solid var(--brd);border-radius:var(--r);cursor:pointer;position:relative;transition:all var(--tr)}.memo-card:hover{border-color:#ddd}
.memo-t{font-size:14px;font-weight:600;margin-bottom:2px}.memo-p{font-size:12px;color:var(--t3);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.memo-d{font-size:11px;color:var(--t3)}.memo-del{position:absolute;top:10px;right:10px;background:none;border:none;cursor:pointer;color:var(--t3);padding:4px;display:flex;opacity:0;transition:opacity var(--tr)}.memo-card:hover .memo-del{opacity:1}
.set-section{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid var(--brd);cursor:pointer;font-size:15px;font-weight:500}
.set-list{margin-bottom:20px}.set-item{display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--brd)}
.set-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}.set-name{flex:1;font-size:14px}
.set-acts{display:flex;gap:4px}.set-edit{padding:10px 0;border-bottom:1px solid var(--brd)}
.set-add{padding:16px;background:var(--bg2);border-radius:var(--r);margin-top:12px}
.btn-p{padding:8px 16px;border-radius:var(--r-sm);border:none;background:var(--kakao);color:var(--text);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--ff)}
.btn-g{padding:6px 12px;border-radius:var(--r-sm);border:1px solid var(--brd);background:var(--bg);color:var(--t2);font-size:12px;cursor:pointer;font-family:var(--ff)}
.btn-d{padding:6px 12px;border-radius:var(--r-sm);border:1px solid var(--exp);background:none;color:var(--exp);font-size:12px;cursor:pointer;font-family:var(--ff)}
`;
