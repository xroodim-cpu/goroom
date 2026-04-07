import { useState } from 'react';
import { supabase } from '../supabase';
import I from '../components/shared/Icon';

export default function LoginPage({ onLogin }) {
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
      try { localStorage.setItem('goroom_user_id', user.id); } catch(e) {}
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
        try { localStorage.setItem('goroom_user_id', user.id); } catch(e) {}
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
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
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
