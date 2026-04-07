import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dyotbojxtcqhcmrefofb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3Rib2p4dGNxaGNtcmVmb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU2NTIsImV4cCI6MjA5MDI5MTY1Mn0.dJp5-vqXoW_9s-Br2vyn8sx2fo2wDWpNWlr5tqgddqo';

// localStorage 사용 가능 여부 확인
const canUseStorage = (() => {
  try { localStorage.setItem('_test', '1'); localStorage.removeItem('_test'); return true; } catch(e) { return false; }
})();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: canUseStorage,
    autoRefreshToken: canUseStorage,
  },
});

/* ── Direct REST API helpers (bypass Supabase JS client auth lock) ── */
const REST_URL = `${SUPABASE_URL}/rest/v1`;
const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' };

/** GET query — returns array */
export const sbGet = (path) => fetch(`${REST_URL}${path}`, { headers }).then(r => r.json());

/** POST (insert) — returns inserted rows */
export const sbPost = (table, body) => fetch(`${REST_URL}/${table}`, { method: 'POST', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify(body) }).then(r => r.json());

/** PATCH (update) — path includes filters e.g. /table?id=eq.xxx */
export const sbPatch = (path, body) => fetch(`${REST_URL}${path}`, { method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify(body) }).then(r => r.json());

/** DELETE — path includes filters */
export const sbDelete = (path) => fetch(`${REST_URL}${path}`, { method: 'DELETE', headers }).then(r => r.ok);
