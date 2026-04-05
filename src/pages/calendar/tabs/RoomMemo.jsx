import { useState } from 'react';
import I from '../../../components/shared/Icon';
import { fmtTime, canEdit } from '../../../lib/helpers';

export default function RoomMemo({memos,room,updateRoom,deleteMemoDb,updateMemoPinDb,myRole}){
  const [q,setQ]=useState(''); const [viewMode,setViewMode]=useState('box');
  const togglePin=async (id)=>{
    const memo = memos.find(m=>m.id===id);
    if(!memo) return;
    const newPinned = !memo.pinned;
    updateRoom(room.id,r=>({...r,memos:r.memos.map(m=>m.id===id?{...m,pinned:newPinned}:m)}));
    await updateMemoPinDb(id, newPinned);
  };
  const del=async (id)=>{
    updateRoom(room.id,r=>({...r,memos:r.memos.filter(m=>m.id!==id)}));
    await deleteMemoDb(id);
  };
  if(!memos.length) return <div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>📝</div>메모를 추가해보세요</div>;
  const filtered=memos.filter(m=>{if(!q.trim()) return true; const kw=q.toLowerCase(); return (m.title||'').toLowerCase().includes(kw)||(m.content||'').toLowerCase().includes(kw);}); const pinned=filtered.filter(m=>m.pinned); const normal=filtered.filter(m=>!m.pinned).sort((a,b)=>b.createdAt-a.createdAt); const all=[...pinned,...normal];
  return <div style={{padding:12}}><div className="gr-memo-toolbar"><div className="gr-memo-search"><I n="search" size={14} color="var(--gr-t3)"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="메모 검색..." className="gr-memo-search-input"/></div><div className="gr-memo-view-toggle"><button className={`gr-icon-btn-sm ${viewMode==='list'?'active':''}`} onClick={()=>setViewMode('list')}><I n="list" size={16}/></button><button className={`gr-icon-btn-sm ${viewMode==='box'?'active':''}`} onClick={()=>setViewMode('box')}><I n="grid" size={16}/></button></div></div>{filtered.length===0&&<div className="gr-cal-empty">검색 결과가 없습니다</div>}{viewMode==='box'?all.map(m=> <div key={m.id} className={`gr-memo-card ${m.pinned?'pinned':''}`}><div className="gr-memo-card-top"><div className="gr-memo-title">{m.title}</div>{canEdit(myRole)&&<div className="gr-memo-card-actions"><button className="gr-icon-btn-sm" onClick={()=>togglePin(m.id)}><I n="pin" size={14} color={m.pinned?'var(--gr-acc)':'var(--gr-t3)'}/></button><button className="gr-icon-btn-sm" onClick={()=>del(m.id)}><I n="trash" size={14} color="var(--gr-exp)"/></button></div>}</div><div className="gr-memo-preview">{m.content?.slice(0,80)}</div><div className="gr-memo-date">{fmtTime(m.createdAt)}</div></div>):all.map(m=> <div key={m.id} className={`gr-memo-list-row ${m.pinned?'pinned':''}`}>{m.pinned&&<I n="pin" size={12} color="var(--gr-acc)"/>}<div className="gr-memo-list-title">{m.title}</div><div className="gr-memo-list-date">{fmtTime(m.createdAt)}</div>{canEdit(myRole)&&<><button className="gr-icon-btn-sm" onClick={()=>togglePin(m.id)}><I n="pin" size={14} color={m.pinned?'var(--gr-acc)':'var(--gr-t3)'}/></button><button className="gr-icon-btn-sm" onClick={()=>del(m.id)}><I n="trash" size={14} color="var(--gr-exp)"/></button></>}</div>)}</div>;
}
