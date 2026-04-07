import { useState, useRef } from 'react';
import { sbGet, sbDelete, sbPatch } from '../../supabase';
import { uploadToWasabi as uploadFile, deleteFromWasabi as deleteFile } from '../../wasabi';
import I from '../../components/shared/Icon';
import Avatar from '../../components/shared/Avatar';
import Toggle from '../../components/shared/Toggle';
import { shortId, COLORS, ALL_MENUS, DEF_SETTINGS, ROLE_LABELS } from '../../lib/helpers';

export default function RoomSettings({room,updateRoom,friends,memberList,sb,goBack,setSubPage,updateRoomInDb,deleteRoom,userId}){
  const [name,setName]=useState(room.name); const [desc,setDesc]=useState(room.desc); const [editing,setEditing]=useState(false);
  const [addCatName,setAddCatName]=useState(''); const [addCatColor,setAddCatColor]=useState('#4A90D9');
  const [addExpName,setAddExpName]=useState(''); const [addIncName,setAddIncName]=useState('');
  const [addPmName, setAddPmName] = useState(''); const [addPmType, setAddPmType] = useState('card');
  const [thumbPreview,setThumbPreview]=useState(room.thumbnailUrl||'');
  const [thumbUploading,setThumbUploading]=useState(false);
  const thumbRef=useRef(null);
  const st = room.settings || DEF_SETTINGS;
  const paymentMethods = st.paymentMethods || DEF_SETTINGS.paymentMethods;

  const handleThumbChange=async(e)=>{
    const f=e.target.files?.[0]; if(!f) return;
    setThumbUploading(true);
    try {
      const path=`calendar/${room.id}/thumbnail.jpg`;
      const url=await uploadFile(path,f);
      if(url){const finalUrl=url+'?t='+Date.now();setThumbPreview(finalUrl);updateRoom(room.id,r=>({...r,thumbnailUrl:finalUrl}));await updateRoomInDb(room.id,{thumbnail_url:finalUrl});}
    }catch(err){console.error(err);}
    setThumbUploading(false);
  };
  const handleThumbRemove=async()=>{
    setThumbUploading(true);
    try{
      await deleteFile(`calendar/${room.id}/thumbnail.jpg`);
      setThumbPreview('');updateRoom(room.id,r=>({...r,thumbnailUrl:''}));await updateRoomInDb(room.id,{thumbnail_url:null});
    }catch(err){console.error(err);}
    setThumbUploading(false);
  };

  const saveInfo=async ()=>{
    const newName = name.trim()||room.name;
    const newDesc = desc.trim();
    updateRoom(room.id,r=>({...r,name:newName,desc:newDesc}));
    await updateRoomInDb(room.id, { name: newName, description: newDesc });
    setEditing(false);
  };
  const updSettings=(fn)=>{
    const newSettings = fn(room.settings||DEF_SETTINGS);
    updateRoom(room.id,r=>({...r,settings:newSettings}));
    updateRoomInDb(room.id, { settings: newSettings });
  };
  const addSchCat=()=>{if(!addCatName.trim())return; updSettings(s=>({...s,schCats:[...s.schCats,{id:shortId(),name:addCatName.trim(),color:addCatColor}]})); setAddCatName('');};
  const delSchCat=(id)=>updSettings(s=>({...s,schCats:s.schCats.filter(c=>c.id!==id)}));
  const addExpCat=()=>{if(!addExpName.trim())return; updSettings(s=>({...s,expCats:[...s.expCats,{id:shortId(),name:addExpName.trim()}]})); setAddExpName('');};
  const delExpCat=(id)=>updSettings(s=>({...s,expCats:s.expCats.filter(c=>c.id!==id)}));
  const addIncCat=()=>{if(!addIncName.trim())return; updSettings(s=>({...s,incCats:[...s.incCats,{id:shortId(),name:addIncName.trim()}]})); setAddIncName('');};
  const delIncCat=(id)=>updSettings(s=>({...s,incCats:s.incCats.filter(c=>c.id!==id)}));
  const addPm=()=>{if(!addPmName.trim())return; updSettings(s=>({...s,paymentMethods:[...(s.paymentMethods||[]),{id:shortId(),name:addPmName.trim(),type:addPmType}]})); setAddPmName('');};
  const delPm=(id)=>updSettings(s=>({...s,paymentMethods:(s.paymentMethods||[]).filter(c=>c.id!==id)}));

  const handleTogglePublic = async () => {
    updateRoom(room.id,r=>({...r,isPublic:!r.isPublic}));
    await updateRoomInDb(room.id, { is_public: !room.isPublic });
  };
  const handleToggleMenu = async (menuId) => {
    const newMenus = {...room.menus,[menuId]:!room.menus[menuId]};
    updateRoom(room.id,r=>({...r,menus:newMenus}));
    await updateRoomInDb(room.id, { menus: newMenus });
  };
  // 공유 링크 slug
  const [slug, setSlug] = useState(room.slug || '');
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugErr, setSlugErr] = useState('');
  const [slugCopied, setSlugCopied] = useState(false);
  const saveSlug = async () => {
    const s = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!s) { setSlugErr('영문, 숫자, -, _ 만 사용 가능합니다'); return; }
    if (s.length < 2) { setSlugErr('2글자 이상 입력하세요'); return; }
    try {
      // 중복 확인
      const existing = await sbGet(`/goroom_rooms?select=id&slug=eq.${s}&id=neq.${room.id}`);
      if (existing?.length > 0) { setSlugErr('이미 사용 중인 주소입니다'); return; }
      setSlug(s);
      updateRoom(room.id, r => ({...r, slug: s}));
      await updateRoomInDb(room.id, { slug: s });
      setSlugEditing(false); setSlugErr('');
    } catch (e) { setSlugErr('저장 실패'); console.error(e); }
  };
  const copySlugLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/@${slug}`).then(() => { setSlugCopied(true); setTimeout(() => setSlugCopied(false), 2000); });
  };

  // 가입 비밀번호
  const [invPw, setInvPw] = useState(room.invitePassword || '');
  const saveInvitePassword = async () => {
    updateRoom(room.id, r => ({...r, invitePassword: invPw}));
    await updateRoomInDb(room.id, { invite_password: invPw || null });
    alert(invPw ? '비밀번호가 설정되었습니다.' : '비밀번호가 해제되었습니다.');
  };
  const handleDeleteRoom = async () => {
    if(!window.confirm('이 캘린더를 삭제하시겠습니까?')) return;
    await deleteRoom(room.id);
    window.location.reload();
  };
  const handleRoleChange = async (memberId, newRole) => {
    if(memberId===userId) return;
    updateRoom(room.id,r=>({...r,members:r.members.map(m=>m.id===memberId?{...m,role:newRole}:m)}));
    try { await sbPatch(`/goroom_room_members?room_id=eq.${room.id}&user_id=eq.${memberId}`, {role:newRole}); } catch(e){console.error(e);}
  };
  const handleRemoveMember = async (memberId) => {
    updateRoom(room.id,r=>({...r,members:r.members.filter(m=>m.id!==memberId)}));
    try {
      await sbDelete(`/goroom_room_members?room_id=eq.${room.id}&user_id=eq.${memberId}`);
    } catch(e) { console.error(e); }
  };

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">캘린더 설정</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-pg-label">썸네일 이미지</div>
      <div className="gr-thumb-upload" onClick={()=>!thumbUploading&&thumbRef.current?.click()}>{thumbPreview?<><img src={thumbPreview} alt="" className="gr-thumb-img"/><button className="gr-thumb-remove" onClick={e=>{e.stopPropagation();handleThumbRemove();}}><I n="x" size={14} color="#fff"/></button></>:<div className="gr-thumb-placeholder"><I n="image" size={28} color="var(--gr-t3)"/><span style={{fontSize:12,color:'var(--gr-t3)',marginTop:4}}>{thumbUploading?'업로드중...':'이미지 선택'}</span></div>}</div>
      <input ref={thumbRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleThumbChange}/>
      <div className="gr-pg-label">캘린더 정보 {!editing&&<button className="gr-icon-btn-sm" onClick={()=>setEditing(true)}><I n="edit" size={14}/></button>}</div>
      {editing ? <div>
        <input className="gr-input" value={name} onChange={e=>setName(e.target.value)} placeholder="이름" style={{marginBottom:8}}/>
        <input className="gr-input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="설명"/>
        <div style={{display:'flex',gap:6,marginTop:8}}><button className="gr-btn-sm" onClick={saveInfo}>저장</button><button className="gr-btn-sm-outline" onClick={()=>{setName(room.name);setDesc(room.desc);setEditing(false);}}>취소</button></div>
      </div> : <div>
        <div className="gr-set-row"><span className="gr-set-label">이름</span><span className="gr-set-val">{room.name}</span></div>
        <div className="gr-set-row"><span className="gr-set-label">설명</span><span className="gr-set-val">{room.desc||'-'}</span></div>
      </div>}
      <div className="gr-set-row"><span className="gr-set-label">공개</span><Toggle on={room.isPublic} toggle={handleTogglePublic}/></div>

      <div className="gr-pg-label" style={{marginTop:20}}>멤버 ({memberList.length}) <button className="gr-btn-invite" onClick={()=>setSubPage('invite')}><I n="userPlus" size={14} color="#fff"/> 초대</button></div>
      {memberList.map(m=> <div key={m.id} className="gr-set-member"><Avatar name={m.nickname} size={32}/><span>{m.nickname}</span><span className="gr-role-badge" data-role={m.role}>{ROLE_LABELS[m.role]||'멤버'}</span>{m.id!==userId&&<><select value={m.role} onChange={e=>handleRoleChange(m.id,e.target.value)} style={{marginLeft:'auto',fontSize:12,padding:'4px 8px',borderRadius:6,border:'1px solid var(--gr-brd)',background:'var(--gr-card)',color:'var(--gr-text)',fontFamily:'var(--gr-ff)'}}><option value="vice-owner">부방장</option><option value="member">멤버</option></select><button className="gr-icon-btn-sm" onClick={()=>handleRemoveMember(m.id)}><I n="x" size={14} color="var(--gr-exp)"/></button></>}</div>)}

      {!room.isPersonal && <><div className="gr-pg-label" style={{marginTop:20}}><I n="link" size={14}/> 캘린더 공유 링크</div>
      <div style={{padding:'12px',background:'var(--gr-bg)',borderRadius:12,marginBottom:12}}>
        <div style={{fontSize:12,color:'var(--gr-t3)',marginBottom:6}}>캘린더 주소 (영문)</div>
        {slug && !slugEditing ? (
          <div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <input className="gr-input" readOnly value={`${window.location.origin}/@${slug}`} style={{flex:1,fontSize:12}}/>
              <button className="gr-btn-sm" onClick={copySlugLink} style={{whiteSpace:'nowrap'}}>{slugCopied?'복사됨!':'복사'}</button>
            </div>
            <button className="gr-btn-sm-outline" onClick={()=>setSlugEditing(true)} style={{marginTop:8,fontSize:12}}>주소 변경</button>
          </div>
        ) : (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:4}}>
              <span style={{fontSize:13,color:'var(--gr-t3)',whiteSpace:'nowrap'}}>goroom.kr/@</span>
              <input className="gr-input" value={slug} onChange={e=>{setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g,''));setSlugErr('');}} placeholder="my-calendar" style={{flex:1,fontSize:13}}/>
            </div>
            {slugErr && <div style={{color:'var(--gr-exp)',fontSize:11,marginBottom:4}}>{slugErr}</div>}
            <div style={{display:'flex',gap:6}}>
              <button className="gr-btn-sm" onClick={saveSlug}>저장</button>
              {slug && <button className="gr-btn-sm-outline" onClick={()=>{setSlug(room.slug||'');setSlugEditing(false);setSlugErr('');}}>취소</button>}
            </div>
            <div style={{fontSize:11,color:'var(--gr-t3)',marginTop:4}}>SNS 공유 시 미리보기에 캘린더 정보가 표시됩니다</div>
          </div>
        )}
      </div>

      <div style={{padding:'12px',background:'var(--gr-bg)',borderRadius:12,marginBottom:8}}>
        <div style={{fontSize:12,color:'var(--gr-t3)',marginBottom:6}}><I n="lock" size={12}/> 가입 비밀번호 (선택)</div>
        <div style={{display:'flex',gap:6}}>
          <input className="gr-input" value={invPw} onChange={e=>setInvPw(e.target.value)} placeholder="비밀번호 미설정" style={{flex:1}}/>
          <button className="gr-btn-sm" onClick={saveInvitePassword}>저장</button>
        </div>
        <div style={{fontSize:11,color:'var(--gr-t3)',marginTop:4}}>설정하면 공유 링크로 접속 시 비밀번호 입력 필요</div>
      </div></>}

      <div className="gr-pg-label" style={{marginTop:20}}>기능 ON/OFF</div>

      {ALL_MENUS.map(m=> <div key={m.id}>
        <div className="gr-set-row"><span className="gr-set-label"><I n={m.icon} size={16}/> {m.label}</span><Toggle on={room.menus[m.id]} toggle={()=>handleToggleMenu(m.id)}/></div>

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
          <div style={{display:'flex',gap:6,marginBottom:12}}><input className="gr-input" value={addIncName} onChange={e=>setAddIncName(e.target.value)} placeholder="수입 카테고리" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addIncCat()}/><button className="gr-btn-sm" onClick={addIncCat}>추가</button></div>

          <div className="gr-setting-detail-title">결제수단 관리</div>
          <div className="gr-tag-list">{paymentMethods.map(pm=> <div key={pm.id} className="gr-tag-item">
            <span>{pm.name}</span>
            <button className="gr-icon-btn-sm" onClick={()=>delPm(pm.id)}><I n="x" size={12} color="var(--gr-t3)"/></button>
          </div>)}</div>
          <div style={{display:'flex',gap:6}}>
            <input className="gr-input" value={addPmName} onChange={e=>setAddPmName(e.target.value)} placeholder="결제수단 이름" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addPm()}/>
            <select value={addPmType} onChange={e=>setAddPmType(e.target.value)} style={{padding:'8px',borderRadius:8,border:'1px solid var(--gr-brd)',fontSize:13,fontFamily:'var(--gr-ff)'}}>
              <option value="card">카드</option><option value="account">계좌</option><option value="cash">현금</option>
            </select>
            <button className="gr-btn-sm" onClick={addPm}>추가</button>
          </div>
        </div>}

        {m.id==='alarm' && room.menus.alarm && <div className="gr-setting-detail">
          <div style={{fontSize:12,color:'var(--gr-t3)'}}>스케줄 등록 시 알람을 설정할 수 있습니다.</div>
        </div>}
      </div>)}

      <button className="gr-btn-danger" style={{marginTop:24}} onClick={handleDeleteRoom}><I n="trash" size={16}/> 캘린더 삭제</button>
    </div>
  </div>;
}
