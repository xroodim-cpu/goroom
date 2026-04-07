import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase, sbGet, sbPost, sbPatch, sbDelete } from './supabase';
import { uploadToWasabi, deleteFromWasabi, deleteFolderFromWasabi, moveInWasabi, getWasabiUrl, extractWasabiPath } from './wasabi';
import { uid, shortId, fmt, fmtTime, DAYS, MO, COLORS, ALL_MENUS, DEF_SETTINGS, getUserId, fileToBlob, canEdit, canManage, extFromDataUrl, extFromFile, isVideo as isVideoHelper } from './lib/helpers';
import { startBackgroundUpload, onUploadStateChange, getUploadState } from './lib/uploadManager';
import { Capacitor } from '@capacitor/core';
import GoRoomWidget from './plugins/GoRoomWidget';
import I from './components/shared/Icon';
import Avatar from './components/shared/Avatar';
import Toggle from './components/shared/Toggle';
import MiniCal from './components/shared/MiniCal';
import useBreakpoint from './hooks/useBreakpoint';
import useAlarmChecker from './hooks/useAlarmChecker';
import useRealtimeSchedules from './hooks/useRealtimeSchedules';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import './styles/global.css';

/* ── Page imports ── */
import LoginPage from './pages/Login';
import MyInfoPage from './pages/more/MyInfo';
import AddFriendPage from './pages/more/AddFriend';
import NotificationSettings from './pages/more/NotificationSettings';
import AppSettings from './pages/more/AppSettings';
import TrashPage from './pages/more/Trash';
import StoragePage from './pages/more/StoragePage';
import CalRoom from './pages/calendar/CalRoom';
import AddRoomPage from './pages/calendar/AddRoom';
import ScheduleForm from './pages/calendar/ScheduleForm';
import JoinRoomPrompt from './pages/calendar/JoinRoomPrompt';

import ImageViewer from './components/shared/ImageViewer';
import { isVideo } from './lib/helpers';

/* ── 스케줄 상세 이미지 그리드 (반응형: 모바일1열 / 태블릿2열 / PC3열) ── */
function SchDetailImages({ images }) {
  const [viewerIdx, setViewerIdx] = useState(null);
  return <div className="gr-det-section">
    <div className="gr-det-label">이미지</div>
    <div className="gr-det-grid">
      {images.map((img, i) => <div key={i} className="gr-det-grid-item" onClick={() => setViewerIdx(i)}>
        {isVideo(img)
          ? <video src={img} className="gr-det-grid-img" muted playsInline />
          : <img src={img} className="gr-det-grid-img" alt="" />}
      </div>)}
    </div>
    {viewerIdx !== null && <ImageViewer images={images} startIdx={viewerIdx} onClose={() => setViewerIdx(null)} />}
  </div>;
}

/* ── Wasabi Storage Helpers ── */
const uploadFile = uploadToWasabi;
const deleteFile = deleteFromWasabi;
const deleteFolder = deleteFolderFromWasabi;

/* ── AUTH WRAPPER ── */
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

function AppInner() {
  const { user, authChecked, handleLogin, handleLogout } = useAuth();

  // 초대링크 감지: ?join=CODE 또는 /@slug → localStorage에 보존
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      localStorage.setItem('goroom_join_code', joinCode);
      window.history.replaceState(null, '', window.location.pathname);
    }
    // /@slug 캘린더 공유 링크 감지
    const slugMatch = window.location.pathname.match(/^\/@(.+)$/);
    if (slugMatch) {
      localStorage.setItem('goroom_join_slug', slugMatch[1]);
    }
    // OAuth 리다이렉트 후 원래 경로 복원용
    const fullPath = window.location.pathname + window.location.search;
    if (fullPath !== '/' && !window.location.hash.includes('access_token')) {
      localStorage.setItem('goroom_redirect_path', fullPath);
    }
  }, []);

  if (!authChecked) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
      <div className="gr-loading-spinner"/>
    </div>
  );

  if (!user) return <LoginPage onLogin={handleLogin}/>;

  return <AppMain authUser={user} onLogout={handleLogout}/>;
}

