# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GoRoom v2 — collaborative calendar/feed app (KakaoTalk-inspired). Supports web (Vite+React PWA), mobile (Capacitor), and desktop (Electron).

## Commands

```bash
npm run dev          # Dev server on localhost:3000
npm run build        # Production build → dist/
npm run preview      # Preview production build

# Mobile (Capacitor)
npm run app:sync     # Build + sync to native project
npm run app:open:android

# Desktop (Electron)
npm run desktop:dev
npm run desktop:build
```

Deployed to Vercel (auto-deploy on push, config in `vercel.json`).

## Architecture

**Monolithic single-file app:** Nearly all UI, state, styles, and logic live in `src/App.jsx` (~1,600 lines). There is no router library — navigation is driven by `page`, `subPage`, `tab`, and `roomTab` state variables.

**Key files:**
- `src/App.jsx` — all components, state, CRUD functions, and CSS (embedded as template literal at end of file)
- `src/supabase.js` — Supabase client init (URL + anon key)
- `src/main.jsx` — React entry point (minimal)
- `public/sw.js` — Service Worker for offline caching and push notifications
- `electron/main.js` — Electron wrapper

**Backend:** Supabase only (no custom server). Tables: `goroom_users`, `goroom_friends`, `goroom_rooms`, `goroom_room_members`, `goroom_schedules`, `goroom_memos`, `goroom_todos`, `goroom_diaries`. Image storage in Supabase Storage bucket `goroom`.

**State management:** Plain React hooks (useState/useEffect/useMemo/useCallback). No Redux or Context. User ID stored in localStorage (`goroom_user_id`) — no auth system yet.

**Styling:** All CSS inline in App.jsx as a template literal. CSS variables prefixed `--gr-*`, classes prefixed `.gr-*`. Mobile-first responsive: ≤480px (full-screen stacking), 481–1024px (sidebar 320px), ≥1025px (sidebar 380px).

**Navigation state mapping:**
- `tab`: top-level sidebar (`'friends'` | `'calendar'`)
- `page`: current view (`null`=list, `'room'`, `'profile'`, `'add-friend'`, `'add-room'`, etc.)
- `roomTab`: active tab inside a room (`'cal'` | `'memo'` | `'todo'` | `'diary'` | `'budget'` | `'alarm'`)
- `subPage`: nested forms/settings within a room

## Conventions

- Korean UI strings throughout (user-facing text is in Korean)
- Components defined as functions inside App.jsx, not separate files
- CRUD operations are async functions in App component that call Supabase directly
- Image uploads go to Supabase Storage with paths like `user/{userId}/*` or `calendar/{roomId}/*`
- Primary accent color: `#F5A928` (orange)
