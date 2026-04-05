import { useState, useMemo } from 'react';
import I from '../../components/shared/Icon';
import Avatar from '../../components/shared/Avatar';
import { uid, ALL_MENUS, fmt } from '../../lib/helpers';
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
import DiaryForm from './DiaryForm';
import BudgetForm from './BudgetForm';
import SimpleForm from '../../components/shared/SimpleForm';

export default function CalRoom({room,goBack,roomTab,setRoomTab,friends,subPage,setSubPage,updateRoom,sb,me,userId,onSchClick,saveSchedule,saveMemo,deleteMemo,updateMemoPin,saveTodo,deleteTodo,updateTodoDone,saveDiary,deleteDiary,updateDiaryLikes,updateDiaryComments,updateRoomInDb,deleteSchedule,deleteRoom,getName}){
  const [sel,setSel]=useState(new Date()); const [nav,setNav]=useState(new Date()); const today=useMemo(()=>new Date(),[]);
  const activeMenus=ALL_MENUS.filter(m=>room.menus[m.id]);
  const memberList=room.members.map(id=>id===userId?{id:userId,nickname:'나'}:friends.find(f=>f.id===id)||{id,nickname:'?'});
  const isMulti = room.members.length > 1;

  if(subPage==='settings') return <RoomSettings room={room} updateRoom={updateRoom} friends={friends} memberList={memberList} sb={sb} goBack={()=>setSubPage(null)} setSubPage={setSubPage} updateRoomInDb={updateRoomInDb} deleteRoom={deleteRoom} userId={userId}/>;
  if(subPage==='invite') return <InviteMembers room={room} updateRoom={updateRoom} friends={friends} sb={sb} goBack={()=>setSubPage(null)} userId={userId}/>;
  if(subPage==='add-schedule') return <div className="gr-panel"><ScheduleForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} selDate={fmt(sel)} sb={sb} saveSchedule={saveSchedule} userId={userId}/></div>;
  if(subPage==='add-memo') return <div className="gr-panel"><MemoForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} sb={sb} saveMemoDb={saveMemo} userId={userId}/></div>;
  if(subPage==='add-todo') return <div className="gr-panel"><SimpleForm title="새 할일" fields={[{k:'title',l:'할 일'}]} goBack={()=>setSubPage(null)} onSave={async v=>{
    const todo = {id:uid(),text:v.title,done:false,createdAt:Date.now(),createdBy:userId,doneAt:null,doneBy:null};
    updateRoom(room.id,r=>({...r,todos:[...r.todos,todo]}));
    await saveTodo(room.id, todo);
    setSubPage(null);
  }} sb={sb}/></div>;
  if(subPage==='add-diary') return <div className="gr-panel"><DiaryForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} sb={sb} saveDiaryDb={saveDiary} userId={userId}/></div>;
  if(subPage==='add-budget') return <div className="gr-panel"><BudgetForm goBack={()=>setSubPage(null)} room={room} updateRoom={updateRoom} sb={sb} saveSchedule={saveSchedule} userId={userId}/></div>;
  const fabMap={cal:'add-schedule',memo:'add-memo',todo:'add-todo',diary:'add-diary',budget:'add-budget'};
  return <div className="gr-panel"><div className="gr-room-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-room-top-info"><div className="gr-room-top-name">{room.name}</div><div className="gr-room-top-members">{memberList.length}명</div></div><button className="gr-icon-btn" onClick={()=>setSubPage('settings')}><I n="gear" size={18}/></button></div><div className="gr-room-tabs">{activeMenus.map(m=> <button key={m.id} className={`gr-room-tab ${roomTab===m.id?'on':''}`} onClick={()=>setRoomTab(m.id)}><I n={m.icon} size={14}/> {m.label}</button>)}</div><div className="gr-room-body">{roomTab==='cal'&&<RoomCal nav={nav} setNav={setNav} sel={sel} setSel={setSel} today={today} schedules={room.schedules} onSchClick={onSchClick}/>}{roomTab==='memo'&&<RoomMemo memos={room.memos} room={room} updateRoom={updateRoom} deleteMemoDb={deleteMemo} updateMemoPinDb={updateMemoPin}/>}{roomTab==='todo'&&<RoomTodo todos={room.todos} room={room} updateRoom={updateRoom} isMulti={isMulti} getName={getName} deleteTodoDb={deleteTodo} updateTodoDoneDb={updateTodoDone} userId={userId}/>}{roomTab==='diary'&&<RoomDiary diaries={room.diaries} schedules={room.schedules} isMulti={isMulti} getName={getName} room={room} updateRoom={updateRoom} onSchClick={onSchClick} updateDiaryLikes={updateDiaryLikes} updateDiaryComments={updateDiaryComments} userId={userId}/>}{roomTab==='map'&&<RoomMap schedules={room.schedules} sel={sel}/>}{roomTab==='budget'&&<RoomBudget schedules={room.schedules} room={room}/>}{roomTab==='alarm'&&<div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>🔔</div>알림이 없습니다</div>}</div>{fabMap[roomTab]&&<button className="gr-fab" onClick={()=>setSubPage(fabMap[roomTab])}><I n="plus" size={24} color="#191919"/></button>}</div>;
}
