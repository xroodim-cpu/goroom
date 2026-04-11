import { useState, useMemo } from 'react';
import I from '../../components/shared/Icon';
import Avatar from '../../components/shared/Avatar';
import { uid, ALL_MENUS, fmt, canEdit, canManage } from '../../lib/helpers';
import RoomCal from './tabs/RoomCal';
import RoomMemo from './tabs/RoomMemo';
import RoomTodo from './tabs/RoomTodo';
import RoomDiary from './tabs/RoomDiary';
import RoomBudget from './tabs/RoomBudget';
import RoomMap from './tabs/RoomMap';
import RoomSettings from './RoomSettings';
import InviteMembers from './InviteMembers';
import ScheduleForm from './ScheduleForm';
import MemoForm from './MemoForm';
import BudgetForm from './BudgetForm';
import SimpleForm from '../../components/shared/SimpleForm';

export default function CalRoom({room,goBack,roomTab,setRoomTab,friends,subPage,setSubPage,updateRoom,sb,me,userId,onSchClick,saveSchedule,saveMemo,deleteMemo,updateMemoPin,saveTodo,deleteTodo,updateTodoDone,updateDiaryLikes,updateDiaryComments,updateRoomInDb,deleteSchedule,deleteRoom,getName,getProfile,rooms}){
  const [sel,setSel]=useState(new Date()); const [nav,setNav]=useState(new Date()); const today=useMemo(()=>new Date(),[]);
  const activeMenus=ALL_MENUS.filter(m=>room.menus[m.id]);
  const myRole = room.members.find(m=>m.id===userId)?.role||'member';
  const memberList=room.members.map(m=>{
    if (m.id === userId) return { id: m.id, role: m.role, nickname: '나', profileImg: me?.profileImg || null };
    // Prefer embedded data from room.members (from App.jsx JOIN), fallback to friends lookup
    const friend = friends.find(f=>f.id===m.id);
    return {
      id: m.id,
      role: m.role,
      nickname: m.nickname || friend?.nickname || '?',
      profileImg: m.profileImg || friend?.profileImg || null,
    };
  });
  const isMulti = room.members.length > 1;

  const handleShareRoom = async () => {
    if (!room.slug) { alert('공유 링크를 만들려면 먼저 캘린더 설정에서 주소를 지정하세요.'); return; }
    const url = `${window.location.origin}/calendar/${room.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: `고룸 - ${room.name}`, url }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다');
    } catch { alert('복사에 실패했습니다'); }
  };

  if(subPage==='settings'){if(!canManage(myRole)){setSubPage(null);return null;} return <RoomSettings room={room} updateRoom={updateRoom} friends={friends} memberList={memberList} sb={sb} goBack={()=>setSubPage(null)} setSubPage={setSubPage} updateRoomInDb={updateRoomInDb} deleteRoom={deleteRoom} userId={userId}/>;}
  if(subPage==='invite') return <InviteMembers room={room} updateRoom={updateRoom} friends={friends} sb={sb} goBack={()=>setSubPage(null)} userId={userId}/>;
  if(subPage==='add-schedule') return <div className="gr-panel"><ScheduleForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} selDate={fmt(sel)} sb={sb} saveSchedule={saveSchedule} userId={userId} rooms={rooms} me={me}/></div>;
  if(subPage==='add-memo') return <div className="gr-panel"><MemoForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} sb={sb} saveMemoDb={saveMemo} userId={userId}/></div>;
  if(subPage==='add-todo') return <div className="gr-panel"><SimpleForm title="새 할일" fields={[{k:'title',l:'할 일'}]} goBack={()=>setSubPage(null)} onSave={async v=>{
    const todo = {id:uid(),text:v.title,done:false,createdAt:Date.now(),createdBy:userId,doneAt:null,doneBy:null};
    updateRoom(room.id,r=>({...r,todos:[...r.todos,todo]}));
    await saveTodo(room.id, todo);
    setSubPage(null);
  }} sb={sb}/></div>;
  if(subPage==='add-budget') return <div className="gr-panel"><BudgetForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} sb={sb} saveSchedule={saveSchedule} userId={userId}/></div>;
  const fabMap={cal:'add-schedule',memo:'add-memo',todo:'add-todo',budget:'add-budget'};
  return <div className="gr-panel"><div className="gr-room-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-room-top-info"><div className="gr-room-top-name">{room.name}</div><div className="gr-room-top-members">{memberList.length}명</div></div>{!room.isPersonal&&<button className="gr-icon-btn" onClick={handleShareRoom} title="공유 링크"><I n="link" size={18}/></button>}{canManage(myRole)&&<button className="gr-icon-btn" onClick={()=>setSubPage('settings')}><I n="gear" size={18}/></button>}</div><div className="gr-room-tabs">{activeMenus.map(m=> <button key={m.id} className={`gr-room-tab ${roomTab===m.id?'on':''}`} onClick={()=>setRoomTab(m.id)}><I n={m.icon} size={14}/> {m.label}</button>)}</div><div className="gr-room-body">{roomTab==='cal'&&<RoomCal nav={nav} setNav={setNav} sel={sel} setSel={setSel} today={today} schedules={room.schedules} onSchClick={onSchClick}/>}{roomTab==='memo'&&<RoomMemo memos={room.memos} room={room} updateRoom={updateRoom} deleteMemoDb={deleteMemo} updateMemoPinDb={updateMemoPin} myRole={myRole}/>}{roomTab==='todo'&&<RoomTodo todos={room.todos} room={room} updateRoom={updateRoom} isMulti={isMulti} getName={getName} deleteTodoDb={deleteTodo} updateTodoDoneDb={updateTodoDone} userId={userId} myRole={myRole}/>}{roomTab==='diary'&&<RoomDiary diaries={room.diaries} schedules={room.schedules} isMulti={isMulti} getName={getName} getProfile={getProfile} room={room} updateRoom={updateRoom} onSchClick={onSchClick} updateDiaryLikes={updateDiaryLikes} updateDiaryComments={updateDiaryComments} userId={userId} myRole={myRole}/>}{roomTab==='map'&&<RoomMap schedules={room.schedules} sel={sel}/>}{roomTab==='budget'&&<RoomBudget schedules={room.schedules} room={room}/>}{roomTab==='alarm'&&<div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>🔔</div>알림이 없습니다</div>}</div>{fabMap[roomTab]&&canEdit(myRole)&&<button className="gr-fab" onClick={()=>setSubPage(fabMap[roomTab])}><I n="plus" size={24} color="#fff"/></button>}</div>;
}
