import { useState, useEffect, useMemo } from "react";

const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtTime = ts => { const d = new Date(ts); return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
const DAYS = ['일','월','화','수','목','금','토'];
const MO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const COLORS = ['#4A90D9','#F09819','#27AE60','#8E44AD','#E74C3C','#00B4D8','#E91E63','#009688','#795548','#607D8B'];

function useBreakpoint() {
  const calc = () => window.innerWidth <= 480 ? 'mobile' : window.innerWidth <= 1024 ? 'tablet' : 'desktop';
  const [bp, setBp] = useState(calc);
  useEffect(() => { const h = () => setBp(calc()); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return bp;
}

const I = ({n, size=20, color}) => {
  const s = {width:size, height:size, display:'inline-block', verticalAlign:'middle'};
  const p = {stroke:color||'currentColor', strokeWidth:2, fill:'none', strokeLinecap:'round', strokeLinejoin:'round'};
  const icons = {
    search:<svg style={s} viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    userPlus:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    user:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    users:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    plus:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    back:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    left:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="15 18 9 12 15 6"/></svg>,
    right:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="9 6 15 12 9 18"/></svg>,
    cal:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    edit:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    check:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    wallet:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
    bell:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    book:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
    pin:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z"/></svg>,
    lock:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    gear:<svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    link:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    trash:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
    more:<svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></svg>,
    msg:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    clock:<svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    star:<svg style={s} viewBox="0 0 24 24" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    starFill:<svg style={s} viewBox="0 0 24 24" stroke={color||'currentColor'} strokeWidth="2" fill={color||'currentColor'} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    image:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    pen:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
    camera:<svg style={s} viewBox="0 0 24 24" {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    list:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    grid:<svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  };
  return icons[n] || null;
};

function Avatar({name,size=44,color}){
  const cs=['#4A90D9','#F09819','#27AE60','#8E44AD','#E74C3C','#00B4D8','#E91E63','#009688'];
  const bg=color||cs[Math.abs(name?.charCodeAt(0)||0)%cs.length];
  return <div style={{width:size,height:size,borderRadius:size*.32,background:bg,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:size*.4,fontWeight:700,flexShrink:0}}>{name?.charAt(0)||'?'}</div>;
}
function Toggle({on,toggle}){ return <button className={`gr-tsw ${on?'on':'off'}`} onClick={e=>{e.stopPropagation();toggle();}}/>; }

const INIT_FRIENDS=[
  {id:'f1',nickname:'누누리',statusMsg:'좋네',isPublic:true,birthday:'03-15',favorite:false,bio:'',profileImg:null,profileBg:null,updatedAt:Date.now()-3600000},
  {id:'f2',nickname:'마이썬',statusMsg:'☀️💜',isPublic:true,birthday:'03-30',favorite:true,bio:'',profileImg:null,profileBg:null,updatedAt:Date.now()-86400000},
  {id:'f3',nickname:'김지윤',statusMsg:'',isPublic:false,birthday:'12-25',favorite:false,bio:'',profileImg:null,profileBg:null,updatedAt:null},
];
const ALL_MENUS=[{id:'cal',icon:'cal',label:'캘린더'},{id:'memo',icon:'edit',label:'메모'},{id:'todo',icon:'check',label:'할일'},{id:'diary',icon:'book',label:'피드'},{id:'budget',icon:'wallet',label:'가계부'},{id:'alarm',icon:'bell',label:'알림'}];
const DEF_SETTINGS = {
  schCats:[{id:'sc1',name:'업무',color:'#4A90D9'},{id:'sc2',name:'개인',color:'#F09819'},{id:'sc3',name:'건강',color:'#27AE60'},{id:'sc4',name:'공부',color:'#8E44AD'},{id:'sc5',name:'소셜',color:'#00B4D8'},{id:'sc6',name:'기타',color:'#95A5A6'}],
  expCats:[{id:'ec1',name:'식비'},{id:'ec2',name:'교통'},{id:'ec3',name:'쇼핑'},{id:'ec4',name:'의료'},{id:'ec5',name:'기타'}],
  incCats:[{id:'ic1',name:'급여'},{id:'ic2',name:'부수입'},{id:'ic3',name:'기타'}],
};
const INIT_ROOMS=[
  {id:'r0',name:'내 캘린더',desc:'개인 일정',isPersonal:true,isPublic:true,members:['me'],newCount:0,nearestSchedule:null,menus:{cal:true,memo:true,todo:true,diary:true,budget:true,alarm:true},settings:{...DEF_SETTINGS},schedules:[],memos:[],todos:[],diaries:[]},
  {id:'r1',name:'가족 캘린더',desc:'우리 가족 일정',isPersonal:false,isPublic:false,members:['me','f1','f2'],newCount:3,nearestSchedule:'4/2 아들 병원',menus:{cal:true,memo:true,todo:true,diary:false,budget:true,alarm:true},settings:{...DEF_SETTINGS},schedules:[],memos:[],todos:[],diaries:[]},
  {id:'r2',name:'ROODIM 업무',desc:'루딤 업무 스케줄',isPersonal:false,isPublic:false,members:['me','f3'],newCount:1,nearestSchedule:'4/1 미팅 14:00',menus:{cal:true,memo:true,todo:true,diary:false,budget:false,alarm:true},settings:{...DEF_SETTINGS},schedules:[],memos:[],todos:[],diaries:[]},
];

export default function App(){
  const bp = useBreakpoint();
  const isWide = bp === 'desktop' || bp === 'tablet';
  const [tab, setTab] = useState('friends');
  const [page, setPage] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [me, setMe] = useState({id:'me',nickname:'리',statusMsg:'👑박 + 👧이 = 👶도',linkCode:'goroom-me-001',bio:'',profileImg:null,profileBg:null,birthday:'01-01'});
  const [friends, setFriends] = useState(INIT_FRIENDS);
  const [rooms, setRooms] = useState(INIT_ROOMS);
  const [roomTab, setRoomTab] = useState('cal');
  const [subPage, setSubPage] = useState(null);

  const openProfile = (id) => { setSelectedId(id); setPage(id==='me'?'profile':'friend-profile'); };
  const openRoom = (id) => { setSelectedId(id); setRoomTab('cal'); setSubPage(null); setPage('room'); };
  const goBack = () => { if(subPage){ setSubPage(null); } else { setPage(null); setSelectedId(null); setSchDetail(null); }};
  const updateRoom = (rid,fn) => setRooms(p=>p.map(r=>r.id===rid?fn(r):r));

  const toggleFav = (fid) => setFriends(p=>p.map(f=>f.id===fid?{...f,favorite:!f.favorite}:f));
  const [searchQ, setSearchQ] = useState('');
  const [editProfile, setEditProfile] = useState(false);
  const [schDetail, setSchDetail] = useState(null);

  const renderDetail = () => {
    const sb = !isWide;

    /* 스케줄 상세 */
    if(page==='sch-detail' && schDetail){
      const s = schDetail;
      return <div className="gr-panel">
        <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">스케줄 상세</div><div style={{width:28}}/></div>
        <div className="gr-pg-body">
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}><div style={{width:6,height:32,borderRadius:3,background:s.color||'var(--gr-acc)'}}/><div><div style={{fontSize:18,fontWeight:700}}>{s.title}</div><div style={{fontSize:13,color:'var(--gr-t3)'}}>{s.date} {s.time||''}</div></div></div>
          {s.memo&&<div className="gr-det-section"><div className="gr-det-label">메모</div><div style={{fontSize:14,color:'var(--gr-t2)',whiteSpace:'pre-wrap'}}>{s.memo}</div></div>}
          {s.todos?.length>0&&<div className="gr-det-section"><div className="gr-det-label">할 일 ({s.todos.filter(t=>t.done).length}/{s.todos.length})</div>{s.todos.map(t=><div key={t.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}><div style={{width:18,height:18,borderRadius:'50%',border:'2px solid '+(t.done?'var(--gr-acc)':'var(--gr-brd)'),background:t.done?'var(--gr-acc)':'none',display:'flex',alignItems:'center',justifyContent:'center'}}>{t.done&&<I n="check" size={10} color="#fff"/>}</div><span style={{fontSize:14,textDecoration:t.done?'line-through':'none',color:t.done?'var(--gr-t3)':'var(--gr-text)'}}>{t.text}</span></div>)}</div>}
          {s.dday&&<div className="gr-det-section"><div className="gr-det-label">D-day</div><div style={{fontSize:24,fontWeight:800,color:'var(--gr-acc)'}}>D-{Math.max(0,Math.ceil((new Date(s.date)-new Date())/864e5))}</div></div>}
          {s.repeat&&<div className="gr-det-section"><div className="gr-det-label">반복</div><div style={{fontSize:14}}>{{daily:'매일',weekly:'매주',monthly:'매월',yearly:'매년',custom:`${s.repeat.interval}일마다`}[s.repeat.type]}{s.repeat.endDate?` ~ ${s.repeat.endDate}`:' (계속)'}</div></div>}
          {s.alarm&&<div className="gr-det-section"><div className="gr-det-label">알람</div><div style={{fontSize:14}}>🔔 {{['10m']:'10분 전',['30m']:'30분 전',['1h']:'1시간 전',['1d']:'하루 전'}[s.alarm.before]||s.alarm.before}{s.alarm.message?` — ${s.alarm.message}`:''}</div></div>}
          {s.budget&&<div className="gr-det-section"><div className="gr-det-label">가계부</div><div style={{fontSize:18,fontWeight:700,color:s.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}>{s.budget.type==='income'?'+':'-'}{s.budget.amount?.toLocaleString()}원</div>{s.budget.bCatName&&<div style={{fontSize:12,color:'var(--gr-t3)',marginTop:4}}>{s.budget.bCatName}</div>}</div>}
        </div>
      </div>;
    }

    /* 내 프로필 — 인라인 편집 모드 */
    if(page==='profile'){
      const myRoom=rooms.find(r=>r.isPersonal);
      const handleImg=(e,key)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setMe(p=>({...p,[key]:ev.target.result}));r.readAsDataURL(f);};
      return <div className="gr-panel">
        {/* 배경 */}
        <div className="gr-profile-bg" style={{background:me.profileBg?`url(${me.profileBg}) center/cover`:'linear-gradient(135deg,#F5A928 0%,#F09819 100%)'}}>
          {sb&&<button className="gr-icon-btn" onClick={goBack} style={{position:'absolute',top:12,left:12,color:'#fff',zIndex:3}}><I n="back" size={20}/></button>}
          <div className="gr-profile-top-bar">
            {editProfile && <label className="gr-profile-top-btn-s"><I n="camera" size={16} color="#333"/> 배경<input type="file" accept="image/*" onChange={e=>handleImg(e,'profileBg')} style={{display:'none'}}/></label>}
            {editProfile ? <button className="gr-profile-top-btn" onClick={()=>setEditProfile(false)}>완료</button> : <button className="gr-profile-top-btn" onClick={()=>setEditProfile(true)}>프로필 편집</button>}
          </div>
        </div>
        {/* 프로필 정보 */}
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
        <MiniCal schedules={myRoom?.schedules||[]} onSchClick={(s)=>{setSchDetail(s);setPage('sch-detail');}}/>
      </div>;
    }

    /* 친구 프로필 */
    if(page==='friend-profile'){
      const f=friends.find(x=>x.id===selectedId); if(!f) return null;
      return <div className="gr-panel">
        <div className="gr-profile-bg" style={{background:f.profileBg?`url(${f.profileBg}) center/cover`:'linear-gradient(135deg,#4A90D9 0%,#00B4D8 100%)'}}>
          {sb&&<button className="gr-icon-btn" onClick={goBack} style={{position:'absolute',top:12,left:12,color:'#fff'}}><I n="back" size={20}/></button>}
          <button className="gr-profile-fav-btn" onClick={()=>toggleFav(f.id)}>{f.favorite?<I n="starFill" size={22} color="#F5A928"/>:<I n="star" size={22} color="#fff"/>}</button>
        </div>
        <div className="gr-profile-info">
          <div className="gr-profile-avatar">{f.profileImg?<img src={f.profileImg} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} alt=""/>:<Avatar name={f.nickname} size={80}/>}</div>
          <div className="gr-profile-name">{f.nickname}</div>
          <div className="gr-profile-status">{f.statusMsg||'상태메시지 없음'}</div>
          {f.bio&&<div className="gr-profile-bio">{f.bio}</div>}
        </div>
        {f.isPublic?<MiniCal schedules={[]}/>:<div className="gr-lock"><I n="lock" size={40} color="var(--gr-t3)"/><div style={{fontSize:16,fontWeight:700,color:'var(--gr-t2)'}}>비공개</div><div style={{fontSize:13,color:'var(--gr-t3)'}}>캘린더를 공개하지 않았습니다</div></div>}
      </div>;
    }

    if(page==='add-friend') return <div className="gr-panel"><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">친구 추가</div><div style={{width:28}}/></div><div className="gr-pg-body"><div className="gr-pg-label">친구 추가 코드 입력</div><input className="gr-input" placeholder="코드를 입력하세요" autoFocus/><button className="gr-btn-primary" style={{marginTop:12}}>추가하기</button><div className="gr-divider"><span>내 코드</span></div><div className="gr-code-box"><span>{me.linkCode}</span><button className="gr-btn-copy" onClick={()=>{navigator.clipboard?.writeText(me.linkCode);alert('복사됨!');}}>복사</button></div></div></div>;
    if(page==='room'){
      const room=rooms.find(r=>r.id===selectedId); if(!room) return null;
      return <CalRoom room={room} goBack={goBack} roomTab={roomTab} setRoomTab={setRoomTab} friends={friends} subPage={subPage} setSubPage={setSubPage} updateRoom={updateRoom} sb={sb} me={me} onSchClick={(s)=>{setSchDetail(s);setPage('sch-detail');}}/>;
    }
    if(page==='add-room') return <AddRoomPage goBack={goBack} setRooms={setRooms} sb={sb} friends={friends}/>;
    return null;
  };

  const renderSidebar = () => (
    <div className="gr-sidebar">
      {tab==='friends'&&<><div className="gr-tab-top"><div className="gr-tab-top-title">친구</div><div className="gr-tab-top-actions"><button className="gr-tab-top-btn" onClick={()=>setPage('add-friend')}><I n="userPlus" size={20}/></button><button className="gr-tab-top-btn" onClick={()=>setSearchQ(searchQ?'':'.')}><I n="search" size={20}/></button></div></div>
        {searchQ!==''&&<div style={{padding:'0 20px 8px'}}><input className="gr-input" value={searchQ==='.'?'':searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="친구 검색" autoFocus style={{padding:'8px 12px',fontSize:13}}/></div>}
        <div className="gr-tab-body">
          <div className="gr-friend-me" onClick={()=>openProfile('me')}><Avatar name={me.nickname} size={52}/><div className="gr-friend-info"><div className="gr-friend-name">{me.nickname}</div><div className="gr-friend-status">{me.statusMsg}</div></div></div>
          <div className="gr-divider-line"/>
          {(()=>{
            const today=`${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
            const q=searchQ&&searchQ!=='.'?searchQ.toLowerCase():'';
            const filtered=q?friends.filter(f=>f.nickname.toLowerCase().includes(q)):friends;
            const birthdayF=filtered.filter(f=>f.birthday===today);
            const updatedF=filtered.filter(f=>f.updatedAt&&(Date.now()-f.updatedAt)<86400000*7);
            const favF=filtered.filter(f=>f.favorite);
            return <div>
              {birthdayF.length>0&&<div><div className="gr-section-label">🎂 생일인 친구 {birthdayF.length}</div>{birthdayF.map(f=> <div key={f.id} className={`gr-friend-row ${selectedId===f.id?'active':''}`} onClick={()=>openProfile(f.id)}><Avatar name={f.nickname} size={44}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname} 🎂</div><div className="gr-friend-status">오늘 생일이에요!</div></div></div>)}</div>}
              {updatedF.length>0&&!q&&<div><div className="gr-section-label">업데이트한 친구 {updatedF.length}</div>{updatedF.map(f=> <div key={f.id} className={`gr-friend-row ${selectedId===f.id?'active':''}`} onClick={()=>openProfile(f.id)}><Avatar name={f.nickname} size={44}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname}</div><div className="gr-friend-status">{f.statusMsg}</div></div></div>)}</div>}
              {favF.length>0&&<div><div className="gr-section-label">⭐ 즐겨찾는 친구 {favF.length}</div>{favF.map(f=> <div key={f.id} className={`gr-friend-row ${selectedId===f.id?'active':''}`} onClick={()=>openProfile(f.id)}><Avatar name={f.nickname} size={44}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname} {!f.isPublic&&<I n="lock" size={11} color="var(--gr-t3)"/>}</div><div className="gr-friend-status">{f.statusMsg}</div></div></div>)}</div>}
              <div className="gr-section-label">친구 {filtered.length}</div>
              {filtered.map(f=> <div key={f.id} className={`gr-friend-row ${selectedId===f.id?'active':''}`} onClick={()=>openProfile(f.id)}><Avatar name={f.nickname} size={44}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname} {f.favorite&&<I n="starFill" size={11} color="#F5A928"/>}{!f.isPublic&&<I n="lock" size={11} color="var(--gr-t3)"/>}</div><div className="gr-friend-status">{f.statusMsg}</div></div></div>)}
            </div>;
          })()}
        </div></>}
      {tab==='rooms'&&<><div className="gr-tab-top"><div className="gr-tab-top-title">캘린더</div><div className="gr-tab-top-actions"><button className="gr-tab-top-btn"><I n="search" size={20}/></button><button className="gr-tab-top-btn" onClick={()=>setPage('add-room')}><I n="plus" size={20}/></button></div></div><div className="gr-tab-body">{rooms.map(r=> <div key={r.id} className={`gr-room-row ${selectedId===r.id&&page==='room'?'active':''}`} onClick={()=>openRoom(r.id)}><Avatar name={r.name} size={52} color={r.isPersonal?'var(--gr-acc)':undefined}/><div className="gr-room-info"><div className="gr-room-name">{r.name}{r.isPersonal&&<span className="gr-badge-my">MY</span>}{!r.isPublic&&<I n="lock" size={12} color="var(--gr-t3)"/>}</div><div className="gr-room-preview">{r.nearestSchedule||r.desc}</div></div><div className="gr-room-meta">{r.newCount>0&&<div className="gr-room-new">{r.newCount}</div>}<div className="gr-room-members"><I n="users" size={12} color="var(--gr-t3)"/> {r.members.length}</div></div></div>)}</div></>}
      {tab==='more'&&<><div className="gr-tab-top"><div className="gr-tab-top-title">더보기</div><div className="gr-tab-top-actions"/></div><div className="gr-tab-body" style={{padding:20}}><div className="gr-more-item" onClick={()=>openProfile('me')}><I n="user" size={20}/><span>내 프로필</span></div><div className="gr-more-item"><I n="link" size={20}/><span>친구 추가 코드</span></div><div className="gr-more-item"><I n="bell" size={20}/><span>알림 설정</span></div><div className="gr-more-item"><I n="gear" size={20}/><span>설정</span></div></div></>}
      <div className="gr-btab"><button className={`gr-btab-btn ${tab==='friends'?'on':''}`} onClick={()=>setTab('friends')}><I n="user" size={22}/><span>친구</span></button><button className={`gr-btab-btn ${tab==='rooms'?'on':''}`} onClick={()=>setTab('rooms')}><I n="cal" size={22}/><span>캘린더</span></button><button className={`gr-btab-btn ${tab==='more'?'on':''}`} onClick={()=>setTab('more')}><I n="more" size={22}/><span>더보기</span></button></div>
    </div>
  );

  const detail = renderDetail();
  if (isWide) return (<div className="gr-root"><style>{CSS}</style><div className="gr-layout-wide">{renderSidebar()}<div className="gr-main">{detail || <div className="gr-empty-main"><I n="cal" size={48} color="var(--gr-t3)"/><div style={{marginTop:12,fontSize:16,color:'var(--gr-t3)'}}>캘린더 또는 친구를 선택하세요</div></div>}</div></div></div>);
  return (<div className="gr-root"><style>{CSS}</style>{detail || renderSidebar()}</div>);
}

/* ProfileEdit 삭제됨 — 인라인 편집 방식으로 대체 */

function MiniCal({schedules,onSchClick}){
  const [nav,setNav]=useState(new Date()); const [sel,setSel]=useState(new Date()); const today=useMemo(()=>new Date(),[]);
  const y=nav.getFullYear(),m=nav.getMonth(),fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),dip=new Date(y,m,0).getDate();
  const cells=[]; for(let i=0;i<fd;i++) cells.push({d:dip-fd+i+1,o:true,dt:new Date(y,m-1,dip-fd+i+1)}); for(let i=1;i<=dim;i++) cells.push({d:i,o:false,dt:new Date(y,m,i)}); const rem=7-cells.length%7; if(rem<7) for(let i=1;i<=rem;i++) cells.push({d:i,o:true,dt:new Date(y,m+1,i)});
  const mv=d=>{const n=new Date(nav);n.setMonth(n.getMonth()+d);setNav(n);}; const ts=fmt(today); const ss=fmt(sel);
  const dots=ds=>schedules.filter(s=>s.date===ds).slice(0,3);
  const selSchs=schedules.filter(s=>s.date===ss);
  return <div style={{flex:1,overflowY:'auto'}}>
    <div className="gr-cal-nav"><button className="gr-cal-nav-btn" onClick={()=>mv(-1)}><I n="left" size={18}/></button><h3>{y}년 {MO[m]}</h3><button className="gr-cal-nav-btn" onClick={()=>mv(1)}><I n="right" size={18}/></button></div>
    <div className="gr-cal-head">{DAYS.map(d=><span key={d}>{d}</span>)}</div>
    <div className="gr-cal-grid">{cells.map((c,i)=>{const ds=fmt(c.dt),dd=dots(ds); return <div key={i} className={`gr-cal-cell ${c.o?'ot':''} ${ds===ts?'tod':''} ${ds===ss&&ds!==ts?'sel':''}`} onClick={()=>setSel(c.dt)}><span className="gr-cal-d">{c.d}</span>{dd.length>0&&<div className="gr-cal-dots">{dd.map((sc,j)=><span key={j} style={{background:sc.color||'var(--gr-acc)'}}/>)}</div>}</div>;})}</div>
    <div className="gr-cal-sel-info"><div className="gr-cal-sel-date">{sel.getMonth()+1}월 {sel.getDate()}일 {DAYS[sel.getDay()]}요일</div>
      {selSchs.length===0?<div className="gr-cal-empty">스케줄이 없습니다</div>:selSchs.map(sc=> <SchCard key={sc.id} sc={sc} onClick={()=>onSchClick&&onSchClick(sc)}/>)}
    </div>
  </div>;
}

function CalRoom({room,goBack,roomTab,setRoomTab,friends,subPage,setSubPage,updateRoom,sb,me,onSchClick}){
  const [sel,setSel]=useState(new Date()); const [nav,setNav]=useState(new Date()); const today=useMemo(()=>new Date(),[]);
  const activeMenus=ALL_MENUS.filter(m=>room.menus[m.id]);
  const memberList=room.members.map(id=>id==='me'?{id:'me',nickname:'나'}:friends.find(f=>f.id===id)||{id,nickname:'?'});
  const isMulti = room.members.length > 1;
  const getName = (id) => id==='me' ? (me?.nickname||'나') : (friends.find(f=>f.id===id)?.nickname||'?');

  if(subPage==='settings') return <RoomSettings room={room} updateRoom={updateRoom} friends={friends} memberList={memberList} sb={sb} goBack={()=>setSubPage(null)} setSubPage={setSubPage}/>;
  if(subPage==='invite') return <InviteMembers room={room} updateRoom={updateRoom} friends={friends} sb={sb} goBack={()=>setSubPage(null)}/>;
  if(subPage==='add-schedule') return <div className="gr-panel"><ScheduleForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} selDate={fmt(sel)} sb={sb}/></div>;
  if(subPage==='add-memo') return <div className="gr-panel"><MemoForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} sb={sb}/></div>;
  if(subPage==='add-todo') return <div className="gr-panel"><SimpleForm title="새 할일" fields={[{k:'title',l:'할 일'}]} goBack={()=>setSubPage(null)} onSave={v=>{updateRoom(room.id,r=>({...r,todos:[...r.todos,{id:uid(),text:v.title,done:false,createdAt:Date.now(),createdBy:'me',doneAt:null,doneBy:null}]}));setSubPage(null);}} sb={sb}/></div>;
  if(subPage==='add-diary') return <div className="gr-panel"><DiaryForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} sb={sb}/></div>;
  if(subPage==='add-budget') return <div className="gr-panel"><BudgetForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} sb={sb}/></div>;
  const fabMap={cal:'add-schedule',memo:'add-memo',todo:'add-todo',diary:'add-diary',budget:'add-budget'};
  return <div className="gr-panel"><div className="gr-room-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-room-top-info"><div className="gr-room-top-name">{room.name}</div><div className="gr-room-top-members">{memberList.length}명</div></div><button className="gr-icon-btn" onClick={()=>setSubPage('settings')}><I n="gear" size={18}/></button></div><div className="gr-room-tabs">{activeMenus.map(m=> <button key={m.id} className={`gr-room-tab ${roomTab===m.id?'on':''}`} onClick={()=>setRoomTab(m.id)}><I n={m.icon} size={14}/> {m.label}</button>)}</div><div className="gr-room-body">{roomTab==='cal'&&<RoomCal nav={nav} setNav={setNav} sel={sel} setSel={setSel} today={today} schedules={room.schedules} onSchClick={onSchClick}/>}{roomTab==='memo'&&<RoomMemo memos={room.memos} room={room} updateRoom={updateRoom}/>}{roomTab==='todo'&&<RoomTodo todos={room.todos} room={room} updateRoom={updateRoom} isMulti={isMulti} getName={getName}/>}{roomTab==='diary'&&<RoomDiary diaries={room.diaries} schedules={room.schedules} isMulti={isMulti} getName={getName} room={room} updateRoom={updateRoom} onSchClick={onSchClick}/>}{roomTab==='budget'&&<RoomBudget schedules={room.schedules}/>}{roomTab==='alarm'&&<div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>🔔</div>알림이 없습니다</div>}</div>{fabMap[roomTab]&&<button className="gr-fab" onClick={()=>setSubPage(fabMap[roomTab])}><I n="plus" size={24} color="#fff"/></button>}</div>;
}

function RoomSettings({room,updateRoom,friends,memberList,sb,goBack,setSubPage}){
  const [name,setName]=useState(room.name); const [desc,setDesc]=useState(room.desc); const [editing,setEditing]=useState(false);
  const [addCatName,setAddCatName]=useState(''); const [addCatColor,setAddCatColor]=useState('#4A90D9');
  const [addExpName,setAddExpName]=useState(''); const [addIncName,setAddIncName]=useState('');
  const st = room.settings || DEF_SETTINGS;
  const saveInfo=()=>{updateRoom(room.id,r=>({...r,name:name.trim()||r.name,desc:desc.trim()}));setEditing(false);};
  const updSettings=(fn)=>updateRoom(room.id,r=>({...r,settings:fn(r.settings||DEF_SETTINGS)}));
  const addSchCat=()=>{if(!addCatName.trim())return; updSettings(s=>({...s,schCats:[...s.schCats,{id:uid(),name:addCatName.trim(),color:addCatColor}]})); setAddCatName('');};
  const delSchCat=(id)=>updSettings(s=>({...s,schCats:s.schCats.filter(c=>c.id!==id)}));
  const addExpCat=()=>{if(!addExpName.trim())return; updSettings(s=>({...s,expCats:[...s.expCats,{id:uid(),name:addExpName.trim()}]})); setAddExpName('');};
  const delExpCat=(id)=>updSettings(s=>({...s,expCats:s.expCats.filter(c=>c.id!==id)}));
  const addIncCat=()=>{if(!addIncName.trim())return; updSettings(s=>({...s,incCats:[...s.incCats,{id:uid(),name:addIncName.trim()}]})); setAddIncName('');};
  const delIncCat=(id)=>updSettings(s=>({...s,incCats:s.incCats.filter(c=>c.id!==id)}));

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">캘린더 설정</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      {/* 캘린더 정보 */}
      <div className="gr-pg-label">캘린더 정보 {!editing&&<button className="gr-icon-btn-sm" onClick={()=>setEditing(true)}><I n="edit" size={14}/></button>}</div>
      {editing ? <div>
        <input className="gr-input" value={name} onChange={e=>setName(e.target.value)} placeholder="이름" style={{marginBottom:8}}/>
        <input className="gr-input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="설명"/>
        <div style={{display:'flex',gap:6,marginTop:8}}><button className="gr-btn-sm" onClick={saveInfo}>저장</button><button className="gr-btn-sm-outline" onClick={()=>{setName(room.name);setDesc(room.desc);setEditing(false);}}>취소</button></div>
      </div> : <div>
        <div className="gr-set-row"><span className="gr-set-label">이름</span><span className="gr-set-val">{room.name}</span></div>
        <div className="gr-set-row"><span className="gr-set-label">설명</span><span className="gr-set-val">{room.desc||'-'}</span></div>
      </div>}
      <div className="gr-set-row"><span className="gr-set-label">공개</span><Toggle on={room.isPublic} toggle={()=>updateRoom(room.id,r=>({...r,isPublic:!r.isPublic}))}/></div>

      {/* 멤버 */}
      <div className="gr-pg-label" style={{marginTop:20}}>멤버 ({memberList.length}) <button className="gr-btn-invite" onClick={()=>setSubPage('invite')}><I n="userPlus" size={14} color="#fff"/> 초대</button></div>
      {memberList.map(m=> <div key={m.id} className="gr-set-member"><Avatar name={m.nickname} size={32}/><span>{m.nickname}</span>{m.id!=='me'&&<button className="gr-icon-btn-sm" style={{marginLeft:'auto'}} onClick={()=>updateRoom(room.id,r=>({...r,members:r.members.filter(x=>x!==m.id)}))}><I n="x" size={14} color="var(--gr-exp)"/></button>}</div>)}

      {/* 기능 ON/OFF + 세부설정 */}
      <div className="gr-pg-label" style={{marginTop:20}}>기능 ON/OFF</div>

      {ALL_MENUS.map(m=> <div key={m.id}>
        <div className="gr-set-row"><span className="gr-set-label"><I n={m.icon} size={16}/> {m.label}</span><Toggle on={room.menus[m.id]} toggle={()=>updateRoom(room.id,r=>({...r,menus:{...r.menus,[m.id]:!r.menus[m.id]}}))}/></div>

        {/* 캘린더 ON → 카테고리 관리 */}
        {m.id==='cal' && room.menus.cal && <div className="gr-setting-detail">
          <div className="gr-setting-detail-title">스케줄 카테고리</div>
          <div className="gr-tag-list">{st.schCats.map(c=> <div key={c.id} className="gr-tag-item">
            <span className="gr-tag-dot" style={{background:c.color}}/><span>{c.name}</span>
            <button className="gr-icon-btn-sm" onClick={()=>delSchCat(c.id)}><I n="x" size={12} color="var(--gr-t3)"/></button>
          </div>)}</div>
          <div className="gr-tag-add">
            <div className="gr-clr-row" style={{marginBottom:6}}>{COLORS.slice(0,8).map(c=> <button key={c} className={`gr-clr-b-sm ${addCatColor===c?'on':''}`} style={{background:c}} onClick={()=>setAddCatColor(c)}/>)}</div>
            <div style={{display:'flex',gap:6}}><input className="gr-input" value={addCatName} onChange={e=>setAddCatName(e.target.value)} placeholder="카테고리 이름" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addSchCat()}/><button className="gr-btn-sm" onClick={addSchCat}>추가</button></div>
          </div>
        </div>}

        {/* 가계부 ON → 지출/수입 카테고리 관리 */}
        {m.id==='budget' && room.menus.budget && <div className="gr-setting-detail">
          <div className="gr-setting-detail-title">지출 카테고리</div>
          <div className="gr-tag-list">{st.expCats.map(c=> <div key={c.id} className="gr-tag-item">
            <span>{c.name}</span>
            <button className="gr-icon-btn-sm" onClick={()=>delExpCat(c.id)}><I n="x" size={12} color="var(--gr-t3)"/></button>
          </div>)}</div>
          <div style={{display:'flex',gap:6,marginBottom:12}}><input className="gr-input" value={addExpName} onChange={e=>setAddExpName(e.target.value)} placeholder="지출 카테고리" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addExpCat()}/><button className="gr-btn-sm" onClick={addExpCat}>추가</button></div>

          <div className="gr-setting-detail-title">수입 카테고리</div>
          <div className="gr-tag-list">{st.incCats.map(c=> <div key={c.id} className="gr-tag-item">
            <span>{c.name}</span>
            <button className="gr-icon-btn-sm" onClick={()=>delIncCat(c.id)}><I n="x" size={12} color="var(--gr-t3)"/></button>
          </div>)}</div>
          <div style={{display:'flex',gap:6}}><input className="gr-input" value={addIncName} onChange={e=>setAddIncName(e.target.value)} placeholder="수입 카테고리" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addIncCat()}/><button className="gr-btn-sm" onClick={addIncCat}>추가</button></div>
        </div>}

        {/* 알림 ON → 기본 알림 설정 */}
        {m.id==='alarm' && room.menus.alarm && <div className="gr-setting-detail">
          <div style={{fontSize:12,color:'var(--gr-t3)'}}>스케줄 등록 시 알람을 설정할 수 있습니다.</div>
        </div>}
      </div>)}

      <button className="gr-btn-danger" style={{marginTop:24}}><I n="trash" size={16}/> 캘린더 삭제</button>
    </div>
  </div>;
}

function InviteMembers({room,updateRoom,friends,sb,goBack}){
  const available=friends.filter(f=>!room.members.includes(f.id));
  const invite=(fid)=>{updateRoom(room.id,r=>({...r,members:[...r.members,fid]}));goBack();};
  return <div className="gr-panel"><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">멤버 초대</div><div style={{width:28}}/></div><div className="gr-pg-body">{available.length===0?<div className="gr-empty">초대 가능한 친구가 없습니다</div>:available.map(f=> <div key={f.id} className="gr-friend-row" onClick={()=>invite(f.id)}><Avatar name={f.nickname} size={40}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname}</div><div className="gr-friend-status">{f.statusMsg}</div></div><button className="gr-btn-invite"><I n="plus" size={14} color="#fff"/> 초대</button></div>)}</div></div>;
}

function SchCard({sc,onClick}){
  const imgs=sc.images||[];
  return <div className="gr-sch-card" onClick={onClick} style={{cursor:'pointer'}}>
    {imgs.length>0&&<div className="gr-sch-thumb"><img src={imgs[0]} alt=""/>{imgs.length>1&&<span className="gr-sch-thumb-count">+{imgs.length-1}</span>}</div>}
    <div className="gr-sch-bar" style={{background:sc.color||'var(--gr-acc)'}}/>
    <div className="gr-sch-body"><div className="gr-sch-title">{sc.title}</div><div className="gr-sch-meta">{sc.time&&<span>{sc.time}</span>}{sc.memo&&<span>{sc.memo}</span>}</div>{sc.budget&&<div className="gr-sch-budget" style={{color:sc.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}>{sc.budget.type==='income'?'+':'-'}{sc.budget.amount?.toLocaleString()}원</div>}</div>
  </div>;
}

function RoomCal({nav,setNav,sel,setSel,today,schedules,onSchClick}){
  const y=nav.getFullYear(),m=nav.getMonth(),fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),dip=new Date(y,m,0).getDate();
  const ts=fmt(today),ss=fmt(sel); const cells=[];
  for(let i=0;i<fd;i++) cells.push({d:dip-fd+i+1,o:true,dt:new Date(y,m-1,dip-fd+i+1)}); for(let i=1;i<=dim;i++) cells.push({d:i,o:false,dt:new Date(y,m,i)}); const rem=7-cells.length%7; if(rem<7) for(let i=1;i<=rem;i++) cells.push({d:i,o:true,dt:new Date(y,m+1,i)});
  const mv=d=>{const n=new Date(nav);n.setMonth(n.getMonth()+d);setNav(n);}; const selSchs=schedules.filter(s=>s.date===ss); const dots=ds=>schedules.filter(s=>s.date===ds).slice(0,3);
  return <div><div className="gr-cal-nav"><button className="gr-cal-nav-btn" onClick={()=>mv(-1)}><I n="left" size={18}/></button><h3>{y}년 {MO[m]}</h3><button className="gr-cal-nav-btn" onClick={()=>mv(1)}><I n="right" size={18}/></button></div><div className="gr-cal-head">{DAYS.map(d=><span key={d}>{d}</span>)}</div><div className="gr-cal-grid">{cells.map((c,i)=>{const ds=fmt(c.dt),dd=dots(ds); return <div key={i} className={`gr-cal-cell ${c.o?'ot':''} ${ds===ts?'tod':''} ${ds===ss&&ds!==ts?'sel':''}`} onClick={()=>setSel(c.dt)}><span className="gr-cal-d">{c.d}</span>{dd.length>0&&<div className="gr-cal-dots">{dd.map((sc,j)=><span key={j} style={{background:sc.color||'var(--gr-acc)'}}/>)}</div>}</div>;})}</div><div className="gr-cal-sel-info"><div className="gr-cal-sel-date">{sel.getMonth()+1}월 {sel.getDate()}일 {DAYS[sel.getDay()]}요일</div>{selSchs.length===0?<div className="gr-cal-empty">스케줄이 없습니다</div>:selSchs.map(sc=> <SchCard key={sc.id} sc={sc} onClick={()=>onSchClick&&onSchClick(sc)}/>)}</div></div>;
}

function RoomMemo({memos,room,updateRoom}){
  const [q,setQ]=useState(''); const [viewMode,setViewMode]=useState('box');
  const togglePin=id=>updateRoom(room.id,r=>({...r,memos:r.memos.map(m=>m.id===id?{...m,pinned:!m.pinned}:m)}));
  const del=id=>updateRoom(room.id,r=>({...r,memos:r.memos.filter(m=>m.id!==id)}));
  if(!memos.length) return <div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>📝</div>메모를 추가해보세요</div>;
  const filtered=memos.filter(m=>{if(!q.trim()) return true; const kw=q.toLowerCase(); return (m.title||'').toLowerCase().includes(kw)||(m.content||'').toLowerCase().includes(kw);}); const pinned=filtered.filter(m=>m.pinned); const normal=filtered.filter(m=>!m.pinned).sort((a,b)=>b.createdAt-a.createdAt); const all=[...pinned,...normal];
  return <div style={{padding:12}}><div className="gr-memo-toolbar"><div className="gr-memo-search"><I n="search" size={14} color="var(--gr-t3)"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="메모 검색..." className="gr-memo-search-input"/></div><div className="gr-memo-view-toggle"><button className={`gr-icon-btn-sm ${viewMode==='list'?'active':''}`} onClick={()=>setViewMode('list')}><I n="list" size={16}/></button><button className={`gr-icon-btn-sm ${viewMode==='box'?'active':''}`} onClick={()=>setViewMode('box')}><I n="grid" size={16}/></button></div></div>{filtered.length===0&&<div className="gr-cal-empty">검색 결과가 없습니다</div>}{viewMode==='box'?all.map(m=> <div key={m.id} className={`gr-memo-card ${m.pinned?'pinned':''}`}><div className="gr-memo-card-top"><div className="gr-memo-title">{m.title}</div><div className="gr-memo-card-actions"><button className="gr-icon-btn-sm" onClick={()=>togglePin(m.id)}><I n="pin" size={14} color={m.pinned?'var(--gr-acc)':'var(--gr-t3)'}/></button><button className="gr-icon-btn-sm" onClick={()=>del(m.id)}><I n="trash" size={14} color="var(--gr-exp)"/></button></div></div><div className="gr-memo-preview">{m.content?.slice(0,80)}</div><div className="gr-memo-date">{fmtTime(m.createdAt)}</div></div>):all.map(m=> <div key={m.id} className={`gr-memo-list-row ${m.pinned?'pinned':''}`}>{m.pinned&&<I n="pin" size={12} color="var(--gr-acc)"/>}<div className="gr-memo-list-title">{m.title}</div><div className="gr-memo-list-date">{fmtTime(m.createdAt)}</div><button className="gr-icon-btn-sm" onClick={()=>togglePin(m.id)}><I n="pin" size={14} color={m.pinned?'var(--gr-acc)':'var(--gr-t3)'}/></button><button className="gr-icon-btn-sm" onClick={()=>del(m.id)}><I n="trash" size={14} color="var(--gr-exp)"/></button></div>)}</div>;
}

function MemoForm({goBack,room,updateRoom,sb}){
  const [title,setTitle]=useState(''); const [content,setContent]=useState('');
  const save=()=>{if(!title.trim()) return;updateRoom(room.id,r=>({...r,memos:[...r.memos,{id:uid(),title:title.trim(),content,pinned:false,createdAt:Date.now()}]}));goBack();};
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">새 메모</div><div style={{width:28}}/></div><div className="gr-pg-body"><div className="gr-pg-label">제목</div><input className="gr-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="메모 제목" autoFocus style={{marginBottom:12}}/><div className="gr-pg-label">내용</div><textarea className="gr-input" value={content} onChange={e=>setContent(e.target.value)} placeholder="내용을 입력하세요" rows={6} style={{resize:'none'}}/></div><div className="gr-save-bar"><button className="gr-save-btn" disabled={!title.trim()} onClick={save}>저장하기</button></div></div>;
}

function RoomTodo({todos,room,updateRoom,isMulti,getName}){
  const toggle=id=>updateRoom(room.id,r=>({...r,todos:r.todos.map(t=>t.id===id?{...t,done:!t.done,doneAt:!t.done?Date.now():null,doneBy:!t.done?'me':null}:t)}));
  const del=id=>updateRoom(room.id,r=>({...r,todos:r.todos.filter(t=>t.id!==id)}));
  if(!todos.length) return <div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>✅</div>할 일을 추가해보세요</div>;
  return <div style={{padding:12}}>{todos.map(t=> <div key={t.id} className="gr-todo-row">
    <button className={`gr-todo-cb ${t.done?'done':''}`} onClick={()=>toggle(t.id)}>{t.done&&<I n="check" size={14} color="#fff"/>}</button>
    <div style={{flex:1,minWidth:0}}>
      <span className={`gr-todo-text ${t.done?'done':''}`}>{t.text}</span>
      <div className="gr-todo-meta">
        {isMulti && t.createdBy && <span>{getName(t.createdBy)}</span>}
        {t.createdAt && <span>{fmtTime(t.createdAt)} 작성</span>}
        {t.done && t.doneAt && <span style={{color:'var(--gr-inc)'}}>
          {isMulti && t.doneBy && <span>{getName(t.doneBy)} · </span>}{fmtTime(t.doneAt)} 완료
        </span>}
      </div>
    </div>
    <button className="gr-todo-del" onClick={()=>del(t.id)}><I n="x" size={14}/></button>
  </div>)}</div>;
}

function ImageViewer({images,startIdx,onClose}){
  const [idx,setIdx]=useState(startIdx||0);
  return <div className="gr-img-viewer" onClick={onClose}>
    <button className="gr-img-viewer-close" onClick={onClose}><I n="x" size={24} color="#fff"/></button>
    <div className="gr-img-viewer-body" onClick={e=>e.stopPropagation()}>
      <img src={images[idx]} className="gr-img-viewer-img" alt=""/>
      {images.length>1&&<div className="gr-img-viewer-nav">
        <button className="gr-img-viewer-btn" onClick={()=>setIdx(p=>(p-1+images.length)%images.length)} disabled={images.length<=1}><I n="left" size={24} color="#fff"/></button>
        <span style={{color:'#fff',fontSize:14}}>{idx+1} / {images.length}</span>
        <button className="gr-img-viewer-btn" onClick={()=>setIdx(p=>(p+1)%images.length)} disabled={images.length<=1}><I n="right" size={24} color="#fff"/></button>
      </div>}
    </div>
  </div>;
}

function DiarySlider({images,onImgClick}){
  const ref=useState(null)[1];
  return <div className="gr-thr-slider">
    {images.map((img,i)=> <div key={i} className="gr-thr-slide" onClick={e=>{e.stopPropagation();onImgClick(i);}}>
      <img src={img} className="gr-thr-slide-img" alt=""/>
    </div>)}
    {images.length>1&&<div className="gr-thr-slide-count">{images.length} 장</div>}
  </div>;
}

function RoomDiary({diaries,schedules,isMulti,getName,room,updateRoom,onSchClick}){
  const [commentText,setCommentText]=useState('');
  const [viewerImgs,setViewerImgs]=useState(null);
  const [viewerIdx,setViewerIdx]=useState(0);
  const [replyTo,setReplyTo]=useState(null);
  const [feedMode,setFeedMode]=useState('list'); /* list | image */

  const toggleLike=(did,e)=>{
    e.stopPropagation();
    updateRoom(room.id,r=>({...r,diaries:r.diaries.map(d=>{
      if(d.id!==did) return d;
      const likes=d.likes||[];
      const already=likes.includes('me');
      return {...d,likes:already?likes.filter(x=>x!=='me'):[...likes,'me']};
    })}));
  };
  const addComment=(did)=>{
    if(!commentText.trim()) return;
    updateRoom(room.id,r=>({...r,diaries:r.diaries.map(d=>{
      if(d.id!==did) return d;
      return {...d,comments:[...(d.comments||[]),{id:uid(),text:commentText.trim(),by:'me',at:Date.now()}]};
    })}));
    setCommentText('');
  };
  const share=(d,e)=>{
    e.stopPropagation();
    const text=`${d.mood||''}${d.weather||''} ${d.title}\n${d.content?.slice(0,100)||''}`;
    if(navigator.share) navigator.share({title:d.title,text}).catch(()=>{});
    else {navigator.clipboard?.writeText(text);alert('복사됨!');}
  };
  const openViewer=(imgs,i,e)=>{e.stopPropagation();setViewerImgs(imgs);setViewerIdx(i);};

  if(!diaries.length) return <div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>📖</div>일기를 작성해보세요</div>;

  return <div className="gr-thr-feed">
    {viewerImgs&&<ImageViewer images={viewerImgs} startIdx={viewerIdx} onClose={()=>setViewerImgs(null)}/>}

    {diaries.sort((a,b)=>b.createdAt-a.createdAt).map(d=> <div key={d.id} className="gr-thr-post">
      {/* 헤더: 아바타 + 이름 + 시간 + 더보기 */}
      <div className="gr-thr-post-header">
        <Avatar name={getName(d.createdBy||'me')} size={36}/>
        <div style={{flex:1}}>
          <div className="gr-thr-post-name">{getName(d.createdBy||'me')} <span className="gr-thr-post-time">{d.createdAt?fmtTime(d.createdAt):d.date}</span></div>
          <div className="gr-thr-post-text">{d.mood||''}{d.weather||''} {d.title}</div>
        </div>
        <button className="gr-icon-btn"><I n="more" size={18}/></button>
      </div>

      {/* 본문 */}
      {d.content&&<div className="gr-thr-post-body">{d.content}</div>}

      {/* 이미지 슬라이더 */}
      {d.images&&d.images.length>0&&<DiarySlider images={d.images} onImgClick={(i)=>{setViewerImgs(d.images);setViewerIdx(i);}}/>}

      {/* 좋아요 / 댓글 / 공유 */}
      <div className="gr-thr-post-actions">
        <button className="gr-thr-act-btn" onClick={e=>toggleLike(d.id,e)}>
          {(d.likes||[]).includes('me') ? <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--gr-exp)" stroke="var(--gr-exp)" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gr-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>}
          <span>{(d.likes||[]).length||''}</span>
        </button>
        <button className="gr-thr-act-btn" onClick={e=>{e.stopPropagation();setReplyTo(replyTo===d.id?null:d.id);}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gr-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>{(d.comments||[]).length||''}</span>
        </button>
        <button className="gr-thr-act-btn" onClick={e=>share(d,e)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gr-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>

      {/* 댓글 영역 */}
      {(replyTo===d.id || (d.comments||[]).length>0) && <div className="gr-thr-comments">
        {(d.comments||[]).map(c=> <div key={c.id} className="gr-thr-comment">
          <Avatar name={getName(c.by)} size={28}/>
          <div style={{flex:1,minWidth:0}}>
            <div className="gr-thr-comment-header">
              <span className="gr-thr-comment-name">{getName(c.by)}</span>
              <span className="gr-thr-comment-time">{fmtTime(c.at)}</span>
            </div>
            <div className="gr-thr-comment-text">{c.text}</div>
          </div>
        </div>)}
        {replyTo===d.id&&<div className="gr-thr-comment-input">
          <Avatar name="나" size={28}/>
          <input className="gr-thr-comment-field" value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="댓글 달기..." onKeyDown={e=>{if(e.key==='Enter') addComment(d.id);}}/>
          <button className="gr-thr-comment-send" onClick={()=>addComment(d.id)} disabled={!commentText.trim()}>게시</button>
        </div>}
      </div>}
    </div>)}
  </div>;
}

function RoomBudget({schedules}){
  const budgets=schedules.filter(s=>s.budget); const inc=budgets.filter(s=>s.budget.type==='income').reduce((a,s)=>a+s.budget.amount,0); const exp=budgets.filter(s=>s.budget.type==='expense').reduce((a,s)=>a+s.budget.amount,0);
  return <div style={{padding:12}}><div className="gr-budget-summary"><div className="gr-budget-box"><div className="gr-budget-label">수입</div><div className="gr-budget-val" style={{color:'var(--gr-inc)'}}>+{inc.toLocaleString()}</div></div><div className="gr-budget-box"><div className="gr-budget-label">지출</div><div className="gr-budget-val" style={{color:'var(--gr-exp)'}}>-{exp.toLocaleString()}</div></div><div className="gr-budget-box"><div className="gr-budget-label">잔액</div><div className="gr-budget-val" style={{color:inc-exp>=0?'var(--gr-inc)':'var(--gr-exp)'}}>{(inc-exp).toLocaleString()}</div></div></div>{budgets.length===0?<div className="gr-cal-empty" style={{marginTop:20}}>내역이 없습니다</div>:budgets.sort((a,b)=>b.createdAt-a.createdAt).map(sc=> <div key={sc.id} className="gr-budget-row"><div className="gr-budget-dot" style={{background:sc.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}/><div className="gr-budget-info"><div style={{fontWeight:500}}>{sc.title}</div><div style={{fontSize:11,color:'var(--gr-t3)'}}>{sc.date}</div></div><div style={{fontWeight:700,color:sc.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}>{sc.budget.type==='income'?'+':'-'}{sc.budget.amount.toLocaleString()}원</div></div>)}</div>;
}

function ToggleSection({icon,iconColor,label,on,toggle,children}){
  return <div>
    <div className="gr-toggle-row" onClick={toggle}><span style={{display:'flex',alignItems:'center',gap:8}}><I n={icon} size={16} color={iconColor}/> {label}</span><Toggle on={on} toggle={toggle}/></div>
    {on && <div className="gr-toggle-body">{children}</div>}
  </div>;
}

/* SCH_CATS는 이제 room.settings.schCats에서 관리 */

function ScheduleForm({goBack,room,updateRoom,selDate,sb}){
  const st = room.settings || DEF_SETTINGS;
  const menus = room.menus;
  const [title,setTitle]=useState('');
  const [date,setDate]=useState(selDate);
  const [time,setTime]=useState('');
  const [memo,setMemo]=useState('');
  const [color,setColor]=useState(st.schCats[0]?.color||COLORS[0]);
  const [catId,setCatId]=useState(st.schCats[0]?.id||'');
  const [todos,setTodos]=useState([{id:uid(),text:''}]);
  const [hasDday,setHasDday]=useState(false);
  const [hasRepeat,setHasRepeat]=useState(false);
  const [rpType,setRpType]=useState('daily');
  const [rpInterval,setRpInterval]=useState('1');
  const [rpEnd,setRpEnd]=useState('none');
  const [rpEndDate,setRpEndDate]=useState('');
  const [alBefore,setAlBefore]=useState('30m');
  const [alMsg,setAlMsg]=useState('');
  const [bType,setBType]=useState('expense');
  const [bAmt,setBAmt]=useState('');
  const [bCatId,setBCatId]=useState(st.expCats[0]?.id||'');
  const [images,setImages]=useState([]);
  const handleImages=(e)=>{Array.from(e.target.files).forEach(file=>{const r=new FileReader();r.onload=ev=>setImages(p=>[...p,ev.target.result]);r.readAsDataURL(file);});};
  const removeImage=(idx)=>setImages(p=>p.filter((_,i)=>i!==idx));

  const selectCat = (id) => { setCatId(id); const c=st.schCats.find(x=>x.id===id); if(c) setColor(c.color); };

  const save = () => {
    if(!title.trim()) return;
    const bCats = bType==='expense' ? st.expCats : st.incCats;
    const bCatItem = bCats.find(c=>c.id===bCatId);
    const sch = {
      id:uid(), title:title.trim(), date, time, memo, color, catId, images, createdAt:Date.now(), createdBy:'me',
      todos: menus.todo ? todos.filter(t=>t.text.trim()).map(t=>({id:t.id,text:t.text.trim(),done:false})) : [],
      dday: hasDday,
      repeat: hasRepeat ? {type:rpType, interval:parseInt(rpInterval)||1, endDate:rpEnd==='date'?rpEndDate:null} : null,
      alarm: menus.alarm ? {before:alBefore, message:alMsg} : null,
      budget: menus.budget && bAmt ? {type:bType, amount:Number(bAmt), catId:bCatId, bCatName:bCatItem?.name||''} : null,
    };
    updateRoom(room.id, r=>({...r, schedules:[...r.schedules, sch]}));
    goBack();
  };

  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">새 스케줄</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      {/* 카테고리 — 가로 스크롤 */}
      <div className="gr-pg-label" style={{marginTop:0}}>카테고리</div>
      <div className="gr-pills-scroll">{st.schCats.map(c=> <button key={c.id} className={`gr-pill-btn ${catId===c.id?'on':''}`} style={catId===c.id?{background:c.color,borderColor:c.color,color:'#fff'}:{}} onClick={()=>selectCat(c.id)}>{c.name}</button>)}</div>
      {/* 스케줄명 */}
      <input className="gr-input lg" value={title} onChange={e=>setTitle(e.target.value)} placeholder="스케줄명을 입력하세요" autoFocus/>
      {/* 날짜 시간 */}
      <div className="gr-form-row">
        <div className="gr-form-half"><div className="gr-pg-label"><I n="cal" size={14}/> 날짜</div><input className="gr-input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="gr-form-half"><div className="gr-pg-label"><I n="clock" size={14}/> 시간</div><input className="gr-input" type="time" value={time} onChange={e=>setTime(e.target.value)}/></div>
      </div>

      {/* 반복 — 토글 방식 */}
      {menus.cal && <div className="gr-form-divider">
        <div className="gr-form-sec-row"><span className="gr-form-sec-title"><I n="cal" size={14} color="#8B5CF6"/> 반복</span><Toggle on={hasRepeat} toggle={()=>setHasRepeat(!hasRepeat)}/></div>
        {hasRepeat && <div style={{paddingTop:8}}>
          <div className="gr-pills-scroll">{[['daily','매일'],['weekly','매주'],['monthly','매월'],['yearly','매년'],['custom','직접']].map(([k,v])=> <button key={k} className={`gr-pill-btn ${rpType===k?'on':''}`} style={rpType===k?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setRpType(k)}>{v}</button>)}</div>
          {rpType==='custom'&&<div><div className="gr-pg-label">간격 (일)</div><input className="gr-input" type="number" value={rpInterval} onChange={e=>setRpInterval(e.target.value)} placeholder="예: 3"/></div>}
          <div className="gr-pg-label">종료</div>
          <div className="gr-pills-scroll">
            <button className={`gr-pill-btn ${rpEnd==='none'?'on':''}`} style={rpEnd==='none'?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setRpEnd('none')}>계속</button>
            <button className={`gr-pill-btn ${rpEnd==='date'?'on':''}`} style={rpEnd==='date'?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setRpEnd('date')}>종료일</button>
          </div>
          {rpEnd==='date'&&<input className="gr-input" type="date" value={rpEndDate} onChange={e=>setRpEndDate(e.target.value)} style={{marginTop:6}}/>}
        </div>}
      </div>}

      {/* 메모 */}
      {menus.memo && <div className="gr-form-divider">
        <div className="gr-pg-label" style={{marginTop:0}}>메모</div>
        <textarea className="gr-input" value={memo} onChange={e=>setMemo(e.target.value)} placeholder="메모 (선택)" rows={2} style={{resize:'none'}}/>
      </div>}

      {/* 할일 */}
      {menus.todo && <div className="gr-form-divider">
        <div className="gr-form-sec-title"><I n="check" size={14} color="#3B82F6"/> 할 일 체크리스트</div>
        {todos.map(t=> <div key={t.id} className="gr-todo-input-row">
          <input className="gr-input" value={t.text} onChange={e=>setTodos(p=>p.map(x=>x.id===t.id?{...x,text:e.target.value}:x))} placeholder="할 일 입력" onKeyDown={e=>{if(e.key==='Enter') setTodos(p=>[...p,{id:uid(),text:''}]);}}/>
          {todos.length>1&&<button className="gr-icon-btn" onClick={()=>setTodos(p=>p.filter(x=>x.id!==t.id))}><I n="x" size={16} color="var(--gr-t3)"/></button>}
        </div>)}
        <button className="gr-add-todo-btn" onClick={()=>setTodos(p=>[...p,{id:uid(),text:''}])}>+ 할 일 추가</button>
      </div>}

      {/* D-day */}
      <div className="gr-form-divider">
        <div className="gr-form-sec-row"><span className="gr-form-sec-title"><I n="clock" size={14} color="#F97316"/> D-day 카운트다운</span><Toggle on={hasDday} toggle={()=>setHasDday(!hasDday)}/></div>
      </div>

      {/* 알람 */}
      {menus.alarm && <div className="gr-form-divider">
        <div className="gr-form-sec-title"><I n="bell" size={14} color="#EAB308"/> 알람</div>
        <div className="gr-pills-scroll">{[['10m','10분 전'],['30m','30분 전'],['1h','1시간 전'],['1d','하루 전']].map(([k,v])=> <button key={k} className={`gr-pill-btn ${alBefore===k?'on':''}`} style={alBefore===k?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setAlBefore(k)}>{v}</button>)}</div>
        <input className="gr-input" value={alMsg} onChange={e=>setAlMsg(e.target.value)} placeholder="알림 메시지 (선택)"/>
      </div>}

      {/* 가계부 */}
      {menus.budget && <div className="gr-form-divider">
        <div className="gr-form-sec-title"><I n="wallet" size={14} color="#22C55E"/> 가계부</div>
        <div style={{display:'flex',gap:6,marginBottom:8}}><button className={`gr-type-btn ${bType==='expense'?'on-e':''}`} onClick={()=>{setBType('expense');setBCatId(st.expCats[0]?.id||'');}}>지출</button><button className={`gr-type-btn ${bType==='income'?'on-i':''}`} onClick={()=>{setBType('income');setBCatId(st.incCats[0]?.id||'');}}>수입</button></div>
        <div className="gr-pg-label">금액 (원)</div>
        <input className="gr-input lg" type="number" value={bAmt} onChange={e=>setBAmt(e.target.value)} placeholder="0"/>
        <div className="gr-pg-label">{bType==='expense'?'지출':'수입'} 카테고리</div>
        <div className="gr-pills-scroll">{(bType==='expense'?st.expCats:st.incCats).map(c=> <button key={c.id} className={`gr-pill-btn ${bCatId===c.id?'on':''}`} style={bCatId===c.id?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setBCatId(c.id)}>{c.name}</button>)}</div>
      </div>}

      {/* 이미지 첨부 */}
      <div className="gr-form-divider">
        <div className="gr-form-sec-title"><I n="image" size={14} color="var(--gr-t2)"/> 이미지 첨부</div>
        <div className="gr-diary-upload-area">
          {images.map((img,i)=> <div key={i} className="gr-diary-upload-thumb">
            <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}}/>
            <button className="gr-diary-upload-remove" onClick={()=>removeImage(i)}><I n="x" size={12} color="#fff"/></button>
          </div>)}
          <label className="gr-diary-upload-add">
            <I n="plus" size={24} color="var(--gr-t3)"/>
            <span style={{fontSize:11,color:'var(--gr-t3)',marginTop:2}}>추가</span>
            <input type="file" accept="image/*" multiple onChange={handleImages} style={{display:'none'}}/>
          </label>
        </div>
      </div>

      <div style={{height:20}}/>
    </div>
    <div className="gr-save-bar"><button className="gr-save-btn" disabled={!title.trim()} onClick={save}>저장하기</button></div>
  </div>;
}

const MOODS=['😊','😢','😡','😴','🥰','😎','🤔','😱','🤗','😤'];
const WEATHERS=['☀️','⛅','🌧️','❄️','🌪️','🌈','🌙','⚡'];

function DiaryForm({goBack,room,updateRoom,sb}){
  const [title,setTitle]=useState('');
  const [content,setContent]=useState('');
  const [images,setImages]=useState([]);
  const [mood,setMood]=useState('');
  const [weather,setWeather]=useState('');
  const handleImages=(e)=>{
    const files=Array.from(e.target.files);
    files.forEach(file=>{
      const reader=new FileReader();
      reader.onload=(ev)=>setImages(prev=>[...prev,ev.target.result]);
      reader.readAsDataURL(file);
    });
  };
  const removeImage=(idx)=>setImages(prev=>prev.filter((_,i)=>i!==idx));
  const save=()=>{
    if(!title.trim()) return;
    updateRoom(room.id,r=>({...r,diaries:[...r.diaries,{id:uid(),title:title.trim(),content,images,mood,weather,date:fmt(new Date()),createdAt:Date.now(),createdBy:'me',likes:[],comments:[]}]}));
    goBack();
  };
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">새 일기</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-pg-label">기분</div>
      <div className="gr-emoji-row">{MOODS.map(e=> <button key={e} className={`gr-emoji-btn ${mood===e?'on':''}`} onClick={()=>setMood(mood===e?'':e)}>{e}</button>)}</div>
      <div className="gr-pg-label">날씨</div>
      <div className="gr-emoji-row">{WEATHERS.map(e=> <button key={e} className={`gr-emoji-btn ${weather===e?'on':''}`} onClick={()=>setWeather(weather===e?'':e)}>{e}</button>)}</div>
      <div className="gr-pg-label">사진</div>
      <div className="gr-diary-upload-area">
        {images.map((img,i)=> <div key={i} className="gr-diary-upload-thumb">
          <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}}/>
          <button className="gr-diary-upload-remove" onClick={()=>removeImage(i)}><I n="x" size={12} color="#fff"/></button>
        </div>)}
        <label className="gr-diary-upload-add">
          <I n="plus" size={24} color="var(--gr-t3)"/>
          <span style={{fontSize:11,color:'var(--gr-t3)',marginTop:2}}>추가</span>
          <input type="file" accept="image/*" multiple onChange={handleImages} style={{display:'none'}}/>
        </label>
      </div>
      <div className="gr-pg-label">제목</div>
      <input className="gr-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="오늘의 제목" autoFocus style={{marginBottom:12}}/>
      <div className="gr-pg-label">내용</div>
      <textarea className="gr-input" value={content} onChange={e=>setContent(e.target.value)} placeholder="오늘의 일기를 작성하세요" rows={6} style={{resize:'none'}}/>
    </div>
    <div className="gr-save-bar"><button className="gr-save-btn" disabled={!title.trim()} onClick={save}>저장하기</button></div>
  </div>;
}

function SimpleForm({title:pt,fields,goBack,onSave,sb}){
  const [vals,setVals]=useState(()=>{const o={};fields.forEach(f=>o[f.k]='');return o;});
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">{pt}</div><div style={{width:28}}/></div><div className="gr-pg-body">{fields.map((f,i)=> <div key={f.k} style={{marginBottom:12}}><div className="gr-pg-label">{f.l}</div>{f.type==='textarea'?<textarea className="gr-input" value={vals[f.k]} onChange={e=>setVals(p=>({...p,[f.k]:e.target.value}))} placeholder={f.l} rows={4} style={{resize:'none'}}/>:<input className="gr-input" value={vals[f.k]} onChange={e=>setVals(p=>({...p,[f.k]:e.target.value}))} placeholder={f.l} autoFocus={i===0}/>}</div>)}</div><div className="gr-save-bar"><button className="gr-save-btn" disabled={!vals[fields[0].k]?.trim()} onClick={()=>onSave(vals)}>저장하기</button></div></div>;
}

function BudgetForm({goBack,room,updateRoom,sb}){
  const [title,setTitle]=useState(''); const [amount,setAmount]=useState(''); const [type,setType]=useState('expense');
  const save=()=>{if(!title.trim()||!amount) return;updateRoom(room.id,r=>({...r,schedules:[...r.schedules,{id:uid(),title:title.trim(),date:fmt(new Date()),time:'',memo:'',color:type==='income'?'#3182F6':'#F04452',budget:{type,amount:Number(amount)},createdAt:Date.now()}]}));goBack();};
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">가계부 추가</div><div style={{width:28}}/></div><div className="gr-pg-body"><div style={{display:'flex',gap:6,marginBottom:16}}><button className={`gr-type-btn ${type==='expense'?'on-e':''}`} onClick={()=>setType('expense')}>지출</button><button className={`gr-type-btn ${type==='income'?'on-i':''}`} onClick={()=>setType('income')}>수입</button></div><div className="gr-pg-label">항목명</div><input className="gr-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 점심식사" autoFocus style={{marginBottom:12}}/><div className="gr-pg-label">금액 (원)</div><input className="gr-input lg" type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/></div><div className="gr-save-bar"><button className="gr-save-btn" disabled={!title.trim()||!amount} onClick={save}>저장하기</button></div></div>;
}

function AddRoomPage({goBack,setRooms,sb,friends}){
  const [name,setName]=useState(''); const [desc,setDesc]=useState(''); const [isPublic,setIsPublic]=useState(true);
  const [menus,setMenus]=useState({cal:true,memo:true,todo:true,diary:true,budget:true,alarm:true});
  const [selMembers,setSelMembers]=useState([]);
  const toggleMenu=(id)=>setMenus(p=>({...p,[id]:!p[id]}));
  const toggleMember=(fid)=>setSelMembers(p=>p.includes(fid)?p.filter(x=>x!==fid):[...p,fid]);
  const save=()=>{if(!name.trim()) return;setRooms(p=>[...p,{id:uid(),name:name.trim(),desc:desc.trim(),isPersonal:false,isPublic,members:['me',...selMembers],newCount:0,nearestSchedule:null,menus,schedules:[],memos:[],todos:[],diaries:[]}]);goBack();};
  return <div className="gr-panel"><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">새 캘린더방</div><div style={{width:28}}/></div><div className="gr-pg-body"><div className="gr-pg-label">캘린더명</div><input className="gr-input" value={name} onChange={e=>setName(e.target.value)} placeholder="이름" autoFocus style={{marginBottom:12}}/><div className="gr-pg-label">설명</div><input className="gr-input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="설명" style={{marginBottom:12}}/><div className="gr-pg-label">공개 여부</div><div style={{display:'flex',gap:8,marginBottom:16}}><button className={`gr-pill ${isPublic?'on':''}`} style={isPublic?{background:'var(--gr-acc)',color:'#fff'}:{}} onClick={()=>setIsPublic(true)}>공개</button><button className={`gr-pill ${!isPublic?'on':''}`} style={!isPublic?{background:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setIsPublic(false)}>비공개</button></div><div className="gr-pg-label">기능 ON/OFF</div>{ALL_MENUS.map(m=> <div key={m.id} className="gr-set-row"><span className="gr-set-label"><I n={m.icon} size={16}/> {m.label}</span><Toggle on={menus[m.id]} toggle={()=>toggleMenu(m.id)}/></div>)}<div className="gr-pg-label" style={{marginTop:16}}>멤버 초대 (선택)</div>{friends.map(f=> <div key={f.id} className="gr-friend-row" style={{padding:'8px 0'}} onClick={()=>toggleMember(f.id)}><Avatar name={f.nickname} size={32}/><div className="gr-friend-info"><div className="gr-friend-name" style={{fontSize:13}}>{f.nickname}</div></div><div className={`gr-todo-cb ${selMembers.includes(f.id)?'done':''}`} style={{width:20,height:20}}>{selMembers.includes(f.id)&&<I n="check" size={12} color="#fff"/>}</div></div>)}</div><div className="gr-save-bar"><button className="gr-save-btn" disabled={!name.trim()} onClick={save}>만들기</button></div></div>;
}

const CSS = `
:root{--gr-ff:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;--gr-bg:#FFF;--gr-bg2:#F5F5F5;--gr-brd:#EBEBEB;--gr-text:#191919;--gr-t2:#666;--gr-t3:#999;--gr-acc:#F5A928;--gr-acc-d:#E09820;--gr-inc:#3182F6;--gr-exp:#F04452;--gr-r:12px;--gr-r-sm:8px;--gr-sidebar-w:360px;--gr-tr:150ms ease}
*{margin:0;padding:0;box-sizing:border-box}
.gr-root{height:100vh;overflow:hidden}
.gr-layout-wide{display:flex;height:100vh;font-family:var(--gr-ff);color:var(--gr-text);background:var(--gr-bg)}
.gr-layout-wide .gr-sidebar{width:var(--gr-sidebar-w);min-width:var(--gr-sidebar-w);border-right:1px solid var(--gr-brd);display:flex;flex-direction:column;height:100vh;overflow:hidden}
.gr-layout-wide .gr-main{flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden}
.gr-sidebar{font-family:var(--gr-ff);color:var(--gr-text);background:var(--gr-bg);height:100vh;display:flex;flex-direction:column;overflow:hidden;font-size:14px;line-height:1.5}
.gr-panel{font-family:var(--gr-ff);color:var(--gr-text);background:var(--gr-bg);height:100vh;display:flex;flex-direction:column;overflow:hidden;font-size:14px;line-height:1.5;position:relative}
.gr-empty-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center}
.gr-icon-btn{background:none;border:none;cursor:pointer;color:var(--gr-text);padding:4px;display:flex}
.gr-icon-btn-sm{background:none;border:none;cursor:pointer;padding:4px;display:flex;border-radius:4px}.gr-icon-btn-sm:hover{background:var(--gr-bg2)}.gr-icon-btn-sm.active{background:var(--gr-bg2)}
.gr-header{padding:12px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--gr-brd);flex-shrink:0}
.gr-header-info{flex:1;display:flex;align-items:center;gap:10px}
.gr-lock{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:8px;padding:40px}
/* 프로필 */
.gr-profile-bg{position:relative;height:180px;display:flex;align-items:flex-start;justify-content:flex-end;padding:12px}
.gr-profile-top-bar{position:absolute;top:12px;right:12px;display:flex;align-items:center;gap:6px;z-index:2}
.gr-profile-top-btn{background:rgba(255,255,255,.85);border:none;border-radius:20px;padding:6px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--gr-ff)}
.gr-profile-top-btn-s{background:rgba(255,255,255,.85);border:none;border-radius:20px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--gr-ff);display:flex;align-items:center;gap:4px}
.gr-profile-fav-btn{position:absolute;top:12px;right:12px;background:none;border:none;cursor:pointer;padding:4px;display:flex;z-index:2}
.gr-profile-info{display:flex;flex-direction:column;align-items:center;padding:0 20px 16px;margin-top:-44px;position:relative;z-index:2}
.gr-profile-avatar-wrap{position:relative;width:84px;height:84px;margin-bottom:8px}
.gr-profile-avatar-wrap>div,.gr-profile-avatar-img{width:80px;height:80px;border-radius:50%;border:3px solid var(--gr-bg)}
.gr-profile-avatar-img{object-fit:cover}
.gr-profile-avatar-edit{position:absolute;bottom:0;right:0;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3}
.gr-profile-name{font-size:18px;font-weight:700}
.gr-profile-status{font-size:13px;color:var(--gr-t3);margin-top:2px}
.gr-profile-bio{font-size:12px;color:var(--gr-t2);margin-top:8px;text-align:center;padding:8px 12px;background:var(--gr-bg2);border-radius:var(--gr-r-sm);max-width:280px}
.gr-profile-edit-row{display:flex;align-items:center;gap:6px;margin-top:6px}
.gr-profile-inline-input{flex:1;border:none;border-bottom:1px solid var(--gr-brd);outline:none;font-size:13px;padding:4px 0;font-family:var(--gr-ff);color:var(--gr-text);background:transparent;text-align:center}
.gr-profile-inline-input.name{font-size:16px;font-weight:700}
.gr-profile-inline-input:focus{border-bottom-color:var(--gr-acc)}
.gr-profile-edit-upload{display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:var(--gr-r);cursor:pointer;margin-bottom:12px;overflow:hidden}
.gr-profile-edit-avatar{position:relative;width:80px;height:80px;margin:0 auto 12px;cursor:pointer}
.gr-profile-edit-avatar-overlay{position:absolute;inset:0;background:rgba(0,0,0,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 150ms}.gr-profile-edit-avatar:hover .gr-profile-edit-avatar-overlay{opacity:1}
/* 스케줄 상세 */
.gr-det-section{padding:12px 0;border-bottom:1px solid var(--gr-brd)}
.gr-det-section:last-child{border:none}
.gr-det-label{font-size:12px;color:var(--gr-t3);margin-bottom:4px}
.gr-tab-top{padding:16px 20px 12px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}.gr-tab-top-title{font-size:20px;font-weight:800}.gr-tab-top-actions{display:flex;gap:4px}
.gr-tab-top-btn{background:none;border:none;cursor:pointer;color:var(--gr-text);padding:8px;display:flex;border-radius:50%}.gr-tab-top-btn:active{background:var(--gr-bg2)}
.gr-tab-body{flex:1;overflow-y:auto}.gr-tab-body::-webkit-scrollbar{width:0}
.gr-btab{display:flex;border-top:1px solid var(--gr-brd);flex-shrink:0;background:var(--gr-bg)}
.gr-btab-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0 10px;border:none;background:none;cursor:pointer;font-size:10px;color:var(--gr-t3);font-family:var(--gr-ff)}.gr-btab-btn.on{color:var(--gr-text)}.gr-btab-btn.on svg{stroke:var(--gr-text)}
.gr-friend-me{display:flex;align-items:center;gap:14px;padding:14px 20px;cursor:pointer}.gr-friend-me:active{background:var(--gr-bg2)}
.gr-friend-row{display:flex;align-items:center;gap:14px;padding:10px 20px;cursor:pointer;transition:background var(--gr-tr)}.gr-friend-row:active,.gr-friend-row:hover{background:var(--gr-bg2)}.gr-friend-row.active{background:var(--gr-bg2)}
.gr-friend-info{flex:1;min-width:0}.gr-friend-name{font-size:15px;font-weight:600;display:flex;align-items:center;gap:4px}.gr-friend-status{font-size:12px;color:var(--gr-t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gr-divider-line{height:1px;background:var(--gr-brd);margin:8px 20px}.gr-section-label{font-size:12px;color:var(--gr-t3);padding:12px 20px 4px;font-weight:500}
.gr-room-row{display:flex;align-items:center;gap:14px;padding:14px 20px;cursor:pointer;transition:background var(--gr-tr)}.gr-room-row:active,.gr-room-row:hover{background:var(--gr-bg2)}.gr-room-row.active{background:var(--gr-bg2)}
.gr-room-info{flex:1;min-width:0}.gr-room-name{font-size:15px;font-weight:600;display:flex;align-items:center;gap:6px}
.gr-badge-my{font-size:10px;background:var(--gr-acc);color:#fff;padding:1px 6px;border-radius:8px;font-weight:700}
.gr-room-preview{font-size:12px;color:var(--gr-t3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gr-room-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0}
.gr-room-new{background:var(--gr-acc);color:#fff;font-size:11px;font-weight:700;min-width:20px;height:20px;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:0 6px}
.gr-room-members{font-size:11px;color:var(--gr-t3);display:flex;align-items:center;gap:3px}
.gr-more-item{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--gr-brd);font-size:15px;cursor:pointer}
.gr-room-top{padding:12px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--gr-brd);flex-shrink:0}.gr-room-top-info{flex:1}.gr-room-top-name{font-size:16px;font-weight:700}.gr-room-top-members{font-size:11px;color:var(--gr-t3)}
.gr-room-tabs{display:flex;padding:4px 12px;gap:2px;border-bottom:1px solid var(--gr-brd);overflow-x:auto;flex-shrink:0}.gr-room-tabs::-webkit-scrollbar{height:0}
.gr-room-tab{padding:8px 12px;border:none;background:none;cursor:pointer;font-size:12px;font-weight:500;color:var(--gr-t3);font-family:var(--gr-ff);border-radius:var(--gr-r-sm);white-space:nowrap;display:flex;align-items:center;gap:4px}.gr-room-tab.on{background:var(--gr-acc);color:#fff;font-weight:600}
.gr-room-body{flex:1;overflow-y:auto}.gr-room-body::-webkit-scrollbar{width:0}
.gr-empty{text-align:center;padding:60px 20px;color:var(--gr-t3);font-size:14px;line-height:1.8}
.gr-fab{position:absolute;bottom:16px;right:16px;width:52px;height:52px;border-radius:50%;background:var(--gr-acc);border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;z-index:50}.gr-fab:active{transform:scale(.95)}
.gr-cal-nav{display:flex;align-items:center;justify-content:center;gap:16px;padding:12px 20px}.gr-cal-nav h3{font-size:15px;font-weight:700;min-width:110px;text-align:center}
.gr-cal-nav-btn{background:none;border:none;cursor:pointer;color:var(--gr-t3);padding:4px;display:flex;border-radius:50%}.gr-cal-nav-btn:active{background:var(--gr-bg2)}
.gr-cal-head{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;padding:0 16px}.gr-cal-head span{font-size:12px;color:var(--gr-t3);padding:6px 0;font-weight:500}.gr-cal-head span:first-child{color:var(--gr-exp)}.gr-cal-head span:last-child{color:var(--gr-inc)}
.gr-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);padding:0 16px;gap:2px}
.gr-cal-cell{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:10px;cursor:pointer;min-height:40px;gap:2px}.gr-cal-cell:active{background:var(--gr-bg2)}
.gr-cal-d{font-size:13px;font-weight:500;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%}
.gr-cal-cell.tod .gr-cal-d{background:var(--gr-acc);color:#fff;font-weight:700}.gr-cal-cell.sel .gr-cal-d{outline:2px solid var(--gr-text)}.gr-cal-cell.ot{opacity:.25}
.gr-cal-dots{display:flex;gap:2px}.gr-cal-dots span{width:4px;height:4px;border-radius:50%}
.gr-cal-sel-info{padding:16px 20px;border-top:1px solid var(--gr-brd);margin-top:8px}.gr-cal-sel-date{font-size:13px;font-weight:600;color:var(--gr-t2);margin-bottom:8px}
.gr-cal-empty{text-align:center;padding:20px;color:var(--gr-t3);font-size:13px}
.gr-sch-card{display:flex;gap:10px;padding:12px;background:var(--gr-bg);border:1px solid var(--gr-brd);border-radius:var(--gr-r);margin-bottom:6px;align-items:center}.gr-sch-bar{width:4px;min-height:36px;border-radius:2px;flex-shrink:0;align-self:stretch}.gr-sch-thumb{width:48px;height:48px;border-radius:8px;flex-shrink:0;overflow:hidden;position:relative}.gr-sch-thumb img{width:100%;height:100%;object-fit:cover}.gr-sch-thumb-count{position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,.6);color:#fff;font-size:9px;padding:1px 4px;border-radius:4px}.gr-sch-body{flex:1;min-width:0}.gr-sch-title{font-size:14px;font-weight:600}.gr-sch-meta{font-size:12px;color:var(--gr-t3);display:flex;gap:8px;margin-top:2px}.gr-sch-budget{font-size:13px;font-weight:700;margin-top:4px}
.gr-pg-top{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--gr-brd);flex-shrink:0}.gr-pg-title{font-size:17px;font-weight:700}
.gr-pg-body{flex:1;overflow-y:auto;padding:16px 20px}.gr-pg-body::-webkit-scrollbar{width:0}
.gr-pg-label{font-size:13px;font-weight:600;color:var(--gr-t2);margin-bottom:6px;margin-top:12px;display:flex;align-items:center;gap:6px}.gr-pg-label:first-child{margin-top:0}
.gr-input{width:100%;padding:12px 14px;border:1px solid var(--gr-brd);border-radius:var(--gr-r-sm);font-size:14px;font-family:var(--gr-ff);outline:none;background:var(--gr-bg);color:var(--gr-text)}.gr-input:focus{border-color:var(--gr-acc)}.gr-input::placeholder{color:#ccc}.gr-input.lg{font-size:16px;font-weight:600;margin-bottom:12px}
.gr-btn-primary{width:100%;padding:14px;border-radius:var(--gr-r);border:none;background:var(--gr-acc);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--gr-ff)}.gr-btn-primary:hover{background:var(--gr-acc-d)}
.gr-btn-danger{width:100%;padding:12px;border-radius:var(--gr-r-sm);border:1px solid var(--gr-exp);background:none;color:var(--gr-exp);font-size:14px;font-weight:600;cursor:pointer;font-family:var(--gr-ff);display:flex;align-items:center;justify-content:center;gap:6px}
.gr-btn-copy{background:var(--gr-acc);color:#fff;border:none;padding:6px 14px;border-radius:var(--gr-r-sm);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--gr-ff)}
.gr-btn-sm{padding:8px 16px;border-radius:var(--gr-r-sm);border:none;background:var(--gr-acc);color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--gr-ff)}
.gr-btn-sm-outline{padding:8px 16px;border-radius:var(--gr-r-sm);border:1px solid var(--gr-brd);background:var(--gr-bg);color:var(--gr-t2);font-size:13px;cursor:pointer;font-family:var(--gr-ff)}
.gr-btn-invite{display:flex;align-items:center;gap:4px;padding:6px 12px;border-radius:var(--gr-r-sm);border:none;background:var(--gr-acc);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--gr-ff);white-space:nowrap}
.gr-pill{padding:8px 16px;border-radius:20px;border:1px solid var(--gr-brd);font-size:13px;cursor:pointer;background:var(--gr-bg);color:var(--gr-t2);font-family:var(--gr-ff)}
.gr-divider{display:flex;align-items:center;gap:12px;margin:20px 0;color:var(--gr-t3);font-size:12px}.gr-divider::before,.gr-divider::after{content:'';flex:1;height:1px;background:var(--gr-brd)}
.gr-code-box{display:flex;align-items:center;justify-content:space-between;background:var(--gr-bg2);padding:12px 14px;border-radius:var(--gr-r-sm);font-size:14px;font-weight:600}
.gr-save-bar{padding:12px 20px;border-top:1px solid var(--gr-brd);flex-shrink:0}
.gr-save-btn{width:100%;padding:14px;border-radius:var(--gr-r);border:none;background:var(--gr-acc);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--gr-ff)}.gr-save-btn:hover{background:var(--gr-acc-d)}.gr-save-btn:disabled{background:#eee;color:#bbb;cursor:default}
.gr-clr-row{display:flex;gap:6px;flex-wrap:wrap}.gr-clr-b{width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer}.gr-clr-b.on{border-color:var(--gr-text);box-shadow:0 0 0 2px #fff inset}
.gr-form-row{display:flex;gap:8px;margin-bottom:12px}.gr-form-half{flex:1}
.gr-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-top:1px solid var(--gr-brd);cursor:pointer;font-weight:600;font-size:14px}
.gr-toggle-body{padding:0 0 14px;border-left:3px solid var(--gr-brd);margin-left:8px;padding-left:16px}
.gr-type-btn{flex:1;padding:10px;border-radius:var(--gr-r-sm);border:1px solid var(--gr-brd);font-size:14px;font-weight:600;cursor:pointer;text-align:center;background:var(--gr-bg);font-family:var(--gr-ff)}.gr-type-btn.on-e{background:#FEF2F2;border-color:var(--gr-exp);color:var(--gr-exp)}.gr-type-btn.on-i{background:#EFF6FF;border-color:var(--gr-inc);color:var(--gr-inc)}
.gr-tsw{width:44px;height:26px;border-radius:13px;border:none;cursor:pointer;position:relative;padding:0}.gr-tsw.off{background:#DDD}.gr-tsw.on{background:var(--gr-acc)}.gr-tsw::after{content:'';position:absolute;width:22px;height:22px;border-radius:50%;background:#fff;top:2px;box-shadow:0 1px 3px rgba(0,0,0,.15)}.gr-tsw.off::after{left:2px}.gr-tsw.on::after{left:20px}
.gr-set-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--gr-brd)}.gr-set-label{font-size:14px;display:flex;align-items:center;gap:8px}.gr-set-val{font-size:14px;color:var(--gr-t2)}
.gr-set-member{display:flex;align-items:center;gap:10px;padding:8px 0}
.gr-memo-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.gr-memo-search{flex:1;display:flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid var(--gr-brd);border-radius:var(--gr-r-sm);background:var(--gr-bg2)}
.gr-memo-search-input{border:none;outline:none;background:transparent;flex:1;font-size:13px;font-family:var(--gr-ff);color:var(--gr-text)}.gr-memo-search-input::placeholder{color:var(--gr-t3)}
.gr-memo-view-toggle{display:flex;gap:2px}
.gr-memo-card{padding:14px;border:1px solid var(--gr-brd);border-radius:var(--gr-r);margin-bottom:8px}.gr-memo-card.pinned{border-color:var(--gr-acc);background:#FFF9F0}
.gr-memo-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.gr-memo-card-actions{display:flex;gap:2px;flex-shrink:0}
.gr-memo-title{font-size:14px;font-weight:600}.gr-memo-preview{font-size:12px;color:var(--gr-t3);margin-top:4px;line-height:1.5}.gr-memo-date{font-size:11px;color:var(--gr-t3);margin-top:6px}
.gr-memo-list-row{display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--gr-brd)}.gr-memo-list-row.pinned{background:#FFFAF0}
.gr-memo-list-title{flex:1;font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gr-memo-list-date{font-size:11px;color:var(--gr-t3);white-space:nowrap}
.gr-sub-form{margin-top:12px;padding:12px;border:1px dashed var(--gr-brd);border-radius:var(--gr-r-sm);background:var(--gr-bg2)}
.gr-sub-form-label{font-size:12px;font-weight:600;color:var(--gr-t2);margin-bottom:8px;display:flex;align-items:center;gap:4px}
.gr-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.gr-pills-scroll{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;padding-bottom:4px;flex-wrap:nowrap}.gr-pills-scroll::-webkit-scrollbar{height:0}.gr-pills-scroll .gr-pill-btn{flex-shrink:0}
.gr-emoji-row{display:flex;gap:4px;overflow-x:auto;margin-bottom:12px;padding-bottom:4px}.gr-emoji-row::-webkit-scrollbar{height:0}
.gr-emoji-btn{width:36px;height:36px;border-radius:50%;border:2px solid transparent;background:var(--gr-bg2);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}.gr-emoji-btn.on{border-color:var(--gr-acc);background:#FFF5E0}
/* Threads 피드 */
.gr-thr-feed{padding:0}
.gr-thr-post{padding:14px 16px;border-bottom:1px solid var(--gr-brd)}
.gr-thr-post-header{display:flex;align-items:flex-start;gap:10px;margin-bottom:6px}
.gr-thr-post-name{font-size:14px;font-weight:700}.gr-thr-post-time{font-size:12px;color:var(--gr-t3);font-weight:400;margin-left:6px}
.gr-thr-post-text{font-size:14px;color:var(--gr-text);margin-top:1px}
.gr-thr-post-body{font-size:14px;color:var(--gr-t2);line-height:1.6;padding:0 0 8px 46px;white-space:pre-wrap}
.gr-thr-slider{display:flex;gap:6px;overflow-x:auto;margin:8px 0 8px 46px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}.gr-thr-slider::-webkit-scrollbar{height:0}
.gr-thr-slide{flex-shrink:0;width:85%;max-width:360px;scroll-snap-align:start;border-radius:var(--gr-r);overflow:hidden;cursor:pointer;position:relative}
.gr-thr-slide-img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block}
.gr-thr-slide-count{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;pointer-events:none}
.gr-thr-post-actions{display:flex;gap:2px;padding:8px 0 4px 46px}
.gr-thr-act-btn{display:flex;align-items:center;gap:4px;background:none;border:none;cursor:pointer;padding:6px 12px;border-radius:20px;font-size:13px;color:var(--gr-t3);font-family:var(--gr-ff)}.gr-thr-act-btn:hover{background:var(--gr-bg2)}.gr-thr-act-btn span{min-width:12px}
.gr-thr-comments{padding:8px 0 0 46px}
.gr-thr-comment{display:flex;gap:8px;padding:8px 0}
.gr-thr-comment-header{display:flex;align-items:center;gap:6px}
.gr-thr-comment-name{font-size:13px;font-weight:700}
.gr-thr-comment-time{font-size:11px;color:var(--gr-t3)}
.gr-thr-comment-text{font-size:13px;color:var(--gr-text);margin-top:2px;line-height:1.4}
.gr-thr-comment-input{display:flex;align-items:center;gap:8px;padding:10px 0}
.gr-thr-comment-field{flex:1;border:none;outline:none;font-size:13px;font-family:var(--gr-ff);color:var(--gr-text);padding:8px 0;background:transparent}.gr-thr-comment-field::placeholder{color:var(--gr-t3)}
.gr-thr-comment-send{background:none;border:none;color:var(--gr-acc);font-size:14px;font-weight:700;cursor:pointer;font-family:var(--gr-ff)}.gr-thr-comment-send:disabled{color:var(--gr-t3)}
/* 이미지 뷰어 */
.gr-img-viewer{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:999;display:flex;align-items:center;justify-content:center}
.gr-img-viewer-close{position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;z-index:1000;padding:8px}
.gr-img-viewer-body{display:flex;flex-direction:column;align-items:center;gap:16px;max-width:90vw;max-height:90vh}
.gr-img-viewer-img{max-width:90vw;max-height:80vh;object-fit:contain;border-radius:8px}
.gr-img-viewer-nav{display:flex;align-items:center;gap:20px}
.gr-img-viewer-btn{background:none;border:none;cursor:pointer;padding:8px;display:flex}
.gr-pill-btn{padding:6px 14px;border-radius:20px;border:1px solid var(--gr-brd);font-size:13px;cursor:pointer;background:var(--gr-bg);color:var(--gr-t2);font-family:var(--gr-ff);transition:all 150ms ease}
.gr-pill-btn.on{border-color:transparent;color:#fff}
.gr-todo-input-row{display:flex;gap:6px;align-items:center;margin-bottom:6px}
.gr-add-todo-btn{background:none;border:1px dashed var(--gr-brd);border-radius:var(--gr-r-sm);padding:8px;width:100%;cursor:pointer;color:var(--gr-t3);font-size:13px;font-family:var(--gr-ff)}.gr-add-todo-btn:hover{border-color:#bbb}
.gr-form-section{margin-top:16px;padding:14px;border:1px solid var(--gr-brd);border-radius:var(--gr-r);background:var(--gr-bg2)}
.gr-form-section-title{font-size:13px;font-weight:600;color:var(--gr-t2);margin-bottom:10px;display:flex;align-items:center;gap:6px}
.gr-form-section-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.gr-form-divider{padding:16px 0;border-top:1px solid var(--gr-brd)}
.gr-form-sec-title{font-size:13px;font-weight:600;color:var(--gr-t2);margin-bottom:10px;display:flex;align-items:center;gap:6px}
.gr-form-sec-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.gr-setting-detail{margin-left:24px;padding:10px 0 14px;border-bottom:1px solid var(--gr-brd)}
.gr-setting-detail-title{font-size:12px;font-weight:600;color:var(--gr-t2);margin-bottom:6px}
.gr-tag-list{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.gr-tag-item{display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:16px;background:var(--gr-bg2);font-size:12px}
.gr-tag-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.gr-tag-add{padding:8px;background:var(--gr-bg2);border-radius:var(--gr-r-sm);margin-top:6px}
.gr-clr-b-sm{width:20px;height:20px;border-radius:50%;border:2px solid transparent;cursor:pointer}.gr-clr-b-sm.on{border-color:var(--gr-text)}
.gr-todo-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--gr-brd)}
.gr-todo-cb{width:22px;height:22px;border-radius:50%;border:2px solid var(--gr-brd);display:flex;align-items:center;justify-content:center;cursor:pointer;background:none;flex-shrink:0}.gr-todo-cb.done{background:var(--gr-acc);border-color:var(--gr-acc)}
.gr-todo-text{flex:1;font-size:14px}.gr-todo-text.done{text-decoration:line-through;color:var(--gr-t3)}
.gr-todo-del{background:none;border:none;cursor:pointer;color:var(--gr-t3);padding:4px;display:flex}
.gr-todo-meta{display:flex;gap:6px;font-size:11px;color:var(--gr-t3);margin-top:2px;flex-wrap:wrap}
.gr-diary-card{padding:14px;border:1px solid var(--gr-brd);border-radius:var(--gr-r);margin-bottom:12px}
.gr-diary-author{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;margin-bottom:8px}
.gr-diary-images{display:flex;gap:6px;overflow-x:auto;margin-bottom:10px;padding-bottom:4px}.gr-diary-images::-webkit-scrollbar{height:0}
.gr-diary-img-wrap{flex-shrink:0;width:120px;height:120px;border-radius:8px;overflow:hidden}
.gr-diary-img{width:100%;height:100%;object-fit:cover}
.gr-diary-date{font-size:11px;color:var(--gr-t3);margin-top:6px}.gr-diary-title{font-size:14px;font-weight:600;margin-bottom:4px}.gr-diary-content{font-size:13px;color:var(--gr-t2);line-height:1.6}
.gr-diary-upload-area{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.gr-diary-upload-thumb{width:80px;height:80px;border-radius:8px;overflow:hidden;position:relative;flex-shrink:0}
.gr-diary-upload-remove{position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,.5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center}
.gr-diary-upload-add{width:80px;height:80px;border-radius:8px;border:2px dashed var(--gr-brd);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
.gr-budget-summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px}
.gr-budget-box{padding:14px 8px;border-radius:var(--gr-r);border:1px solid var(--gr-brd);text-align:center}.gr-budget-label{font-size:11px;color:var(--gr-t3);margin-bottom:4px}.gr-budget-val{font-size:16px;font-weight:700}
.gr-budget-row{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--gr-brd)}.gr-budget-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.gr-budget-info{flex:1}
@media(min-width:481px)and(max-width:1024px){:root{--gr-sidebar-w:320px}.gr-cal-cell{min-height:36px}}
@media(min-width:1025px){:root{--gr-sidebar-w:380px}.gr-cal-cell{min-height:44px}.gr-cal-d{width:32px;height:32px;font-size:14px}}
@media(max-width:480px){.gr-sidebar,.gr-panel{max-width:100vw}.gr-cal-cell{min-height:38px}}
`;
