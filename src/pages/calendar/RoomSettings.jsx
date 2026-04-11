import { useState, useRef } from 'react';
import { sbGet, sbDelete, sbPatch } from '../../supabase';
import { uploadToWasabi as uploadFile, deleteFromWasabi as deleteFile } from '../../wasabi';
import I from '../../components/shared/Icon';
import Avatar from '../../components/shared/Avatar';
import Toggle from '../../components/shared/Toggle';
import { shortId, COLORS, ALL_MENUS, DEF_SETTINGS, ROLE_LABELS } from '../../lib/helpers';

export default function RoomSettings({room,updateRoom,friends,memberList,sb,goBack,setSubPage,updateRoomInDb,deleteRoom,userId}){
  const [name,setName]=useState(room.name);
  const [desc,setDesc]=useState(room.desc);
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

  // 항상 편집 가능: onBlur로 저장
  const saveName = async () => {
    const newName = name.trim() || room.name;
    if (newName === room.name) return;
    setName(newName);
    updateRoom(room.id, r => ({...r, name: newName}));
    await updateRoomInDb(room.id, { name: newName });
  };
  const saveDesc = async () => {
    const newDesc = desc.trim();
    if (newDesc === (room.desc||'')) return;
    updateRoom(room.id, r => ({...r, desc: newDesc}));
    await updateRoomInDb(room.id, { description: newDesc });
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

  // 공유 링크 slug — 항상 편집 가능
  const [slug, setSlug] = useState(room.slug || '');
  const [slugErr, setSlugErr] = useState('');
  const handleSaveSlug = async () => {
    const s = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (s === (room.slug||'')) { setSlugErr(''); return; }
    if (!s) {
      // 빈 값 = 슬러그 해제
      setSlug('');
      updateRoom(room.id, r => ({...r, slug: ''}));
      await updateRoomInDb(room.id, { slug: null });
      setSlugErr('');
      return;
    }
    if (s.length < 2) { setSlugErr('2글자 이상 입력하세요'); return; }
    try {
      const existing = await sbGet(`/goroom_rooms?select=id&slug=eq.${s}&id=neq.${room.id}`);
      if (existing?.length > 0) { setSlugErr('이미 사용 중인 주소입니다'); return; }
      setSlug(s);
      updateRoom(room.id, r => ({...r, slug: s}));
      await updateRoomInDb(room.id, { slug: s });
      setSlugErr('');
    } catch (e) { setSlugErr('저장 실패'); console.error(e); }
  };

  // 가입 비밀번호 — 항상 편집 가능
  const [invPw, setInvPw] = useState(room.invitePassword || '');
  const handleSaveInvitePw = async () => {
    if (invPw === (room.invitePassword||'')) return;
    updateRoom(room.id, r => ({...r, invitePassword: invPw}));
    await updateRoomInDb(room.id, { invite_password: invPw || null });
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

      {/* 썸네일 카드 */}
      <div className="gr-settings-card">
        <div className="gr-settings-card-title">썸네일 이미지</div>
        <div className="gr-thumb-upload gr-thumb-square" onClick={()=>!thumbUploading&&thumbRef.current?.click()}>
          {thumbPreview
            ? <>
                <img src={thumbPreview} alt="" className="gr-thumb-img"/>
                <button className="gr-thumb-remove" onClick={e=>{e.stopPropagation();handleThumbRemove();}}><I n="x" size={14} color="#fff"/></button>
              </>
            : <div className="gr-thumb-placeholder">
                <I n="image" size={32} color="var(--gr-t3)"/>
                <span style={{fontSize:12,color:'var(--gr-t3)',marginTop:6}}>{thumbUploading?'업로드중...':'이미지 선택'}</span>
              </div>
          }
        </div>
        <input ref={thumbRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleThumbChange}/>
      </div>

      {/* 캘린더 정보 카드 */}
      <div className="gr-settings-card">
        <div className="gr-settings-card-title">캘린더 정보</div>
        <div className="gr-field">
          <label>이름</label>
          <input className="gr-input" value={name} onChange={e=>setName(e.target.value)} onBlur={saveName} placeholder="캘린더 이름"/>
        </div>
        <div className="gr-field">
          <label>설명</label>
          <input className="gr-input" value={desc} onChange={e=>setDesc(e.target.value)} onBlur={saveDesc} placeholder="간단한 설명"/>
        </div>
        <div className="gr-field gr-field-row">
          <label>공개</label>
          <Toggle on={room.isPublic} toggle={handleTogglePublic}/>
        </div>
      </div>

      {/* 멤버 카드 */}
      <div className="gr-settings-card">
        <div className="gr-settings-card-header">
          <div className="gr-settings-card-title" style={{margin:0}}>멤버 ({memberList.length})</div>
          <button className="gr-btn-invite" onClick={()=>setSubPage('invite')}><I n="userPlus" size={14} color="#fff"/> 초대</button>
        </div>
        {memberList.map(m => (
          <div key={m.id} className="gr-member-row">
            <Avatar src={m.profileImg} name={m.nickname} size={36}/>
            <div className="gr-member-name">{m.nickname}</div>
            {m.role === 'owner' && <span className="gr-role-badge" data-role="owner">방장</span>}
            {m.id !== userId && m.role !== 'owner' && (
              <>
                <select
                  value={m.role}
                  onChange={e=>handleRoleChange(m.id, e.target.value)}
                  className="gr-member-role-select"
                >
                  <option value="vice-owner">부방장</option>
                  <option value="member">멤버</option>
                </select>
                <button className="gr-icon-btn-sm" onClick={()=>handleRemoveMember(m.id)}><I n="x" size={14} color="var(--gr-exp)"/></button>
              </>
            )}
            {m.id === userId && m.role !== 'owner' && (
              <span className="gr-role-badge" data-role={m.role}>{ROLE_LABELS[m.role]||'멤버'}</span>
            )}
          </div>
        ))}
      </div>

      {/* 공유 링크 카드 */}
      {!room.isPersonal && (
        <div className="gr-settings-card">
          <div className="gr-settings-card-title">캘린더 공유 링크</div>
          <div className="gr-field">
            <label>캘린더 주소 (영문)</label>
            <div className="gr-slug-input-wrap">
              <span className="gr-slug-prefix">goroom.kr/calendar/</span>
              <input
                className="gr-input gr-slug-input"
                value={slug}
                onChange={e=>{setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g,''));setSlugErr('');}}
                onBlur={handleSaveSlug}
                placeholder="my-calendar"
              />
            </div>
            {slugErr && <div className="gr-field-err">{slugErr}</div>}
            <div className="gr-field-hint">영문, 숫자, -, _ 2글자 이상. 공유 시 미리보기가 표시됩니다.</div>
          </div>
          <div className="gr-field">
            <label>가입 비밀번호 (선택)</label>
            <input
              className="gr-input"
              value={invPw}
              onChange={e=>setInvPw(e.target.value)}
              onBlur={handleSaveInvitePw}
              placeholder="비워두면 누구나 입장 가능"
            />
            <div className="gr-field-hint">설정하면 공유 링크로 접속 시 비밀번호 입력이 필요합니다.</div>
          </div>
        </div>
      )}

      {/* 기능 ON/OFF 카드 */}
      <div className="gr-settings-card">
        <div className="gr-settings-card-title">기능 ON/OFF</div>
        {ALL_MENUS.map((m, idx) => (
          <div key={m.id} className={idx>0?'gr-feature-block':''}>
            <div className="gr-feature-row">
              <span className="gr-feature-label"><I n={m.icon} size={16}/> {m.label}</span>
              <Toggle on={room.menus[m.id]} toggle={()=>handleToggleMenu(m.id)}/>
            </div>

            {m.id==='cal' && room.menus.cal && (
              <div className="gr-feature-detail">
                <div className="gr-feature-detail-title">스케줄 카테고리</div>
                <div className="gr-tag-list">
                  {st.schCats.map(c => (
                    <div key={c.id} className="gr-tag-item">
                      <span className="gr-tag-dot" style={{background:c.color}}/>
                      <span>{c.name}</span>
                      <button className="gr-icon-btn-sm" onClick={()=>delSchCat(c.id)}><I n="x" size={12} color="var(--gr-t3)"/></button>
                    </div>
                  ))}
                </div>
                <div className="gr-clr-row" style={{marginTop:8,marginBottom:6}}>
                  {COLORS.slice(0,8).map(c => <button key={c} className={`gr-clr-b-sm ${addCatColor===c?'on':''}`} style={{background:c}} onClick={()=>setAddCatColor(c)}/>)}
                </div>
                <div style={{display:'flex',gap:6}}>
                  <input className="gr-input" value={addCatName} onChange={e=>setAddCatName(e.target.value)} placeholder="카테고리 이름" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addSchCat()}/>
                  <button className="gr-btn-sm" onClick={addSchCat}>추가</button>
                </div>
              </div>
            )}

            {m.id==='budget' && room.menus.budget && (
              <div className="gr-feature-detail">
                <div className="gr-feature-detail-title">지출 카테고리</div>
                <div className="gr-tag-list">
                  {st.expCats.map(c => (
                    <div key={c.id} className="gr-tag-item">
                      <span>{c.name}</span>
                      <button className="gr-icon-btn-sm" onClick={()=>delExpCat(c.id)}><I n="x" size={12} color="var(--gr-t3)"/></button>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:6,marginTop:6,marginBottom:14}}>
                  <input className="gr-input" value={addExpName} onChange={e=>setAddExpName(e.target.value)} placeholder="지출 카테고리" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addExpCat()}/>
                  <button className="gr-btn-sm" onClick={addExpCat}>추가</button>
                </div>

                <div className="gr-feature-detail-title">수입 카테고리</div>
                <div className="gr-tag-list">
                  {st.incCats.map(c => (
                    <div key={c.id} className="gr-tag-item">
                      <span>{c.name}</span>
                      <button className="gr-icon-btn-sm" onClick={()=>delIncCat(c.id)}><I n="x" size={12} color="var(--gr-t3)"/></button>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:6,marginTop:6,marginBottom:14}}>
                  <input className="gr-input" value={addIncName} onChange={e=>setAddIncName(e.target.value)} placeholder="수입 카테고리" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addIncCat()}/>
                  <button className="gr-btn-sm" onClick={addIncCat}>추가</button>
                </div>

                <div className="gr-feature-detail-title">결제수단</div>
                <div className="gr-tag-list">
                  {paymentMethods.map(pm => (
                    <div key={pm.id} className="gr-tag-item">
                      <span>{pm.name}</span>
                      <button className="gr-icon-btn-sm" onClick={()=>delPm(pm.id)}><I n="x" size={12} color="var(--gr-t3)"/></button>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:6,marginTop:6}}>
                  <input className="gr-input" value={addPmName} onChange={e=>setAddPmName(e.target.value)} placeholder="결제수단 이름" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&addPm()}/>
                  <select value={addPmType} onChange={e=>setAddPmType(e.target.value)} style={{padding:'8px',borderRadius:8,border:'1px solid var(--gr-brd)',fontSize:13,fontFamily:'var(--gr-ff)'}}>
                    <option value="card">카드</option>
                    <option value="account">계좌</option>
                    <option value="cash">현금</option>
                  </select>
                  <button className="gr-btn-sm" onClick={addPm}>추가</button>
                </div>
              </div>
            )}

            {m.id==='alarm' && room.menus.alarm && (
              <div className="gr-feature-detail">
                <div style={{fontSize:12,color:'var(--gr-t3)'}}>스케줄 등록 시 알람을 설정할 수 있습니다.</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="gr-btn-danger" style={{marginTop:16}} onClick={handleDeleteRoom}><I n="trash" size={16}/> 캘린더 삭제</button>
    </div>
  </div>;
}
