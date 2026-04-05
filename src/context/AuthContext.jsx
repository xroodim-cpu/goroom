import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, sbGet, sbPost } from '../supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const setUserFromSession = (session) => {
    if (!session?.user) return false;
    const u = session.user;
    const meta = u.user_metadata || {};
    const nickname = meta.full_name || meta.name || meta.preferred_username || u.email?.split('@')[0] || '나';
    localStorage.setItem('goroom_user_id', u.id);
    setUser({ id: u.id, email: u.email, nickname });
    return true;
  };

  useEffect(() => {
    let mounted = true;
    let resolved = false;

    // OAuth hash 정리
    if (window.location.hash.includes('access_token') || window.location.search.includes('error')) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // onAuthStateChange만 사용 — getSession() 동시 호출 시 내부 lock 경합으로 deadlock 발생
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        setUserFromSession(session);
        if (!resolved) { resolved = true; setAuthChecked(true); }
        // goroom_users 자동 생성 (SIGNED_IN만)
        if (event === 'SIGNED_IN') {
          const u = session.user;
          const meta = u.user_metadata || {};
          const existingArr = await sbGet(`/goroom_users?select=id&id=eq.${u.id}`);
          if (!existingArr || existingArr.length === 0) {
            const linkCode = 'goroom-' + Math.random().toString(36).slice(2, 10);
            await sbPost('goroom_users', {
              id: u.id, nickname: meta.full_name || meta.name || u.email?.split('@')[0] || '나',
              status_msg: '', profile_img: meta.avatar_url || meta.picture || null,
              profile_bg: null, link_code: linkCode, birthday: '',
            });
          }
        }
      } else if (event === 'INITIAL_SESSION' && !session) {
        if (!resolved) {
          resolved = true;
          const savedId = localStorage.getItem('goroom_user_id');
          if (savedId) { setUser({ id: savedId, email: '', nickname: '나' }); }
          else { setUser(null); }
          setAuthChecked(true);
        }
      }
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUserFromSession(session);
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('goroom_user_id');
        setUser(null);
      }
    });

    // 3초 안에 auth 이벤트 안 오면 localStorage 기반으로 진행
    const authTimeout = setTimeout(() => {
      if (!resolved && mounted) {
        resolved = true;
        const savedId = localStorage.getItem('goroom_user_id');
        if (savedId) { setUser({ id: savedId, email: '', nickname: '나' }); }
        else { setUser(null); }
        setAuthChecked(true);
      }
    }, 3000);

    return () => { mounted = false; clearTimeout(authTimeout); subscription.unsubscribe(); };
  }, []);

  const handleLogin = useCallback((u) => setUser(u), []);
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('goroom_user_id');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, authChecked, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
