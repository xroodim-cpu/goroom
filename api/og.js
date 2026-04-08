// Vercel Serverless Function: /@slug 및 /calendar/:roomId OG 메타태그
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://dyotbojxtcqhcmrefofb.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3Rib2p4dGNxaGNtcmVmb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU2NTIsImV4cCI6MjA5MDI5MTY1Mn0.dJp5-vqXoW_9s-Br2vyn8sx2fo2wDWpNWlr5tqgddqo';

const apiFetch = (path) => fetch(`${SUPABASE_URL}${path}`, {
  headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
}).then(r => r.json());

export default async function handler(req, res) {
  const { slug, roomId } = req.query;
  if (!slug && !roomId) return res.redirect(302, '/');

  // 동적으로 도메인 설정
  const host = req.headers.host || 'goroom.vercel.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${host}`;

  let title = '구롬 GoRoom';
  let description = '스케줄 · 가계부 · 메모';
  let image = `${baseUrl}/icon-192.png`;
  let url = baseUrl;

  try {
    let room = null;

    if (slug) {
      // /@slug로 접근
      const rooms = await apiFetch(`/goroom_rooms?select=id,name,description,thumbnail_url,slug&slug=eq.${slug}`);
      room = rooms?.[0];
      url = `${baseUrl}/@${slug}`;
    } else if (roomId) {
      // /calendar/:roomId로 접근
      const rooms = await apiFetch(`/goroom_rooms?select=id,name,description,thumbnail_url,slug&id=eq.${roomId}`);
      room = rooms?.[0];
      // slug가 있으면 slug URL 사용, 없으면 calendar URL
      url = room?.slug ? `${baseUrl}/@${room.slug}` : `${baseUrl}/calendar/${roomId}/cal`;
    }

    if (room) {
      title = `고룸 - ${room.name} 캘린더`;
      description = room.description || `${room.name} 캘린더에 참여하세요!`;
      if (room.thumbnail_url) image = room.thumbnail_url;
    }
  } catch (e) {
    console.error('[OG] Supabase fetch error:', {
      roomId,
      slug,
      error: e.message,
      stack: e.stack
    });
    // 에러 발생해도 기본 OG 태그는 반환
  }

  const ogTags = `
    <meta property="og:type" content="website"/>
    <meta property="og:title" content="${esc(title)}"/>
    <meta property="og:description" content="${esc(description)}"/>
    <meta property="og:image" content="${esc(image)}"/>
    <meta property="og:url" content="${esc(url)}"/>
    <meta property="og:site_name" content="구롬 GoRoom"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="${esc(title)}"/>
    <meta name="twitter:description" content="${esc(description)}"/>
    <meta name="twitter:image" content="${esc(image)}"/>`;

  // 공통 헤더
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');

  // SPA index.html에 OG 태그 삽입
  try {
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    let html = readFileSync(indexPath, 'utf-8');
    html = html.replace('</head>', `${ogTags}\n</head>`);
    html = html.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`);
    return res.status(200).send(html);
  } catch (e) {
    console.error('HTML read error:', e);
    // Fallback: JavaScript redirect
    const redirectUrl = slug ? `/@${esc(slug)}` : `/calendar/${esc(roomId)}/cal`;
    return res.status(200).send(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">${ogTags}<title>${esc(title)}</title><script>window.location.replace('${redirectUrl}');</script></head><body><p style="text-align:center;padding:40px;font-family:sans-serif;color:#888">이동 중...</p></body></html>`);
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
