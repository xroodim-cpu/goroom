// Vercel Serverless Function: /@slug OG 메타태그
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://dyotbojxtcqhcmrefofb.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3Rib2p4dGNxaGNtcmVmb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU2NTIsImV4cCI6MjA5MDI5MTY1Mn0.dJp5-vqXoW_9s-Br2vyn8sx2fo2wDWpNWlr5tqgddqo';

export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) return res.redirect(302, '/');

  let title = '구롬 GoRoom';
  let description = '스케줄 · 가계부 · 메모';
  let image = 'https://goroom.kr/og-default.png';
  const url = `https://goroom.kr/@${slug}`;

  try {
    const r = await fetch(`${SUPABASE_URL}/goroom_rooms?select=id,name,description,thumbnail_url&slug=eq.${slug}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const rooms = await r.json();
    const room = rooms?.[0];

    if (room) {
      title = `고룸 - ${room.name} 캘린더`;
      description = room.description || `${room.name} 캘린더에 참여하세요!`;
      if (room.thumbnail_url) image = room.thumbnail_url;
    }
  } catch (e) {
    console.error('OG fetch error:', e);
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

  // SPA index.html에 OG 태그 삽입
  try {
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    let html = readFileSync(indexPath, 'utf-8');
    html = html.replace('</head>', `${ogTags}\n</head>`);
    html = html.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).send(html);
  } catch (e) {
    console.error('HTML read error:', e);
    // Fallback: 크롤러용 간단 HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">${ogTags}<title>${esc(title)}</title><meta http-equiv="refresh" content="0;url=/@${esc(slug)}"></head><body></body></html>`);
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
