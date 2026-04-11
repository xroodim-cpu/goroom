// Vercel Serverless Function: /@slug (유저 프로필) + /calendar/:slug (캘린더) OG 메타태그
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://dyotbojxtcqhcmrefofb.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3Rib2p4dGNxaGNtcmVmb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU2NTIsImV4cCI6MjA5MDI5MTY1Mn0.dJp5-vqXoW_9s-Br2vyn8sx2fo2wDWpNWlr5tqgddqo';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const apiFetch = (path) => fetch(`${SUPABASE_URL}${path}`, {
  headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
}).then(r => r.json());

export default async function handler(req, res) {
  const { userSlug, calSlug } = req.query;
  if (!userSlug && !calSlug) return res.redirect(302, '/');

  const host = req.headers.host || 'goroom.vercel.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${host}`;

  let title = '고룸 GOROOM';
  let description = '시간을 다양하게 담아내고, 서로의 시간을 공유해보세요.';
  let image = `${baseUrl}/og-default.jpg`;
  let url = baseUrl;

  try {
    if (userSlug) {
      // 유저 프로필: link_code 로 조회
      const users = await apiFetch(`/goroom_users?select=id,nickname,status_msg,profile_img,link_code&link_code=eq.${encodeURIComponent(userSlug)}`);
      const user = users?.[0];
      url = `${baseUrl}/@${userSlug}`;
      if (user) {
        title = `고룸 - ${user.nickname}`;
        description = user.status_msg || `${user.nickname}의 프로필`;
        if (user.profile_img) image = user.profile_img;
      }
    } else if (calSlug) {
      // 캘린더: UUID면 id로, 아니면 slug로 조회
      let room = null;
      if (UUID_RE.test(calSlug)) {
        const rooms = await apiFetch(`/goroom_rooms?select=id,name,description,thumbnail_url,slug&id=eq.${calSlug}`);
        room = rooms?.[0];
      } else {
        const rooms = await apiFetch(`/goroom_rooms?select=id,name,description,thumbnail_url,slug&slug=eq.${encodeURIComponent(calSlug)}`);
        room = rooms?.[0];
      }
      url = `${baseUrl}/calendar/${calSlug}`;
      if (room) {
        title = `고룸 - ${room.name} 캘린더`;
        description = room.description || `${room.name} 캘린더에 참여하세요!`;
        if (room.thumbnail_url) image = room.thumbnail_url;
      }
    }
  } catch (e) {
    console.error('[OG] Supabase fetch error:', { userSlug, calSlug, error: e.message });
  }

  const ogTags = `
    <meta property="og:type" content="website"/>
    <meta property="og:title" content="${esc(title)}"/>
    <meta property="og:description" content="${esc(description)}"/>
    <meta property="og:image" content="${esc(image)}"/>
    <meta property="og:url" content="${esc(url)}"/>
    <meta property="og:site_name" content="고룸 GOROOM"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="${esc(title)}"/>
    <meta name="twitter:description" content="${esc(description)}"/>
    <meta name="twitter:image" content="${esc(image)}"/>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');

  try {
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    let html = readFileSync(indexPath, 'utf-8');
    // 기존 OG 메타 태그 제거 후 동적 태그 삽입
    html = html.replace(/<meta\s+property="og:[^"]*"\s+content="[^"]*"\s*\/?>/g, '');
    html = html.replace(/<meta\s+name="twitter:[^"]*"\s+content="[^"]*"\s*\/?>/g, '');
    html = html.replace('</head>', `${ogTags}\n</head>`);
    html = html.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`);
    return res.status(200).send(html);
  } catch (e) {
    console.error('HTML read error:', e);
    const redirectUrl = userSlug ? `/@${esc(userSlug)}` : `/calendar/${esc(calSlug)}`;
    return res.status(200).send(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">${ogTags}<title>${esc(title)}</title><script>window.location.replace('${redirectUrl}');</script></head><body><p style="text-align:center;padding:40px;font-family:sans-serif;color:#888">이동 중...</p></body></html>`);
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
