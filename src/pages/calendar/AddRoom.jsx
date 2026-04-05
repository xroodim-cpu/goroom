import { useState, useRef } from 'react';
import I from '../../components/shared/Icon';
import Avatar from '../../components/shared/Avatar';
import Toggle from '../../components/shared/Toggle';
import { ALL_MENUS, DEF_SETTINGS } from '../../lib/helpers';

export default function AddRoomPage({goBack,setRooms,sb,friends,createRoom,userId}){
  const [name,setName]=useState(''); const [desc,setDesc]=useState(''); const [isPublic,setIsPublic]=useState(true);
  const [menus,setMenus]=useState({cal:true,memo:true,todo:true,diary:true,budget:true,alarm:true});
  const [selMembers,setSelMembers]=useState([]);
  const [saving,setSaving]=useState(false);
  const [thumbPreview,setThumbPreview]=useState(null);
  const [thumbFile,setThumbFile]=useState(null);
  const thumbRef=useRef(null);
  const handleThumb=(e)=>{const f=e.target.files?.[0]; if(!f) return; setThumbFile(f); const r=new FileReader(); r.onload=ev=>setThumbPreview(ev.target.result); r.readAsDataURL(f);};
  const removeThumb=()=>{setThumbPreview(null);setThumbFile(null);if(thumbRef.current)thumbRef.current.value='';};
  const toggleMenu=(id)=>setMenus(p=>({...p,[id]:!p[id]}));
  const toggleMember=(fid)=>setSelMembers(p=>p.includes(fid)?p.filter(x=>x!==fid):[...p,fid]);
  const save=async ()=>{
    if(!name.trim()||saving) return;
    setSaving(true);
    const roomData = {name:name.trim(),desc:desc.trim(),isPublic,menus,members:[userId,...selMembers],thumbnailFile:thumbFile};
    const roomId = await createRoom(roomData);
    setRooms(p=>[...p,{id:roomId,name:name.trim(),desc:desc.trim(),isPersonal:false,isPublic,thumbnailUrl:thumbPreview||'',members:[userId,...selMembers],newCount:0,nearestSchedule:null,menus,settings:{...DEF_SETTINGS},schedules:[],memos:[],todos:[],diaries:[]}]);
    setSaving(false);
    goBack();
  };
  return <div className="gr-panel"><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">새 캘린더방</div><div style={{width:28}}/></div><div className="gr-pg-body"><div className="gr-pg-label">썸네일 이미지</div><div className="gr-thumb-upload" onClick={()=>thumbRef.current?.click()}>{thumbPreview?<><img src={thumbPreview} alt="" className="gr-thumb-img"/><button className="gr-thumb-remove" onClick={e=>{e.stopPropagation();removeThumb();}}><I n="x" size={14} color="#fff"/></button></>:<div className="gr-thumb-placeholder"><I n="image" size={28} color="var(--gr-t3)"/><span style={{fontSize:12,color:'var(--gr-t3)',marginTop:4}}>이미지 선택</span></div>}</div><input ref={thumbRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleThumb}/><div className="gr-pg-label">캘린더명</div><input className="gr-input" value={name} onChange={e=>setName(e.target.value)} placeholder="이름" autoFocus style={{marginBottom:12}}/><div className="gr-pg-label">설명</div><input className="gr-input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="설명" style={{marginBottom:12}}/><div className="gr-pg-label">공개 여부</div><div style={{display:'flex',gap:8,marginBottom:16}}><button className={`gr-pill ${isPublic?'on':''}`} style={isPublic?{background:'var(--gr-acc)',color:'var(--gr-acc-text)'}:{}} onClick={()=>setIsPublic(true)}>공개</button><button className={`gr-pill ${!isPublic?'on':''}`} style={!isPublic?{background:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setIsPublic(false)}>비공개</button></div><div className="gr-pg-label">기능 ON/OFF</div>{ALL_MENUS.map(m=> <div key={m.id} className="gr-set-row"><span className="gr-set-label"><I n={m.icon} size={16}/> {m.label}</span><Toggle on={menus[m.id]} toggle={()=>toggleMenu(m.id)}/></div>)}<div className="gr-pg-label" style={{marginTop:16}}>멤버 초대 (선택)</div>{friends.map(f=> <div key={f.id} className="gr-friend-row" style={{padding:'8px 0'}} onClick={()=>toggleMember(f.id)}><Avatar name={f.nickname} size={32} src={f.profileImg}/><div className="gr-friend-info"><div className="gr-friend-name" style={{fontSize:13}}>{f.nickname}</div></div><div className={`gr-todo-cb ${selMembers.includes(f.id)?'done':''}`} style={{width:20,height:20}}>{selMembers.includes(f.id)&&<I n="check" size={12} color="#fff"/>}</div></div>)}</div><div className="gr-save-bar"><button className="gr-save-btn" disabled={!name.trim()||saving} onClick={save}>{saving?'만드는중...':'만들기'}</button></div></div>;
}
