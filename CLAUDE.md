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

**React Router SPA** with URL-based navigation (react-router-dom v6). BrowserRouter wraps the app in `main.jsx`.

**File structure:**
```
src/
  main.jsx                          — React entry, BrowserRouter wrapper
  App.jsx                           — Auth wrapper + AppMain (state, CRUD, routing logic)
  styles/global.css                 — All CSS (extracted from JS)
  lib/helpers.js                    — Utility functions, constants (uid, fmt, COLORS, DEF_SETTINGS)
  supabase.js                       — Supabase client + REST helpers (sbGet/sbPost/sbPatch/sbDelete)
  wasabi.js                         — Wasabi S3 image storage helpers
  context/
    AuthContext.jsx                 — user, authChecked, login/logout (Supabase auth)
    AppContext.jsx                  — Thin context wrapper for app state/CRUD
  hooks/
    useBreakpoint.js                — Responsive breakpoint (mobile/tablet/desktop)
  components/shared/
    Icon.jsx, Avatar.jsx, Toggle.jsx, MiniCal.jsx, SchCard.jsx,
    ImageViewer.jsx, DiarySlider.jsx, SimpleForm.jsx, ToggleSection.jsx
  pages/
    Login.jsx
    more/  MyInfo.jsx, AddFriend.jsx, NotificationSettings.jsx, AppSettings.jsx, Trash.jsx
    calendar/  CalRoom.jsx, RoomSettings.jsx, InviteMembers.jsx, AddRoom.jsx,
               ScheduleForm.jsx, MemoForm.jsx, DiaryForm.jsx, BudgetForm.jsx
    calendar/tabs/  RoomCal.jsx, RoomMemo.jsx, RoomTodo.jsx, RoomDiary.jsx, RoomBudget.jsx, RoomMap.jsx
```

**URL routes** (derived in AppMain via `deriveNav()`):
- `/` — Friends list, `/profile` — My profile, `/friends/:id` — Friend profile
- `/calendar` — Room list, `/calendar/new` — Add room
- `/calendar/:roomId/:tab` — Room view (cal/memo/todo/diary/budget/map/alarm)
- `/calendar/:roomId/settings` — Room settings, `/calendar/:roomId/invite` — Invite members
- `/calendar/:roomId/schedule|memo|todo|diary|budget/new` — Create forms
- `/more` — More menu, `/more/info|add-friend|notifications|settings|trash` — Sub pages

**Backend:** Supabase (direct REST API via sbGet/sbPost/sbPatch/sbDelete — no Supabase JS client for data). Tables: `goroom_users`, `goroom_friends`, `goroom_rooms`, `goroom_room_members`, `goroom_schedules`, `goroom_memos`, `goroom_todos`, `goroom_diaries`, `goroom_trash`. Image storage via Wasabi S3 (`wasabi.js`).

**State management:** React Context (AuthContext for auth, AppContext for shared state/CRUD). All CRUD functions live in AppMain and are passed via AppContext. Page components receive props or use `useApp()`.

**Styling:** External CSS file (`src/styles/global.css`). CSS variables prefixed `--gr-*`, classes prefixed `.gr-*`. Mobile-first responsive: ≤480px (full-screen stacking), 481–1024px (sidebar 320px), ≥1025px (sidebar 380px).

**Responsive layout:** Desktop shows sidebar + detail panel side by side. Mobile shows one at a time — list routes show sidebar, detail routes show detail with back button.

## Conventions

- Korean UI strings throughout (user-facing text is in Korean)
- CRUD operations are async functions in AppMain that call Supabase REST API directly
- Image uploads go to Wasabi S3 with paths like `user/{userId}/*` or `calendar/{roomId}/*`
- Primary accent color: `#cc222c` (red)
- Navigation via `useNavigate()` — never use state-based navigation
- `goBack()` uses `navigate(-1)` for browser history back