function AppMain({ authUser, onLogout }){
  const bp = useBreakpoint();
  const isWide = bp === 'desktop' || bp === 'tablet';
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const userId = useMemo(() => getUserId(), []);

  const [me, setMe] = useState({id:userId,nickname:'나',statusMsg:'',linkCode:'',bio:'',profileImg:null,profileBg:null,birthday:'',storageLimit:1073741824});
  const [friends, setFriends] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]); // 나를 추가한 사람들
  const [rooms, setRooms] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [editProfile, setEditProfile] = useState(false);
  const [schDetail, setSchDetail] = useState(null);
  const [friendSchs, setFriendSchs] = useState({});  // { friendId: schedules[] }
  const [profilePopup, setProfilePopup] = useState(null); // {id,nickname,statusMsg,profileImg,profileBg}
  const [lastReadAlarm, setLastReadAlarm] = useState(() => parseInt(localStorage.getItem('gr_last_read_alarm') || '0'));

  // 알림 데이터 계산 (다른 사용자가 만든 최근 활동)
  const notifications = useMemo(() => {
    const items = [];
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;
    rooms.forEach(room => {
      (room.schedules || []).forEach(s => {
        if (s.createdBy && s.createdBy !== userId && s.createdAt > weekAgo) {
          items.push({ type: 'schedule', roomId: room.id, roomName: room.name, title: s.title, createdAt: s.createdAt, createdBy: s.createdBy });
        }
      });
      (room.memos || []).forEach(m => {
        if (m.createdBy && m.createdBy !== userId && m.createdAt > weekAgo) {
          items.push({ type: 'memo', roomId: room.id, roomName: room.name, title: m.title, createdAt: m.createdAt, createdBy: m.createdBy });
        }
      });
      (room.todos || []).forEach(t => {
        if (t.createdBy && t.createdBy !== userId && t.createdAt > weekAgo) {
          items.push({ type: 'todo', roomId: room.id, roomName: room.name, title: t.text, createdAt: t.createdAt, createdBy: t.createdBy });
        }
      });
      (room.diaries || []).forEach(d => {
        if (d.createdBy && d.createdBy !== userId && d.createdAt > weekAgo) {
          items.push({ type: 'diary', roomId: room.id, roomName: room.name, title: d.content?.slice(0,30) || '다이어리', createdAt: d.createdAt, createdBy: d.createdBy });
        }
      });
    });
    items.sort((a, b) => b.createdAt - a.createdAt);
    return items;
  }, [rooms, userId]);

  const unreadAlarmCount = useMemo(() => notifications.filter(n => n.createdAt > lastReadAlarm).length, [notifications, lastReadAlarm]);

  // 방별 새 업데이트 여부 (다른 사용자가 lastReadAlarm 이후에 추가한 것)
  const roomHasUpdate = useCallback((room) => {
    return (room.schedules||[]).some(s => s.createdBy !== userId && s.createdAt > lastReadAlarm)
      || (room.memos||[]).some(m => m.createdBy !== userId && m.createdAt > lastReadAlarm)
      || (room.todos||[]).some(t => t.createdBy !== userId && t.createdAt > lastReadAlarm)
      || (room.diaries||[]).some(d => d.createdBy !== userId && d.createdAt > lastReadAlarm);
  }, [userId, lastReadAlarm]);

  // URL에서 네비게이션 상태 파생
  const path = location.pathname;
  const tab = path.startsWith('/calendar') ? 'rooms' : path.startsWith('/alarm') ? 'alarm' : path.startsWith('/more') ? 'more' : 'friends';
  const setTab = (t) => {
    if (t === 'friends') navigate('/');
    else if (t === 'rooms') navigate('/calendar');
    else if (t === 'more') navigate('/more');
  };

  // page/selectedId/roomTab/subPage를 URL에서 파생
  const deriveNav = () => {
    const m = path.match(/^\/friends\/(.+)/);
    if (m) return { page: 'friend-profile', selectedId: m[1] };
    if (path === '/profile') return { page: 'profile', selectedId: userId };
    const rm = path.match(/^\/calendar\/new$/);
    if (rm) return { page: 'add-room', selectedId: null };
    const rmSettings = path.match(/^\/calendar\/([^/]+)\/settings$/);
    if (rmSettings) return { page: 'room', selectedId: rmSettings[1], subPage: 'settings' };
    const rmInvite = path.match(/^\/calendar\/([^/]+)\/invite$/);
    if (rmInvite) return { page: 'room', selectedId: rmInvite[1], subPage: 'invite' };
    const rmSchNew = path.match(/^\/calendar\/([^/]+)\/schedule\/new$/);
    if (rmSchNew) return { page: 'room', selectedId: rmSchNew[1], subPage: 'add-schedule' };
    const rmMemoNew = path.match(/^\/calendar\/([^/]+)\/memo\/new$/);
    if (rmMemoNew) return { page: 'room', selectedId: rmMemoNew[1], subPage: 'add-memo', roomTab: 'memo' };
    const rmTodoNew = path.match(/^\/calendar\/([^/]+)\/todo\/new$/);
    if (rmTodoNew) return { page: 'room', selectedId: rmTodoNew[1], subPage: 'add-todo', roomTab: 'todo' };
    const rmBudgetNew = path.match(/^\/calendar\/([^/]+)\/budget\/new$/);
    if (rmBudgetNew) return { page: 'room', selectedId: rmBudgetNew[1], subPage: 'add-budget', roomTab: 'budget' };
    const rmTab = path.match(/^\/calendar\/([^/]+)\/([^/]+)$/);
    if (rmTab) return { page: 'room', selectedId: rmTab[1], roomTab: rmTab[2] };
    const rmBase = path.match(/^\/calendar\/([^/]+)$/);
    if (rmBase) return { page: 'room', selectedId: rmBase[1], roomTab: 'cal' };
    if (path === '/more/info') return { page: 'my-info' };
    if (path === '/more/add-friend') return { page: 'add-friend' };
    if (path === '/more/notifications') return { page: 'notification-settings' };
    if (path === '/more/settings') return { page: 'app-settings' };
    if (path === '/more/trash') return { page: 'trash' };
    if (path === '/more/storage') return { page: 'storage' };
    if (path === '/schedule-detail') return { page: 'sch-detail' };
    if (path === '/schedule-edit') return { page: 'sch-edit' };
    if (path === '/alarm') return { page: 'alarm-list' };
    if (path === '/payment/success') return { page: 'payment-success' };
    if (path === '/payment/fail') return { page: 'payment-fail' };
    // /@slug 캘린더 공유 링크
    const slugMatch = path.match(/^\/@(.+)$/);
    if (slugMatch) return { page: 'join-slug', slug: slugMatch[1] };
    return { page: null, selectedId: null };
  };
  const nav = deriveNav();
  const page = nav.page;
  const selectedId = nav.selectedId || null;
  const roomTab = nav.roomTab || 'cal';
  const subPage = nav.subPage || null;

  // 이전 state-based navigation을 URL로 변환하는 헬퍼
  const setPage = () => {}; // no-op, use navigate instead
  const setSelectedId = () => {}; // no-op
  const setRoomTab = (rt) => {
    if (selectedId) navigate(`/calendar/${selectedId}/${rt}`);
  };
  const setSubPage = (sp) => {
    if (!sp) {
      if (selectedId) navigate(`/calendar/${selectedId}/${roomTab}`);
      return;
    }
    // Map old subPage names to URLs
    const subPageMap = { settings: 'settings', invite: 'invite',
      'add-schedule': 'schedule/new', 'add-memo': 'memo/new', 'add-todo': 'todo/new',
      'add-budget': 'budget/new' };
    if (selectedId && subPageMap[sp]) navigate(`/calendar/${selectedId}/${subPageMap[sp]}`);
  };
  const pushHistory = () => {}; // React Router handles history

  /* ── Load data via direct REST API (Supabase JS client deadlocks on initial auth) ── */
  useEffect(() => {
    const loadTimeout = setTimeout(() => { setLoading(prev => { if(prev){ console.warn('Data load timeout'); return false; } return prev; }); }, 5000);
    const SB_URL = 'https://dyotbojxtcqhcmrefofb.supabase.co/rest/v1';
    const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3Rib2p4dGNxaGNtcmVmb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU2NTIsImV4cCI6MjA5MDI5MTY1Mn0.dJp5-vqXoW_9s-Br2vyn8sx2fo2wDWpNWlr5tqgddqo';
    const sbGet = (path) => fetch(`${SB_URL}${path}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Accept: 'application/json' } }).then(r => r.json());
    const sbPost = (table, body) => fetch(`${SB_URL}/${table}`, { method: 'POST', headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(body) }).then(r => r.json());
    (async () => {
      try {
        // 1차 병렬: 유저 + 친구 + 방목록 + 나를 추가한 사람
        const [userArr, friendRows, memberRows, addedMeRows] = await Promise.all([
          sbGet(`/goroom_users?select=*&id=eq.${userId}`),
          sbGet(`/goroom_friends?select=*&user_id=eq.${userId}`),
          sbGet(`/goroom_room_members?select=room_id,role&user_id=eq.${userId}`),
          sbGet(`/goroom_friends?select=*&friend_id=eq.${userId}`),
        ]);

        // 유저 처리
        if (userArr.length > 0) {
          const eu = userArr[0];
          setMe({ id: eu.id, nickname: eu.nickname||'나', statusMsg: eu.status_msg||'', linkCode: eu.link_code||'', bio: '', profileImg: eu.profile_img||null, profileBg: eu.profile_bg||null, birthday: eu.birthday||'', storageLimit: eu.storage_limit||1073741824 });
        } else {
          const linkCode = shortId();
          await sbPost('goroom_users', { id: userId, nickname: '나', status_msg: '', profile_img: null, profile_bg: null, link_code: linkCode, birthday: '' });
          setMe(prev => ({ ...prev, linkCode }));
        }

        // 2차 병렬: 친구 + 방 상세 데이터
        const roomIds = memberRows.map(m => m.room_id);
        const secondaryQueries = [];
        // 친구 유저 정보
        if (friendRows.length > 0) secondaryQueries.push(sbGet(`/goroom_users?select=*&id=in.(${friendRows.map(f => f.friend_id).join(',')})`));
        else secondaryQueries.push(Promise.resolve([]));
        // 방 데이터 6개 쿼리
        if (roomIds.length > 0) {
          const inIds = roomIds.join(',');
          secondaryQueries.push(
            sbGet(`/goroom_rooms?select=*&id=in.(${inIds})`),
            sbGet(`/goroom_room_members?select=room_id,user_id,role&room_id=in.(${inIds})`),
            sbGet(`/goroom_schedules?select=*&room_id=in.(${inIds})`),
            sbGet(`/goroom_memos?select=*&room_id=in.(${inIds})`),
            sbGet(`/goroom_todos?select=*&room_id=in.(${inIds})`),
            sbGet(`/goroom_diaries?select=*&room_id=in.(${inIds})`),
          );
        }
        const secondaryResults = await Promise.all(secondaryQueries);
        // 친구 처리
        if (friendRows.length > 0) {
          const friendUsers = secondaryResults[0] || [];
          const fm = {}; friendUsers.forEach(u => { fm[u.id] = u; });
          setFriends(friendRows.map(fr => { const u = fm[fr.friend_id]||{}; return { id: fr.friend_id, nickname: u.nickname||'?', statusMsg: u.status_msg||'', isPublic: true, birthday: u.birthday||'', favorite: fr.favorite||false, bio: '', profileImg: u.profile_img||null, profileBg: u.profile_bg||null, updatedAt: null, _friendRowId: fr.id }; }));
        }
        // 친구추천 처리 (나를 추가했지만 내가 추가하지 않은 사람)
        const myFriendIds = new Set(friendRows.map(fr => fr.friend_id));
        const suggestIds = (addedMeRows||[]).filter(r => !myFriendIds.has(r.user_id)).map(r => r.user_id);
        if (suggestIds.length > 0) {
          const suggestUsers = await sbGet(`/goroom_users?select=*&id=in.(${suggestIds.join(',')})`);
          setFriendSuggestions((suggestUsers||[]).map(u => ({
            id: u.id, nickname: u.nickname||'?', statusMsg: u.status_msg||'',
            profileImg: u.profile_img||null, profileBg: u.profile_bg||null,
          })));
        }
        // 방 처리
        if (roomIds.length > 0) {
          const [roomsArr, allMb, allSch, allMem, allTd, allDi] = secondaryResults.slice(1);
          const mbByRoom = {}, schByRoom = {}, memByRoom = {}, tdByRoom = {}, diByRoom = {};
          (allMb||[]).forEach(m => { (mbByRoom[m.room_id]||(mbByRoom[m.room_id]=[])).push(m); });
          (allSch||[]).forEach(s => { (schByRoom[s.room_id]||(schByRoom[s.room_id]=[])).push(s); });
          (allMem||[]).forEach(m => { (memByRoom[m.room_id]||(memByRoom[m.room_id]=[])).push(m); });
          (allTd||[]).forEach(t => { (tdByRoom[t.room_id]||(tdByRoom[t.room_id]=[])).push(t); });
          (allDi||[]).forEach(d => { (diByRoom[d.room_id]||(diByRoom[d.room_id]=[])).push(d); });
          const loadedRooms = (roomsArr||[]).map(r => ({
            id: r.id, name: r.name, desc: r.description||'', isPersonal: r.is_personal||false, isPublic: r.is_public!==false,
            thumbnailUrl: r.thumbnail_url||'', inviteCode: r.invite_code||'', invitePassword: r.invite_password||'', slug: r.slug||'',
            members: (mbByRoom[r.id]||[]).map(m => ({id: m.user_id, role: m.role||'member'})), newCount: 0, nearestSchedule: null,
            menus: {cal:true,map:false,memo:true,todo:true,diary:true,budget:true,alarm:true,...(r.menus||{})},
            settings: { ...DEF_SETTINGS, ...(r.settings||{}) },
            schedules: (schByRoom[r.id]||[]).map(s => ({ id:s.id, title:s.title, date:s.date, time:s.time||'', memo:s.memo||'', mood:s.mood||'', color:s.color||'#4A90D9', catId:s.cat_id||'', images:s.images||[], location:s.location||'', locationDetail:s.location_detail||'', createdAt:new Date(s.created_at||Date.now()).getTime(), createdBy:s.created_by, todos:s.todos||[], dday:s.dday||false, repeat:s.repeat||null, alarm:s.alarm||null, budget:s.budget||null, likes:s.likes||[] })),
            memos: (memByRoom[r.id]||[]).map(m => ({ id:m.id, title:m.title, content:m.content||'', pinned:m.pinned||false, createdAt:new Date(m.created_at||Date.now()).getTime(), createdBy:m.created_by })),
            todos: (tdByRoom[r.id]||[]).map(t => ({ id:t.id, text:t.text, done:t.done||false, createdAt:new Date(t.created_at||Date.now()).getTime(), createdBy:t.created_by, doneAt:t.done_at?new Date(t.done_at).getTime():null, doneBy:t.done_by||null })),
            diaries: (diByRoom[r.id]||[]).map(d => ({ id:d.id, title:'', content:d.content||'', mood:d.mood||'', weather:d.weather||'', images:d.images||[], likes:d.likes||[], comments:d.comments||[], date:fmt(new Date(d.created_at||Date.now())), createdAt:new Date(d.created_at||Date.now()).getTime(), createdBy:d.created_by })),
          }));
          // 내 캘린더 존재 확인 — 없으면 자동 생성
          if (!loadedRooms.some(r => r.isPersonal)) {
            const roomId = uid();
            await Promise.all([
              sbPost('goroom_rooms', { id: roomId, owner_id: userId, name: '내 캘린더', description: '개인 일정', is_personal: true, is_public: true, menus: {cal:true,memo:true,todo:true,diary:true,budget:true,alarm:true}, settings: DEF_SETTINGS }),
              sbPost('goroom_room_members', { room_id: roomId, user_id: userId, role: 'owner' }),
            ]);
            loadedRooms.unshift({ id: roomId, name: '내 캘린더', desc: '개인 일정', isPersonal: true, isPublic: true, members: [{id:userId,role:'owner'}], newCount: 0, nearestSchedule: null, menus: {cal:true,memo:true,todo:true,diary:true,budget:true,alarm:true}, settings: { ...DEF_SETTINGS }, schedules: [], memos: [], todos: [], diaries: [] });
          }
          setRooms(loadedRooms);
        } else {
          // 방이 없으면 내 캘린더 생성
          const roomId = uid();
          await Promise.all([
            sbPost('goroom_rooms', { id: roomId, owner_id: userId, name: '내 캘린더', description: '개인 일정', is_personal: true, is_public: true, menus: {cal:true,memo:true,todo:true,diary:true,budget:true,alarm:true}, settings: DEF_SETTINGS }),
            sbPost('goroom_room_members', { room_id: roomId, user_id: userId, role: 'owner' }),
          ]);
          setRooms([{ id: roomId, name: '내 캘린더', desc: '개인 일정', isPersonal: true, isPublic: true, members: [{id:userId,role:'owner'}], newCount: 0, nearestSchedule: null, menus: {cal:true,memo:true,todo:true,diary:true,budget:true,alarm:true}, settings: { ...DEF_SETTINGS }, schedules: [], memos: [], todos: [], diaries: [] }]);
        }
      } catch (e) {
        console.error('Load error:', e);
      } finally {
        clearTimeout(loadTimeout); setLoading(false);
        // 네이티브 앱: 위젯에 세션 전달 + 갱신
        if (Capacitor.isNativePlatform()) {
          GoRoomWidget.saveUserSession({ userId, supabaseUrl: 'https://dyotbojxtcqhcmrefofb.supabase.co', supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3Rib2p4dGNxaGNtcmVmb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU2NTIsImV4cCI6MjA5MDI5MTY1Mn0.dJp5-vqXoW_9s-Br2vyn8sx2fo2wDWpNWlr5tqgddqo' }).catch(() => {});
          GoRoomWidget.refreshWidget().catch(() => {});
        }
        // Electron 위젯용 userId 저장
        try { localStorage.setItem('gr_widget_user', userId); } catch {}

      }
    })();
    return () => clearTimeout(loadTimeout);
  }, [userId]);

  // 초대 링크 처리 (?join=CODE, /@slug, localStorage 보존)
  const [joinModal, setJoinModal] = useState(null);
  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        // 1) ?join=CODE 확인
        const params = new URLSearchParams(window.location.search);
        let joinCode = params.get('join');
        if (joinCode) window.history.replaceState(null, '', window.location.pathname);
        else joinCode = localStorage.getItem('goroom_join_code');
        localStorage.removeItem('goroom_join_code');

        // 2) /@slug 확인
        let joinSlug = localStorage.getItem('goroom_join_slug');
        localStorage.removeItem('goroom_join_slug');
        // 현재 URL이 /@slug인 경우도 확인
        const slugFromPath = window.location.pathname.match(/^\/@(.+)$/);
        if (slugFromPath) joinSlug = slugFromPath[1];

        // 3) 리다이렉트 경로 복원
        const redirectPath = localStorage.getItem('goroom_redirect_path');
        localStorage.removeItem('goroom_redirect_path');

        let targetRoom = null;

        if (joinCode) {
          // invite_code로 방 찾기
          const roomArr = await sbGet(`/goroom_rooms?select=id,name,description,invite_password,thumbnail_url&invite_code=eq.${joinCode}`);
          targetRoom = roomArr?.[0];
        } else if (joinSlug) {
          // slug로 방 찾기
          const roomArr = await sbGet(`/goroom_rooms?select=id,name,description,invite_password,thumbnail_url&slug=eq.${joinSlug}`);
          targetRoom = roomArr?.[0];
        } else if (redirectPath && redirectPath !== '/') {
          // OAuth 후 경로 복원 (캘린더 직접 링크)
          const calMatch = redirectPath.match(/^\/calendar\/([^/]+)/);
          if (calMatch) {
            const roomId = calMatch[1];
            const alreadyMember = rooms.some(r => r.id === roomId);
            if (alreadyMember) { navigate(redirectPath, { replace: true }); return; }
            // 비멤버 → 방 정보 조회
            const roomArr = await sbGet(`/goroom_rooms?select=id,name,description,invite_password,thumbnail_url&id=eq.${roomId}`);
            targetRoom = roomArr?.[0];
          } else {
            navigate(redirectPath, { replace: true });
            return;
          }
        } else {
          return; // 처리할 것 없음
        }

        if (!targetRoom) {
          // 방을 찾을 수 없음 — joinSlug URL이면 정리
          if (joinSlug || slugFromPath) navigate('/', { replace: true });
          return;
        }

        // 이미 멤버인지 확인
        const isMember = rooms.some(r => r.id === targetRoom.id);
        if (isMember) {
          navigate(`/calendar/${targetRoom.id}/cal`, { replace: true });
          return;
        }

        // 비멤버 → 가입 모달 표시
        const memberArr = await sbGet(`/goroom_room_members?select=user_id&room_id=eq.${targetRoom.id}`);
        setJoinModal({
          roomId: targetRoom.id,
          roomName: targetRoom.name,
          roomDesc: targetRoom.description || '',
          roomThumb: targetRoom.thumbnail_url || '',
          memberCount: memberArr?.length || 0,
          needPassword: !!targetRoom.invite_password,
        });

      } catch (e) {
        console.error('Join flow error:', e);
      }
    })();
  }, [loading]);

  // 결제 성공 콜백 처리
  useEffect(() => {
    if (loading || page !== 'payment-success') return;
    const params = new URLSearchParams(window.location.search);
    const planId = params.get('plan');
    if (!planId) { navigate('/'); return; }
    const PLANS_MAP = { plan_20g: 20*1024*1024*1024, plan_50g: 50*1024*1024*1024, plan_100g: 100*1024*1024*1024 };
    const newLimit = PLANS_MAP[planId];
    if (!newLimit) { navigate('/'); return; }
    (async () => {
      try {
        await sbPatch(`goroom_users?id=eq.${userId}`, { storage_limit: newLimit });
        setMe(prev => ({ ...prev, storageLimit: newLimit }));
      } catch (e) { console.error('Storage upgrade error:', e); }
      navigate('/');
    })();
  }, [loading, page]);

  const joinRoom = async (roomId, roomName) => {
    try {
      await sbPost('goroom_room_members', { room_id: roomId, user_id: userId, role: 'member' });
      // 방 데이터 병렬 로드
      const [rArr, allMembers, schedules, memos, todos, diaries] = await Promise.all([
        sbGet(`/goroom_rooms?select=*&id=eq.${roomId}`),
        sbGet(`/goroom_room_members?select=user_id,role&room_id=eq.${roomId}`),
        sbGet(`/goroom_schedules?select=*&room_id=eq.${roomId}`),
        sbGet(`/goroom_memos?select=*&room_id=eq.${roomId}`),
        sbGet(`/goroom_todos?select=*&room_id=eq.${roomId}`),
        sbGet(`/goroom_diaries?select=*&room_id=eq.${roomId}`),
      ]);
      const r = rArr?.[0];
      if (!r) throw new Error('Room not found');
      const newRoom = {
        id: r.id, name: r.name, desc: r.description||'', isPersonal: false, isPublic: r.is_public!==false,
        thumbnailUrl: r.thumbnail_url||'', inviteCode: r.invite_code||'', invitePassword: r.invite_password||'', slug: r.slug||'',
        members: (allMembers||[]).map(m=>({id: m.user_id, role: m.role||'member'})), newCount:0, nearestSchedule:null,
        menus: {cal:true,map:false,memo:true,todo:true,diary:true,budget:true,alarm:true,...(r.menus||{})},
        settings: {...DEF_SETTINGS,...(r.settings||{})},
        schedules: (schedules||[]).map(s=>({id:s.id,title:s.title,date:s.date,time:s.time||'',memo:s.memo||'',mood:s.mood||'',color:s.color||'#4A90D9',catId:s.cat_id||'',images:s.images||[],location:s.location||'',locationDetail:s.location_detail||'',createdAt:new Date(s.created_at||Date.now()).getTime(),createdBy:s.created_by,todos:s.todos||[],dday:s.dday||false,repeat:s.repeat||null,alarm:s.alarm||null,budget:s.budget||null,likes:s.likes||[]})),
        memos: (memos||[]).map(m=>({id:m.id,title:m.title,content:m.content||'',pinned:m.pinned||false,createdAt:new Date(m.created_at||Date.now()).getTime(),createdBy:m.created_by})),
        todos: (todos||[]).map(t=>({id:t.id,text:t.text,done:t.done||false,createdAt:new Date(t.created_at||Date.now()).getTime(),createdBy:t.created_by,doneAt:t.done_at?new Date(t.done_at).getTime():null,doneBy:t.done_by||null})),
        diaries: (diaries||[]).map(d=>({id:d.id,title:d.title,content:d.content||'',images:d.images||[],likes:d.likes||[],comments:d.comments||[],date:fmt(new Date(d.created_at||Date.now())),createdAt:new Date(d.created_at||Date.now()).getTime(),createdBy:d.created_by})),
      };
      setRooms(prev => [...prev, newRoom]);
      setJoinModal(null);
      alert(`"${roomName||r.name}" 캘린더에 가입되었습니다!`);
      navigate(`/calendar/${roomId}/cal`);
    } catch(e) { console.error(e); alert('가입에 실패했습니다.'); }
  };

  const openProfile = (id) => {
    if (id === userId) navigate('/profile');
    else navigate(`/friends/${id}`);
  };
  const openRoom = (id) => navigate(`/calendar/${id}/cal`);
  const goBack = () => {
    if (subPage) {
      navigate(`/calendar/${selectedId}/${roomTab}`);
      return;
    }
    setSchDetail(null);
    navigate(-1);
  };

  // PC(와이드)에서만 초기 로드 시 탭 기본 페이지 설정
  useEffect(() => {
    if (!loading && !page && isWide) {
      if (tab === 'friends') navigate('/profile', { replace: true });
      else if (tab === 'rooms') { const myRoom = rooms.find(r => r.isPersonal); if (myRoom) navigate(`/calendar/${myRoom.id}/cal`, { replace: true }); }
      else if (tab === 'more') navigate('/more/info', { replace: true });
    }
  }, [loading, isWide]);

  const updateRoom = useCallback((rid, fn) => setRooms(p => p.map(r => r.id === rid ? fn(r) : r)), []);

  useAlarmChecker(rooms, userId);
  useRealtimeSchedules(rooms, userId, updateRoom);

  const toggleFav = async (fid) => {
    const f = friends.find(x => x.id === fid);
    if (!f) return;
    const newFav = !f.favorite;
    setFriends(p => p.map(x => x.id === fid ? { ...x, favorite: newFav } : x));
    try {
      await sbPatch(`/goroom_friends?id=eq.${f._friendRowId}`, { favorite: newFav });
    } catch (e) { console.error('toggleFav error:', e); }
  };

  const getName = useCallback((id) => {
    if (id === userId) return me.nickname || '나';
    const f = friends.find(x => x.id === id);
    return f?.nickname || '?';
  }, [userId, me.nickname, friends]);

  const getProfile = useCallback((id) => {
    if (id === userId) return { name: me.nickname || '나', img: me.profileImg };
    const f = friends.find(x => x.id === id);
    return { name: f?.nickname || '?', img: f?.profileImg || null };
  }, [userId, me.nickname, me.profileImg, friends]);

  /* ── Profile save ── */
  const saveProfile = async (updatedMe) => {
    try {
      let profileImgUrl = updatedMe.profileImg;
      let profileBgUrl = updatedMe.profileBg;

      if (updatedMe.profileImg && updatedMe.profileImg.startsWith('data:')) {
        const blob = await fileToBlob(updatedMe.profileImg);
        if (blob) {
          const path = `user/${userId}/profile.jpg`;
          profileImgUrl = await uploadFile(path, blob);
          if (profileImgUrl) profileImgUrl = profileImgUrl + '?t=' + Date.now();
        }
      }

      if (updatedMe.profileBg && updatedMe.profileBg.startsWith('data:')) {
        const blob = await fileToBlob(updatedMe.profileBg);
        if (blob) {
          const path = `user/${userId}/bg.jpg`;
          profileBgUrl = await uploadFile(path, blob);
          if (profileBgUrl) profileBgUrl = profileBgUrl + '?t=' + Date.now();
        }
      }

      await sbPatch(`/goroom_users?id=eq.${userId}`, {
        nickname: updatedMe.nickname,
        status_msg: updatedMe.statusMsg,
        profile_img: profileImgUrl,
        profile_bg: profileBgUrl,
        birthday: updatedMe.birthday,
      });

      setMe(prev => ({ ...prev, ...updatedMe, profileImg: profileImgUrl, profileBg: profileBgUrl }));
    } catch (e) {
      console.error('saveProfile error:', e);
    }
  };

  /* ── Room CRUD helpers (Supabase-backed) ── */
  const saveSchedule = async (roomId, sch) => {
    const fileMap = sch._fileMap || {};
    // blob URL(새 파일)과 기존 URL 분리
    const pendingImages = [];
    const immediateUrls = [];
    for (let i = 0; i < (sch.images || []).length; i++) {
      const img = sch.images[i];
      if (img && img.startsWith('blob:') && fileMap[img]) {
        // 새 파일 (File 객체 직접 사용)
        pendingImages.push({ index: i, file: fileMap[img] });
        immediateUrls.push(null);
      } else if (img && img.startsWith('data:')) {
        // 레거시 data URL 지원
        pendingImages.push({ index: i, dataUrl: img });
        immediateUrls.push(null);
      } else if (img) {
        pendingImages.push({ index: i, existingUrl: img });
        immediateUrls.push(img);
      }
    }

    const existingOnly = immediateUrls.filter(u => u);
    const row = {
      id: sch.id, room_id: roomId, created_by: userId,
      title: sch.title, color: sch.color, date: sch.date, time: sch.time || null,
      cat_id: sch.catId || null, memo: sch.memo || null, mood: sch.mood || null,
      location: sch.location || null, location_detail: sch.locationDetail || null,
      dday: sch.dday || false, repeat: sch.repeat || null,
      alarm: sch.alarm || null, budget: sch.budget || null,
      todos: sch.todos || [], images: existingOnly,
    };
    try {
      await sbPost('goroom_schedules', row);
    } catch (e) { console.error('saveSchedule error:', e); }

    const hasNewFiles = pendingImages.some(p => p.file || p.dataUrl);
    if (hasNewFiles) {
      startBackgroundUpload(sch.id, roomId, pendingImages, uploadFile,
        (schId, finalUrls) => {
          sbPatch(`/goroom_schedules?id=eq.${schId}`, { images: finalUrls }).catch(e => console.error('bg update error:', e));
          setRooms(prev => prev.map(r => r.id === roomId ? { ...r, schedules: (r.schedules || []).map(s => s.id === schId ? { ...s, images: finalUrls } : s) } : r));
        },
        extFromDataUrl, fileToBlob
      );
    }

    return { ...sch, images: sch.images || [], _fileMap: undefined };
  };

  const updateScheduleInDb = async (roomId, sch) => {
    const fileMap = sch._fileMap || {};
    const activeUpload = getUploadState(sch.id);
    const isUploading = activeUpload && !activeUpload.done;

    const pendingImages = [];
    const immediateUrls = [];
    const hasNewFiles = [];
    for (let i = 0; i < (sch.images || []).length; i++) {
      const img = sch.images[i];
      if (img && img.startsWith('blob:') && fileMap[img]) {
        if (isUploading) continue;
        pendingImages.push({ index: i, file: fileMap[img] });
        immediateUrls.push(null);
        hasNewFiles.push(img);
      } else if (img && img.startsWith('data:')) {
        if (isUploading) continue;
        pendingImages.push({ index: i, dataUrl: img });
        immediateUrls.push(null);
        hasNewFiles.push(img);
      } else if (img) {
        pendingImages.push({ index: i, existingUrl: img });
        immediateUrls.push(img);
      }
    }

    const existingOnly = immediateUrls.filter(u => u);
    const row = {
      title: sch.title, color: sch.color, date: sch.date, time: sch.time || null,
      cat_id: sch.catId || null, memo: sch.memo || null, mood: sch.mood || null,
      location: sch.location || null, location_detail: sch.locationDetail || null,
      dday: sch.dday || false, repeat: sch.repeat || null,
      alarm: sch.alarm || null, budget: sch.budget || null,
      todos: sch.todos || [],
    };
    if (!isUploading) {
      row.images = existingOnly;
    }
    try {
      await sbPatch(`/goroom_schedules?id=eq.${sch.id}`, row);
    } catch (e) { console.error('updateSchedule error:', e); }

    if (hasNewFiles.length > 0 && !isUploading) {
      startBackgroundUpload(sch.id, roomId, pendingImages, uploadFile,
        (schId, finalUrls) => {
          sbPatch(`/goroom_schedules?id=eq.${schId}`, { images: finalUrls }).catch(e => console.error('bg update error:', e));
          setRooms(prev => prev.map(r => r.id === roomId ? { ...r, schedules: (r.schedules || []).map(s => s.id === schId ? { ...s, images: finalUrls } : s) } : r));
        },
        extFromDataUrl, fileToBlob
      );
    }

    return { ...sch, images: sch.images || [], _fileMap: undefined };
  };

  const deleteSchedule = async (roomId, schId, images, scheduleData) => {
    try {
      const trashPaths = [];
      if (images && images.length > 0) {
        for (const imgUrl of images) {
          const path = extractWasabiPath(imgUrl);
          if (path) {
            const trashPath = `trash/${path}`;
            await moveInWasabi(path, trashPath);
            trashPaths.push(trashPath);
          }
        }
      }
      if (scheduleData) {
        await sbPost('goroom_trash', {
          user_id: userId, room_id: roomId, type: 'schedule',
          original_data: scheduleData, image_paths: trashPaths,
        });
      }
      await sbDelete(`/goroom_schedules?id=eq.${schId}`);
    } catch (e) { console.error('deleteSchedule error:', e); }
  };

  const saveMemo = async (roomId, memo) => {
    try {
      await sbPost('goroom_memos', {
        id: memo.id, room_id: roomId, created_by: userId,
        title: memo.title, content: memo.content, pinned: memo.pinned || false,
      });
    } catch (e) { console.error('saveMemo error:', e); }
  };

  const deleteMemo = async (memoId) => {
    try { await sbDelete(`/goroom_memos?id=eq.${memoId}`); } catch (e) { console.error(e); }
  };

  const updateMemoPin = async (memoId, pinned) => {
    try { await sbPatch(`/goroom_memos?id=eq.${memoId}`, { pinned }); } catch (e) { console.error(e); }
  };

  const saveTodo = async (roomId, todo) => {
    try {
      await sbPost('goroom_todos', {
        id: todo.id, room_id: roomId, created_by: userId,
        text: todo.text, done: false,
      });
    } catch (e) { console.error('saveTodo error:', e); }
  };

  const deleteTodo = async (todoId) => {
    try { await sbDelete(`/goroom_todos?id=eq.${todoId}`); } catch (e) { console.error(e); }
  };

  const updateTodoDone = async (todoId, done) => {
    try {
      await sbPatch(`/goroom_todos?id=eq.${todoId}`, {
        done, done_by: done ? userId : null, done_at: done ? new Date().toISOString() : null,
      });
    } catch (e) { console.error(e); }
  };

  const saveDiary = async (roomId, diary) => {
    const imageUrls = [];
    for (let i = 0; i < (diary.images || []).length; i++) {
      const img = diary.images[i];
      if (img && img.startsWith('data:')) {
        const blob = await fileToBlob(img);
        if (blob) {
          const ext = extFromDataUrl(img);
          const path = `calendar/${roomId}/diary/${diary.id}/${i}_${Date.now()}.${ext}`;
          const url = await uploadFile(path, blob);
          if (url) imageUrls.push(url);
        }
      } else if (img) {
        imageUrls.push(img);
      }
    }
    try {
      await sbPost('goroom_diaries', {
        id: diary.id, room_id: roomId, created_by: userId,
        content: diary.content || '', mood: diary.mood || null, weather: diary.weather || null,
        images: imageUrls, likes: [], comments: [],
      });
    } catch (e) { console.error('saveDiary error:', e); }
    return { ...diary, images: imageUrls };
  };

  const deleteDiary = async (roomId, diaryId, images, diaryData) => {
    try {
      const trashPaths = [];
      if (images && images.length > 0) {
        for (const imgUrl of images) {
          const path = extractWasabiPath(imgUrl);
          if (path) {
            const trashPath = `trash/${path}`;
            await moveInWasabi(path, trashPath);
            trashPaths.push(trashPath);
          }
        }
      }
      if (diaryData) {
        await sbPost('goroom_trash', {
          user_id: userId, room_id: roomId, type: 'diary',
          original_data: diaryData, image_paths: trashPaths,
        });
      }
      await sbDelete(`/goroom_diaries?id=eq.${diaryId}`);
    } catch (e) { console.error(e); }
  };

  const updateDiaryLikes = async (diaryId, likes) => {
    try { await sbPatch(`/goroom_diaries?id=eq.${diaryId}`, { likes }); } catch (e) { console.error(e); }
  };

  const updateDiaryComments = async (diaryId, comments) => {
    try { await sbPatch(`/goroom_diaries?id=eq.${diaryId}`, { comments }); } catch (e) { console.error(e); }
  };

  const updateRoomInDb = async (roomId, updates) => {
    try { await sbPatch(`/goroom_rooms?id=eq.${roomId}`, updates); } catch (e) { console.error(e); }
  };

  const createRoom = async (roomData) => {
    const roomId = uid();
    try {
      let thumbnailUrl = '';
      if (roomData.thumbnailFile) {
        const blob = await fileToBlob(roomData.thumbnailFile);
        if (blob) {
          const path = `calendar/${roomId}/thumbnail.jpg`;
          thumbnailUrl = (await uploadFile(path, blob) || '') + '?t=' + Date.now();
        }
      }
      await sbPost('goroom_rooms', {
        id: roomId, owner_id: userId, name: roomData.name, description: roomData.desc || '',
        is_personal: false, is_public: roomData.isPublic,
        menus: roomData.menus,
        settings: DEF_SETTINGS,
        thumbnail_url: thumbnailUrl || null,
      });
      await sbPost('goroom_room_members', { room_id: roomId, user_id: userId, role: 'owner' });
      for (const memberId of (roomData.members || [])) {
        if (memberId !== userId) {
          await sbPost('goroom_room_members', { room_id: roomId, user_id: memberId, role: 'member' });
        }
      }
    } catch (e) { console.error('createRoom error:', e); }
    return roomId;
  };

  const deleteRoom = async (roomId) => {
    try {
      await sbDelete(`/goroom_schedules?room_id=eq.${roomId}`);
      await sbDelete(`/goroom_memos?room_id=eq.${roomId}`);
      await sbDelete(`/goroom_todos?room_id=eq.${roomId}`);
      await sbDelete(`/goroom_diaries?room_id=eq.${roomId}`);
      await sbDelete(`/goroom_room_members?room_id=eq.${roomId}`);
      await sbDelete(`/goroom_rooms?id=eq.${roomId}`);
      await deleteFolder(`calendar/${roomId}`);
    } catch (e) { console.error('deleteRoom error:', e); }
  };

  const addFriendByCode = async (code) => {
    try {
      const friendArr = await sbGet(`/goroom_users?select=*&link_code=eq.${code}`);
      const friendUser = friendArr?.[0];
      if (!friendUser) { alert('코드에 해당하는 사용자를 찾을 수 없습니다.'); return; }
      if (friendUser.id === userId) { alert('자기 자신을 추가할 수 없습니다.'); return; }
      const existing = friends.find(f => f.id === friendUser.id);
      if (existing) { alert('이미 친구입니다.'); return; }
      const insertedArr = await sbPost('goroom_friends', {
        user_id: userId, friend_id: friendUser.id, favorite: false,
      });
      const inserted = insertedArr?.[0];
      setFriends(prev => [...prev, {
        id: friendUser.id, nickname: friendUser.nickname || '?', statusMsg: friendUser.status_msg || '',
        isPublic: true, birthday: friendUser.birthday || '', favorite: false, bio: '',
        profileImg: friendUser.profile_img || null, profileBg: friendUser.profile_bg || null,
        updatedAt: null, _friendRowId: inserted?.id,
      }]);
      alert('친구가 추가되었습니다!');
    } catch (e) { console.error('addFriend error:', e); alert('친구 추가 실패'); }
  };

  const addFriendById = async (friendId) => {
    if (friends.find(f => f.id === friendId)) return;
    try {
      const friendArr = await sbGet(`/goroom_users?select=*&id=eq.${friendId}`);
      const friendUser = friendArr?.[0];
      if (!friendUser) return;
      const insertedArr = await sbPost('goroom_friends', { user_id: userId, friend_id: friendId, favorite: false });
      const inserted = insertedArr?.[0];
      setFriends(prev => [...prev, {
        id: friendUser.id, nickname: friendUser.nickname || '?', statusMsg: friendUser.status_msg || '',
        isPublic: true, birthday: friendUser.birthday || '', favorite: false, bio: '',
        profileImg: friendUser.profile_img || null, profileBg: friendUser.profile_bg || null,
        updatedAt: null, _friendRowId: inserted?.id,
      }]);
    } catch (e) { console.error('addFriendById error:', e); }
  };

  const appCtx = useMemo(() => ({
    userId, me, setMe, friends, setFriends, rooms, setRooms, authUser,
    bp, isWide, tab, setTab, page, setPage, selectedId, setSelectedId,
    roomTab, setRoomTab, subPage, setSubPage, searchQ, setSearchQ,
    editProfile, setEditProfile, schDetail, setSchDetail,
    openProfile, openRoom, goBack, pushHistory, updateRoom, getName, getProfile, toggleFav,
    saveProfile, saveSchedule, updateScheduleInDb, deleteSchedule, saveMemo, deleteMemo, updateMemoPin,
    saveTodo, deleteTodo, updateTodoDone, saveDiary, deleteDiary,
    updateDiaryLikes, updateDiaryComments, updateRoomInDb, createRoom, deleteRoom,
    addFriendByCode, joinRoom, onLogout,
  }), [userId, me, friends, rooms, authUser, bp, isWide, tab, page, selectedId,
    roomTab, subPage, searchQ, editProfile, schDetail, getName]);

  if (loading) {
    return <div className="gr-root"><div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="gr-loading-spinner"/></div></div>;
  }

  // 캘린더 가입 모달 (썸네일 + 이름 + 비밀번호)
  const JoinModal = () => {
    const [pw, setPw] = useState('');
    const [err, setErr] = useState('');
    const [joining, setJoining] = useState(false);
    const j = joinModal;
    const tryJoin = async () => {
      if (j.needPassword) {
        const roomArr = await sbGet(`/goroom_rooms?select=invite_password&id=eq.${j.roomId}`);
        const room = roomArr?.[0];
        if (!room || room.invite_password !== pw) { setErr('비밀번호가 틀렸습니다.'); return; }
      }
      setJoining(true);
      try { await joinRoom(j.roomId, j.roomName); setJoinModal(null); }
      catch { setErr('가입에 실패했습니다.'); setJoining(false); }
    };
    const handleCancel = () => { setJoinModal(null); navigate('/calendar', { replace: true }); };
    return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={handleCancel}>
      <div style={{background:'#fff',borderRadius:20,width:'90%',maxWidth:360,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        {/* 썸네일 헤더 */}
        <div style={{width:'100%',aspectRatio:'1/1',background:j.roomThumb?`url(${j.roomThumb}) center/cover no-repeat`:'linear-gradient(135deg,#cc222c 0%,#e85d5d 100%)',position:'relative'}}>
          <button className="gr-icon-btn" onClick={handleCancel} style={{position:'absolute',top:10,right:10,color:'#fff',background:'rgba(0,0,0,.25)',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center'}}><I n="x" size={16}/></button>
        </div>
        {/* 캘린더 정보 */}
        <div style={{padding:'20px 24px'}}>
          <div style={{fontSize:18,fontWeight:700}}>{j.roomName}</div>
          {j.roomDesc && <div style={{fontSize:13,color:'var(--gr-t3)',marginTop:4}}>{j.roomDesc}</div>}
          <div style={{fontSize:12,color:'var(--gr-t3)',marginTop:8,display:'flex',alignItems:'center',gap:4}}>
            <I n="users" size={13} color="var(--gr-t3)"/> {j.memberCount}명 참여 중
          </div>
          {/* 비밀번호 입력 */}
          {j.needPassword && <div style={{marginTop:16}}>
            <div style={{fontSize:13,color:'var(--gr-t2)',marginBottom:8}}>이 캘린더는 비밀번호가 필요합니다</div>
            <input className="gr-input" type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr('');}} placeholder="비밀번호를 입력하세요" onKeyDown={e=>e.key==='Enter'&&tryJoin()} autoFocus/>
          </div>}
          {err && <div style={{color:'var(--gr-exp)',fontSize:12,marginTop:6}}>{err}</div>}
          {/* 버튼 */}
          <div style={{display:'flex',gap:8,marginTop:20}}>
            <button style={{flex:1,padding:'12px',borderRadius:12,border:'1px solid var(--gr-brd)',background:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',color:'var(--gr-t2)'}} onClick={handleCancel}>취소</button>
            <button style={{flex:1,padding:'12px',borderRadius:12,border:'none',background:'var(--gr-acc)',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',opacity:joining?.6:1}} onClick={tryJoin} disabled={joining}>{joining?'가입 중...':'가입하기'}</button>
          </div>
        </div>
      </div>
    </div>;
  };

  const renderDetail = () => {
    const sb = !isWide;

    /* 결제 처리 */
    if(page==='payment-success') return <div className="gr-panel" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16}}><div className="gr-loading-spinner"/><div style={{fontSize:14,color:'var(--gr-t3)'}}>결제 처리 중...</div></div>;
    if(page==='payment-fail') return <div className="gr-panel" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16}}><div style={{fontSize:48}}>😞</div><div style={{fontSize:16,fontWeight:700}}>결제가 취소되었습니다</div><div style={{fontSize:13,color:'var(--gr-t3)'}}>다시 시도하시려면 아래 버튼을 눌러주세요</div><button className="gr-save-btn" style={{marginTop:8,width:'auto',padding:'10px 32px'}} onClick={()=>navigate('/')}>돌아가기</button></div>;

    /* 스케줄 수정 */
    if(page==='sch-edit' && schDetail){
      const s = schDetail;
      const origId = s._origId || s.id;
      const room = rooms.find(r => r.schedules.some(sc => sc.id === origId));
      if(room){
        const editSch = s._recurring ? {...room.schedules.find(sc=>sc.id===origId)} : s;
        return <div className="gr-panel"><ScheduleForm goBack={(savedSch)=>{if(savedSch) setSchDetail(savedSch); navigate(-1);}} room={room} updateRoom={updateRoom} selDate={editSch.date} sb={sb} saveSchedule={saveSchedule} updateSchedule={updateScheduleInDb} userId={userId} editData={editSch} rooms={rooms} me={me}/></div>;
      }
    }

    /* 스케줄 상세 */
    if(page==='sch-detail' && schDetail){
      const s = schDetail;
      const origId = s._origId || s.id;
      const room = rooms.find(r => r.schedules.some(sc => sc.id === origId));
      const st = room?.settings || DEF_SETTINGS;
      const pmName = s.budget?.pmId ? (st.paymentMethods || DEF_SETTINGS.paymentMethods).find(p=>p.id===s.budget.pmId)?.name || '' : '';
      const detailRole = room?.members.find(m=>m.id===userId)?.role||'member';
      return <div className="gr-panel">
        <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">스케줄 상세</div><div style={{display:'flex',gap:4}}>{room && canEdit(detailRole) && <button className="gr-icon-btn" onClick={()=>{navigate('/schedule-edit');}}><I n="edit" size={18}/></button>}{room && canEdit(detailRole) && <button className="gr-icon-btn" onClick={async ()=>{
          await deleteSchedule(room.id, s.id, s.images, s);
          updateRoom(room.id, r=>({...r,schedules:r.schedules.filter(sc=>sc.id!==s.id)}));
          goBack();
        }}><I n="trash" size={18} color="var(--gr-exp)"/></button>}</div></div>
        <div className="gr-pg-body">
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}><div style={{width:6,height:32,borderRadius:3,background:s.color||'var(--gr-acc)'}}/><div><div style={{fontSize:18,fontWeight:700}}>{s.mood&&<span>{s.mood} </span>}{s.title}</div><div style={{fontSize:13,color:'var(--gr-t3)'}}>{s.date} {s.time||''}</div></div></div>
          {s.location&&<div className="gr-det-section"><div className="gr-det-label">📍 장소</div><div style={{fontSize:14,color:'var(--gr-t2)'}}>{s.location}</div>{s.locationDetail&&s.locationDetail!==s.location&&<div style={{fontSize:12,color:'var(--gr-t3)',marginTop:2}}>{s.locationDetail}</div>}</div>}
          {s.memo&&<div className="gr-det-section"><div className="gr-det-label">메모</div><div style={{fontSize:14,color:'var(--gr-t2)',whiteSpace:'pre-wrap'}}>{s.memo}</div></div>}
          {s.todos?.length>0&&<div className="gr-det-section"><div className="gr-det-label">할 일 ({s.todos.filter(t=>t.done).length}/{s.todos.length})</div>{s.todos.map(t=><div key={t.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}><div style={{width:18,height:18,borderRadius:'50%',border:'2px solid '+(t.done?'var(--gr-acc)':'var(--gr-brd)'),background:t.done?'var(--gr-acc)':'none',display:'flex',alignItems:'center',justifyContent:'center'}}>{t.done&&<I n="check" size={10} color="#fff"/>}</div><span style={{fontSize:14,textDecoration:t.done?'line-through':'none',color:t.done?'var(--gr-t3)':'var(--gr-text)'}}>{t.text}</span></div>)}</div>}
          {s.dday&&<div className="gr-det-section"><div className="gr-det-label">D-day</div><div style={{fontSize:24,fontWeight:800,color:'var(--gr-acc)'}}>D-{Math.max(0,Math.ceil((new Date(s.date)-new Date())/864e5))}</div></div>}
          {s.repeat&&<div className="gr-det-section"><div className="gr-det-label">반복</div><div style={{fontSize:14}}>{{daily:'매일',weekly:'매주',monthly:'매월',yearly:'매년',custom:`${s.repeat.interval}일마다`}[s.repeat.type]}{s.repeat.endDate?` ~ ${s.repeat.endDate}`:' (계속)'}</div></div>}
          {s.alarm&&<div className="gr-det-section"><div className="gr-det-label">알람</div><div style={{fontSize:14}}>🔔 {{'10m':'10분 전','30m':'30분 전','1h':'1시간 전','1d':'하루 전'}[s.alarm.before]||s.alarm.before}{s.alarm.message?` — ${s.alarm.message}`:''}</div></div>}
          {s.budget&&<div className="gr-det-section"><div className="gr-det-label">가계부</div><div style={{fontSize:18,fontWeight:700,color:s.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}>{s.budget.type==='income'?'+':'-'}{s.budget.amount?.toLocaleString()}원</div>{s.budget.bCatName&&<div style={{fontSize:12,color:'var(--gr-t3)',marginTop:4}}>{s.budget.bCatName}</div>}{pmName&&<div style={{fontSize:12,color:'var(--gr-t3)',marginTop:2}}>결제: {pmName}</div>}</div>}
          {s.images && s.images.length > 0 && <SchDetailImages images={s.images}/>}
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
        <div style={{flex:1,overflowY:'auto'}}>
        <div className="gr-profile-bg" style={{background:me.profileBg?`url(${me.profileBg}) center/cover`:'linear-gradient(135deg,#cc222c 0%,#a81b24 100%)'}}>
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
        <MiniCal schedules={myRoom?.schedules||[]} onSchClick={(s)=>{setSchDetail(s);navigate('/schedule-detail');}}/>
        </div>
      </div>;
    }

    /* 친구 프로필 */
    if(page==='friend-profile'){
      const f=friends.find(x=>x.id===selectedId); if(!f) return null;
      // 친구 스케줄 로드 (최초 1회)
      if(f.isPublic && !friendSchs[f.id]) {
        (async()=>{
          try {
            const roomArr = await sbGet(`/goroom_rooms?select=id&owner_id=eq.${f.id}&is_personal=eq.true`);
            const room = roomArr?.[0];
            if(room){
              const schs = await sbGet(`/goroom_schedules?select=*&room_id=eq.${room.id}`);
              setFriendSchs(prev=>({...prev,[f.id]:(schs||[]).map(s=>({id:s.id,title:s.title,date:s.date,time:s.time||'',memo:s.memo||'',mood:s.mood||'',color:s.color||'#4A90D9',images:s.images||[],location:s.location||'',repeat:s.repeat||null,alarm:s.alarm||null,budget:s.budget||null,createdAt:new Date(s.created_at||Date.now()).getTime(),createdBy:s.created_by}))}));
            } else { setFriendSchs(prev=>({...prev,[f.id]:[]})); }
          } catch(e){ setFriendSchs(prev=>({...prev,[f.id]:[]})); }
        })();
      }
      const fSchs = friendSchs[f.id] || [];
      return <div className="gr-panel">
        <div style={{flex:1,overflowY:'auto'}}>
        <div className="gr-profile-bg" style={{background:f.profileBg?`url(${f.profileBg}) center/cover no-repeat`:'linear-gradient(135deg,#4A90D9 0%,#00B4D8 100%)'}}>
          {sb&&<button className="gr-icon-btn" onClick={goBack} style={{position:'absolute',top:12,left:12,color:'#fff'}}><I n="back" size={20}/></button>}
          <button className="gr-profile-fav-btn" onClick={()=>toggleFav(f.id)}>{f.favorite?<I n="starFill" size={22} color="#cc222c"/>:<I n="star" size={22} color="#fff"/>}</button>
        </div>
        <div className="gr-profile-info">
          <div className="gr-profile-avatar-wrap">{f.profileImg?<img src={f.profileImg} className="gr-profile-avatar-img" alt=""/>:<Avatar name={f.nickname} size={80}/>}</div>
          <div className="gr-profile-name">{f.nickname}</div>
          <div className="gr-profile-status">{f.statusMsg||'상태메시지 없음'}</div>
          {f.bio&&<div className="gr-profile-bio">{f.bio}</div>}
        </div>
        {f.isPublic?<MiniCal schedules={fSchs} onSchClick={(s)=>{setSchDetail(s);navigate('/schedule-detail');}}/>:<div className="gr-lock"><I n="lock" size={40} color="var(--gr-t3)"/><div style={{fontSize:16,fontWeight:700,color:'var(--gr-t2)'}}>비공개</div><div style={{fontSize:13,color:'var(--gr-t3)'}}>캘린더를 공개하지 않았습니다</div></div>}
        </div>
      </div>;
    }

    if(page==='my-info') return <MyInfoPage goBack={goBack} sb={sb} me={me} setMe={setMe} saveProfile={saveProfile} authUser={authUser}/>;
    if(page==='add-friend') return <AddFriendPage goBack={goBack} me={me} addFriendByCode={addFriendByCode} sb={sb}/>;
    if(page==='notification-settings') return <NotificationSettings goBack={goBack} sb={sb}/>;
    if(page==='app-settings') return <AppSettings goBack={goBack} sb={sb} userId={userId} onLogout={onLogout}/>;
    if(page==='trash') return <TrashPage goBack={goBack} sb={sb} userId={userId} rooms={rooms} setRooms={setRooms} updateRoom={updateRoom}/>;
    if(page==='storage') return <StoragePage goBack={goBack} rooms={rooms} userId={userId} me={me}/>;

    // /@slug 공유링크 — join useEffect에서 처리하므로 로딩만 표시
    if(page==='join-slug') return <div className="gr-panel" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}><div className="gr-loading-spinner"/></div>;

    if(page==='room'){
      const room=rooms.find(r=>r.id===selectedId);
      if(!room) return <JoinRoomPrompt roomId={selectedId} userId={userId} joinRoom={joinRoom} goBack={goBack} sb={sb}/>;
      return <CalRoom room={room} goBack={goBack} roomTab={roomTab} setRoomTab={setRoomTab} friends={friends} subPage={subPage} setSubPage={setSubPage} updateRoom={updateRoom} sb={sb} me={me} userId={userId} onSchClick={(s)=>{setSchDetail(s);navigate('/schedule-detail');}} saveSchedule={saveSchedule} saveMemo={saveMemo} deleteMemo={deleteMemo} updateMemoPin={updateMemoPin} saveTodo={saveTodo} deleteTodo={deleteTodo} updateTodoDone={updateTodoDone} updateDiaryLikes={updateDiaryLikes} updateDiaryComments={updateDiaryComments} updateRoomInDb={updateRoomInDb} deleteSchedule={deleteSchedule} deleteRoom={deleteRoom} getName={getName} getProfile={getProfile} rooms={rooms}/>;
    }
    if(page==='add-room') return <AddRoomPage goBack={goBack} setRooms={setRooms} sb={sb} friends={friends} createRoom={createRoom} userId={userId}/>;
    return null;
  };

  const renderSidebar = () => (
    <div className="gr-sidebar">
      {tab==='friends'&&<><div className="gr-tab-top"><div className="gr-tab-top-title">친구</div><div className="gr-tab-top-actions"><button className="gr-tab-top-btn" onClick={()=>{navigate('/more/add-friend');}}><I n="userPlus" size={20}/></button><button className="gr-tab-top-btn" onClick={()=>setSearchQ(searchQ?'':'.')}><I n="search" size={20}/></button></div></div>
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
              {friendSuggestions.length>0&&!q&&<div><div className="gr-section-label">👋 친구추천 {friendSuggestions.length}</div><div className="gr-suggest-scroll">{friendSuggestions.map(s=><div key={s.id} className="gr-suggest-card" onClick={()=>setProfilePopup(s)}><Avatar name={s.nickname} size={52} src={s.profileImg}/><div className="gr-suggest-name">{s.nickname}</div></div>)}</div></div>}
              {birthdayF.length>0&&<div><div className="gr-section-label">🎂 생일인 친구 {birthdayF.length}</div>{birthdayF.map(f=> <div key={f.id} className={`gr-friend-row ${selectedId===f.id?'active':''}`} onClick={()=>openProfile(f.id)}><Avatar name={f.nickname} size={44} src={f.profileImg}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname} 🎂</div><div className="gr-friend-status">오늘 생일이에요!</div></div></div>)}</div>}
              {updatedF.length>0&&!q&&<div><div className="gr-section-label">업데이트한 친구 {updatedF.length}</div>{updatedF.map(f=> <div key={f.id} className={`gr-friend-row ${selectedId===f.id?'active':''}`} onClick={()=>openProfile(f.id)}><Avatar name={f.nickname} size={44} src={f.profileImg}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname}</div><div className="gr-friend-status">{f.statusMsg}</div></div></div>)}</div>}
              {favF.length>0&&<div><div className="gr-section-label">⭐ 즐겨찾는 친구 {favF.length}</div>{favF.map(f=> <div key={f.id} className={`gr-friend-row ${selectedId===f.id?'active':''}`} onClick={()=>openProfile(f.id)}><Avatar name={f.nickname} size={44} src={f.profileImg}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname} {!f.isPublic&&<I n="lock" size={11} color="var(--gr-t3)"/>}</div><div className="gr-friend-status">{f.statusMsg}</div></div></div>)}</div>}
              <div className="gr-section-label">친구 {filtered.length}</div>
              {filtered.map(f=> <div key={f.id} className={`gr-friend-row ${selectedId===f.id?'active':''}`} onClick={()=>openProfile(f.id)}><div className="gr-avatar-wrap">{f.updatedAt&&(Date.now()-f.updatedAt)<86400000&&<span className="gr-new-dot"/>}<Avatar name={f.nickname} size={44} src={f.profileImg}/></div><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname} {f.favorite&&<I n="starFill" size={11} color="#cc222c"/>}{!f.isPublic&&<I n="lock" size={11} color="var(--gr-t3)"/>}</div><div className="gr-friend-status">{f.statusMsg}</div></div></div>)}
            </div>;
          })()}
        </div></>}
      {tab==='rooms'&&<><div className="gr-tab-top"><div className="gr-tab-top-title">캘린더</div><div className="gr-tab-top-actions"><button className="gr-tab-top-btn"><I n="search" size={20}/></button><button className="gr-tab-top-btn" onClick={()=>{navigate('/calendar/new');}}><I n="plus" size={20}/></button></div></div><div className="gr-tab-body">{rooms.map(r=> <div key={r.id} className={`gr-room-row ${selectedId===r.id&&page==='room'?'active':''}`} onClick={()=>openRoom(r.id)}><div className="gr-avatar-wrap">{roomHasUpdate(r)&&<span className="gr-new-dot"/>}<Avatar name={r.name} size={52} color={r.isPersonal?'var(--gr-acc)':undefined} src={r.thumbnailUrl}/></div><div className="gr-room-info"><div className="gr-room-name">{r.name}{r.isPersonal&&<span className="gr-badge-my">MY</span>}{!r.isPublic&&<I n="lock" size={12} color="var(--gr-t3)"/>}</div><div className="gr-room-preview">{r.nearestSchedule||r.desc}</div></div><div className="gr-room-meta">{r.newCount>0&&<div className="gr-room-new">{r.newCount}</div>}<div className="gr-room-members"><I n="users" size={12} color="var(--gr-t3)"/> {r.members.length}</div></div></div>)}</div></>}
      {tab==='alarm'&&<><div className="gr-tab-top"><div className="gr-tab-top-title">알림</div><div className="gr-tab-top-actions"/></div><div className="gr-tab-body">
        {notifications.length===0?<div style={{padding:40,textAlign:'center',color:'var(--gr-t3)',fontSize:13}}>새로운 알림이 없습니다</div>
        :notifications.map((n,i)=>{
          const isUnread = n.createdAt > lastReadAlarm;
          const typeLabel = {schedule:'일정',memo:'메모',todo:'할일',diary:'다이어리'}[n.type]||'';
          const timeAgo = (()=>{const d=Date.now()-n.createdAt;if(d<60000)return '방금';if(d<3600000)return Math.floor(d/60000)+'분 전';if(d<86400000)return Math.floor(d/3600000)+'시간 전';return Math.floor(d/86400000)+'일 전';})();
          const creator = (()=>{for(const f of friends){if(f.id===n.createdBy)return f;}return null;})();
          const creatorName = creator?.nickname || '멤버';
          return <div key={`${n.type}-${n.createdAt}-${i}`} className={`gr-alarm-item ${isUnread?'unread':''}`} onClick={()=>navigate(`/calendar/${n.roomId}/cal`)}>
            <div className="gr-alarm-icon"><I n={n.type==='schedule'?'cal':n.type==='memo'?'edit':n.type==='todo'?'check':'book'} size={18} color={isUnread?'var(--gr-acc)':'var(--gr-t3)'}/></div>
            <div className="gr-alarm-content">
              <div className="gr-alarm-title"><strong>{creatorName}</strong>님이 <strong>{n.roomName}</strong>에 {typeLabel}을 추가했습니다</div>
              <div className="gr-alarm-sub">{n.title}{n.title?' · ':''}{timeAgo}</div>
            </div>
          </div>;
        })}
      </div></>}
      {tab==='more'&&<><div className="gr-tab-top"><div className="gr-tab-top-title">더보기</div><div className="gr-tab-top-actions"/></div><div className="gr-tab-body" style={{padding:20}}>
        <div className="gr-more-item" onClick={()=>{navigate('/more/info');}}><I n="info" size={20}/><span>내 정보</span></div>
        <div className="gr-more-item" onClick={()=>{navigate('/more/add-friend');}}><I n="link" size={20}/><span>친구 추가 코드</span></div>
        <div className="gr-more-item" onClick={()=>{navigate('/more/notifications');}}><I n="bell" size={20}/><span>알림 설정</span></div>
        <div className="gr-more-item" onClick={()=>{navigate('/more/storage');}}><I n="folder" size={20}/><span>용량</span></div>
        <div className="gr-more-item" onClick={()=>{navigate('/more/trash');}}><I n="trash" size={20}/><span>휴지통</span></div>
        <div className="gr-more-item" onClick={()=>{navigate('/more/settings');}}><I n="gear" size={20}/><span>설정</span></div>
      </div></>}
      <div className="gr-btab"><button className={`gr-btab-btn ${tab==='friends'?'on':''}`} onClick={()=>{if(isWide)navigate('/profile');else navigate('/');}}><I n="user" size={22}/><span>친구</span></button><button className={`gr-btab-btn ${tab==='rooms'?'on':''}`} onClick={()=>{if(isWide){const myRoom=rooms.find(r=>r.isPersonal);navigate(myRoom?`/calendar/${myRoom.id}/cal`:'/calendar');}else navigate('/calendar');}}><I n="cal" size={22}/><span>캘린더</span></button><button className={`gr-btab-btn ${tab==='alarm'?'on':''}`} onClick={()=>{const now=Date.now();setLastReadAlarm(now);localStorage.setItem('gr_last_read_alarm',String(now));navigate('/alarm');}}><div className="gr-btab-bell-wrap"><I n="bell" size={22}/>{unreadAlarmCount>0&&<span className="gr-btab-badge">{unreadAlarmCount>99?'99+':unreadAlarmCount}</span>}</div><span>알림</span></button><button className={`gr-btab-btn ${tab==='more'?'on':''}`} onClick={()=>{if(isWide)navigate('/more/info');else navigate('/more');}}><I n="more" size={22}/><span>더보기</span></button></div>
    </div>
  );

  const ProfilePopup = () => {
    if (!profilePopup) return null;
    const p = profilePopup;
    const isFriend = friends.some(f => f.id === p.id);
    return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setProfilePopup(null)}>
      <div style={{width:'90%',maxWidth:320,borderRadius:20,overflow:'hidden',background:'var(--gr-bg)'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:'100%',aspectRatio:'1/1',background:p.profileBg?`url(${p.profileBg}) center/cover no-repeat`:'linear-gradient(135deg,#4A90D9 0%,#00B4D8 100%)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <button className="gr-icon-btn" onClick={()=>setProfilePopup(null)} style={{position:'absolute',top:8,right:8,color:'#fff'}}><I n="x" size={18}/></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'0 20px 20px',marginTop:-44,position:'relative',zIndex:2}}>
          <div style={{width:88,height:88,borderRadius:'40%',border:'3px solid var(--gr-bg)',overflow:'hidden',background:'var(--gr-bg2)',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
            {p.profileImg?<img src={p.profileImg} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<Avatar name={p.nickname} size={88}/>}
          </div>
          <div style={{fontSize:18,fontWeight:700,marginTop:8}}>{p.nickname}</div>
          <div style={{fontSize:13,color:'var(--gr-t3)',marginTop:2}}>{p.statusMsg||''}</div>
          {!isFriend && p.id!==userId && <button style={{marginTop:14,padding:'8px 28px',fontSize:13,borderRadius:20,fontWeight:600,color:'#fff',background:'var(--gr-acc)',border:'none',cursor:'pointer'}} onClick={async()=>{await addFriendById(p.id);setFriendSuggestions(prev=>prev.filter(x=>x.id!==p.id));setProfilePopup(null);}}>친구 추가</button>}
          {isFriend && <div style={{marginTop:14,fontSize:13,color:'var(--gr-t3)'}}>이미 친구입니다</div>}
        </div>
      </div>
    </div>;
  };

  const detail = renderDetail();
  if (isWide) return (<AppProvider value={appCtx}><div className="gr-root">{joinModal&&<JoinModal/>}{profilePopup&&<ProfilePopup/>}<div className="gr-layout-wide">{renderSidebar()}<div className="gr-main">{detail || <div className="gr-empty-main"><I n="cal" size={48} color="var(--gr-t3)"/><div style={{marginTop:12,fontSize:16,color:'var(--gr-t3)'}}>캘린더 또는 친구를 선택하세요</div></div>}</div></div></div></AppProvider>);
  return (<AppProvider value={appCtx}><div className="gr-root">{joinModal&&<JoinModal/>}{profilePopup&&<ProfilePopup/>}{detail || renderSidebar()}</div></AppProvider>);
}
