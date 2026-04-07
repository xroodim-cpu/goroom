import { useState, useRef } from 'react';
import I from '../../components/shared/Icon';
import Toggle from '../../components/shared/Toggle';
import StorageLimitModal from '../../components/shared/StorageLimitModal';
import { uid, shortId, COLORS, DEF_SETTINGS, isVideo, markBlobAsVideo, unmarkBlobUrl } from '../../lib/helpers';
import { getUserStorageUsage } from '../../lib/storageCheck';

export default function ScheduleForm({goBack,room,updateRoom,selDate,sb,saveSchedule,updateSchedule,userId,editData,rooms,me}){
  const isEdit = !!editData;
  const st = room.settings || DEF_SETTINGS;
  const menus = room.menus;
  const paymentMethods = st.paymentMethods || DEF_SETTINGS.paymentMethods;
  const [title,setTitle]=useState(editData?.title||'');
  const [date,setDate]=useState(editData?.date||selDate);
  const [time,setTime]=useState(editData?.time||'');
  const [memo,setMemo]=useState(editData?.memo||'');
  const [location,setLocation]=useState(editData?.location||'');
  const [locationDetail,setLocationDetail]=useState(editData?.locationDetail||'');
  const [addrQuery,setAddrQuery]=useState('');
  const [addrResults,setAddrResults]=useState([]);
  const [addrSearching,setAddrSearching]=useState(false);
  const [showAddrSearch,setShowAddrSearch]=useState(false);
  const [color,setColor]=useState(editData?.color||st.schCats[0]?.color||COLORS[0]);
  const [catId,setCatId]=useState(editData?.catId||st.schCats[0]?.id||'');
  const [todos,setTodos]=useState(editData?.todos?.length>0?editData.todos:[{id:shortId(),text:''}]);
  const [hasDday,setHasDday]=useState(editData?.dday||false);
  const [hasRepeat,setHasRepeat]=useState(!!editData?.repeat);
  const [rpType,setRpType]=useState(editData?.repeat?.type||'daily');
  const [rpInterval,setRpInterval]=useState(String(editData?.repeat?.interval||'1'));
  const [rpEnd,setRpEnd]=useState(editData?.repeat?.endDate?'date':'none');
  const [rpEndDate,setRpEndDate]=useState(editData?.repeat?.endDate||'');
  const [alBefore,setAlBefore]=useState(editData?.alarm?.before||'');
  const [alMsg,setAlMsg]=useState(editData?.alarm?.message||'');
  const [bType,setBType]=useState(editData?.budget?.type||'expense');
  const [bAmt,setBAmt]=useState(editData?.budget?.amount?String(editData.budget.amount):'');
  const [bCatId,setBCatId]=useState(editData?.budget?.catId||st.expCats[0]?.id||'');
  const [bPmId, setBPmId] = useState(editData?.budget?.pmId||paymentMethods[0]?.id||'');
  const [bShowInCal, setBShowInCal] = useState(editData?.budget?.showInCal!==false);
  const [images,setImages]=useState(editData?.images||[]);
  const [mood,setMood]=useState(editData?.mood||'');
  const [saving, setSaving] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  // File 객체를 blob URL에 매핑 (메모리 효율: readAsDataURL 대신 createObjectURL 사용)
  const fileMapRef = useRef({});
  const fileInputRef = useRef(null);
  const [storageChecking, setStorageChecking] = useState(false);
  const handleAddClick = async () => {
    if (storageChecking) return;
    setStorageChecking(true);
    try {
      const used = await getUserStorageUsage(userId, rooms||[]);
      const limit = me?.storageLimit || 1073741824;
      if (used >= limit) {
        setStorageUsed(used);
        setShowStorageModal(true);
        setStorageChecking(false);
        return;
      }
    } catch(err) { console.error('storage check error:', err); }
    setStorageChecking(false);
    fileInputRef.current?.click();
  };
  const handleImages=(e)=>{
    const files = Array.from(e.target.files);
    if(!files.length) return;
    files.forEach(file=>{
      const blobUrl = URL.createObjectURL(file);
      fileMapRef.current[blobUrl] = file;
      if(file.type.startsWith('video/')) markBlobAsVideo(blobUrl);
      setImages(p=>[...p, blobUrl]);
    });
    e.target.value = '';
  };
  const removeImage=(idx)=>setImages(p=>{
    const url = p[idx];
    if(url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      unmarkBlobUrl(url);
      delete fileMapRef.current[url];
    }
    return p.filter((_,i)=>i!==idx);
  });

  const selectCat = (id) => { setCatId(id); const c=st.schCats.find(x=>x.id===id); if(c) setColor(c.color); };

  const searchAddr = async () => {
    if(!addrQuery.trim()) return;
    setAddrSearching(true);
    try {
      const res = await fetch(`https://dyotbojxtcqhcmrefofb.supabase.co/functions/v1/kakao-search?query=${encodeURIComponent(addrQuery.trim())}&size=10`);
      const data = await res.json();
      setAddrResults(data.documents || []);
    } catch(e) { console.error('주소 검색 오류:', e); setAddrResults([]); }
    setAddrSearching(false);
  };

  const selectAddr = (item) => {
    setLocation(item.place_name || item.address_name);
    setLocationDetail(item.road_address_name || item.address_name || '');
    setShowAddrSearch(false);
    setAddrResults([]);
    setAddrQuery('');
  };

  const save = async () => {
    if(!title.trim() || saving) return;
    setSaving(true);
    const bCats = bType==='expense' ? st.expCats : st.incCats;
    const bCatItem = bCats.find(c=>c.id===bCatId);
    const sch = {
      id: isEdit ? editData.id : uid(),
      title:title.trim(), date, time, memo, mood, location: location||null, locationDetail: locationDetail||null, color, catId, images, _fileMap: fileMapRef.current,
      createdAt: isEdit ? editData.createdAt : Date.now(),
      createdBy: isEdit ? editData.createdBy : userId,
      todos: menus.todo ? todos.filter(t=>t.text.trim()).map(t=>({id:t.id,text:t.text.trim(),done:t.done||false})) : [],
      dday: hasDday,
      repeat: hasRepeat ? {type:rpType, interval:parseInt(rpInterval)||1, endDate:rpEnd==='date'?rpEndDate:null} : null,
      alarm: menus.alarm && alBefore ? {before:alBefore, message:alMsg} : null,
      budget: menus.budget && bAmt ? {type:bType, amount:Number(bAmt), catId:bCatId, bCatName:bCatItem?.name||'', pmId:bPmId, showInCal:bShowInCal} : null,
    };
    let savedSch;
    if (isEdit && updateSchedule) {
      savedSch = await updateSchedule(room.id, sch);
      updateRoom(room.id, r=>({...r, schedules:r.schedules.map(sc=>sc.id===sch.id?savedSch:sc)}));
    } else {
      savedSch = await saveSchedule(room.id, sch);
      updateRoom(room.id, r=>({...r, schedules:[...r.schedules, savedSch]}));
    }
    setSaving(false);
    goBack(isEdit ? savedSch : undefined);
  };

  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">{isEdit?'스케줄 수정':'새 스케줄'}</div><div style={{width:28}}/></div>
    <div className="gr-pg-body">
      <div className="gr-pg-label" style={{marginTop:0}}>카테고리</div>
      <div className="gr-pills-scroll">{st.schCats.map(c=> <button key={c.id} className={`gr-pill-btn ${catId===c.id?'on':''}`} style={catId===c.id?{background:c.color,borderColor:c.color,color:'#fff'}:{}} onClick={()=>selectCat(c.id)}>{c.name}</button>)}</div>
      <div className="gr-emoji-row" style={{marginBottom:8}}>{['😊','😢','😡','😴','🥰','😎','🤔','😱','🤗','😤'].map(e=> <button key={e} className={`gr-emoji-btn ${mood===e?'on':''}`} onClick={()=>setMood(mood===e?'':e)}>{e}</button>)}</div>
      <input className="gr-input lg" value={title} onChange={e=>setTitle(e.target.value)} placeholder="스케줄명을 입력하세요" autoFocus/>
      <div className="gr-form-row">
        <div className="gr-form-half"><div className="gr-pg-label"><I n="cal" size={14}/> 날짜</div><input className="gr-input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="gr-form-half"><div className="gr-pg-label"><I n="clock" size={14}/> 시간</div><input className="gr-input" type="time" value={time} onChange={e=>setTime(e.target.value)}/></div>
      </div>

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

      <div className="gr-form-divider">
        <div className="gr-pg-label" style={{marginTop:0}}><I n="pin" size={14}/> 장소</div>
        {location ? (
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{flex:1,padding:'10px 12px',background:'var(--gr-bg)',borderRadius:10,fontSize:13}}>
              <div style={{fontWeight:600}}>{location}</div>
              {locationDetail && locationDetail!==location && <div style={{color:'var(--gr-t3)',fontSize:12,marginTop:2}}>{locationDetail}</div>}
            </div>
            <button className="gr-icon-btn" onClick={()=>{setLocation('');setLocationDetail('');}} style={{flexShrink:0}}><I n="close" size={16}/></button>
          </div>
        ) : showAddrSearch ? (
          <div>
            <div style={{display:'flex',gap:6}}>
              <input className="gr-input" value={addrQuery} onChange={e=>setAddrQuery(e.target.value)} placeholder="장소명 또는 주소 검색" autoFocus onKeyDown={e=>{if(e.key==='Enter')searchAddr();}} style={{flex:1}}/>
              <button className="gr-btn-sm" onClick={searchAddr} disabled={addrSearching} style={{whiteSpace:'nowrap',padding:'8px 14px',background:'var(--gr-acc)',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>{addrSearching?'...':'검색'}</button>
            </div>
            {addrResults.length>0 && <div style={{maxHeight:200,overflowY:'auto',marginTop:6,border:'1px solid var(--gr-border)',borderRadius:10,background:'#fff'}}>
              {addrResults.map((r,i)=> <div key={i} onClick={()=>selectAddr(r)} style={{padding:'10px 12px',cursor:'pointer',borderBottom:i<addrResults.length-1?'1px solid var(--gr-border)':'none',fontSize:13}} onMouseOver={e=>e.currentTarget.style.background='var(--gr-bg)'} onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                <div style={{fontWeight:600}}>{r.place_name}</div>
                <div style={{color:'var(--gr-t3)',fontSize:12}}>{r.road_address_name||r.address_name}</div>
              </div>)}
            </div>}
            {addrResults.length===0 && addrSearching===false && addrQuery && <div style={{padding:10,fontSize:13,color:'var(--gr-t3)',textAlign:'center'}}>검색 결과가 없습니다</div>}
            <button onClick={()=>{setShowAddrSearch(false);setAddrResults([]);setAddrQuery('');}} style={{marginTop:6,fontSize:12,color:'var(--gr-t3)',background:'none',border:'none',cursor:'pointer'}}>취소</button>
          </div>
        ) : (
          <button onClick={()=>setShowAddrSearch(true)} style={{width:'100%',padding:'10px 12px',border:'1.5px dashed var(--gr-border)',borderRadius:10,background:'none',color:'var(--gr-t3)',fontSize:13,cursor:'pointer',textAlign:'left'}}>📍 장소 검색하기</button>
        )}
      </div>

      <div className="gr-form-divider">
        <div className="gr-pg-label" style={{marginTop:0}}>내용</div>
        <textarea className="gr-input" value={memo} onChange={e=>setMemo(e.target.value)} placeholder="내용을 입력하세요 (선택)" rows={3} style={{resize:'none'}}/>
      </div>

      {menus.todo && <div className="gr-form-divider">
        <div className="gr-form-sec-title"><I n="check" size={14} color="#3B82F6"/> 할 일 체크리스트</div>
        {todos.map(t=> <div key={t.id} className="gr-todo-input-row">
          <input className="gr-input" value={t.text} onChange={e=>setTodos(p=>p.map(x=>x.id===t.id?{...x,text:e.target.value}:x))} placeholder="할 일 입력" onKeyDown={e=>{if(e.key==='Enter') setTodos(p=>[...p,{id:shortId(),text:''}]);}}/>
          {todos.length>1&&<button className="gr-icon-btn" onClick={()=>setTodos(p=>p.filter(x=>x.id!==t.id))}><I n="x" size={16} color="var(--gr-t3)"/></button>}
        </div>)}
        <button className="gr-add-todo-btn" onClick={()=>setTodos(p=>[...p,{id:shortId(),text:''}])}>+ 할 일 추가</button>
      </div>}

      <div className="gr-form-divider">
        <div className="gr-form-sec-row"><span className="gr-form-sec-title"><I n="clock" size={14} color="#F97316"/> D-day 카운트다운</span><Toggle on={hasDday} toggle={()=>setHasDday(!hasDday)}/></div>
      </div>

      {menus.alarm && <div className="gr-form-divider">
        <div className="gr-form-sec-title"><I n="bell" size={14} color="#EAB308"/> 알람</div>
        <div className="gr-pills-scroll">{[['','없음'],['10m','10분 전'],['30m','30분 전'],['1h','1시간 전'],['1d','하루 전']].map(([k,v])=> <button key={k} className={`gr-pill-btn ${alBefore===k?'on':''}`} style={alBefore===k?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setAlBefore(k)}>{v}</button>)}</div>
        <input className="gr-input" value={alMsg} onChange={e=>setAlMsg(e.target.value)} placeholder="알림 메시지 (선택)"/>
      </div>}

      {menus.budget && <div className="gr-form-divider">
        <div className="gr-form-sec-title"><I n="wallet" size={14} color="#22C55E"/> 가계부</div>
        <div style={{display:'flex',gap:6,marginBottom:8}}><button className={`gr-type-btn ${bType==='expense'?'on-e':''}`} onClick={()=>{setBType('expense');setBCatId(st.expCats[0]?.id||'');}}>지출</button><button className={`gr-type-btn ${bType==='income'?'on-i':''}`} onClick={()=>{setBType('income');setBCatId(st.incCats[0]?.id||'');}}>수입</button></div>
        <div className="gr-pg-label">금액 (원)</div>
        <input className="gr-input lg" type="number" value={bAmt} onChange={e=>setBAmt(e.target.value)} placeholder="0"/>
        <div className="gr-pg-label">{bType==='expense'?'지출':'수입'} 카테고리</div>
        <div className="gr-pills-scroll">{(bType==='expense'?st.expCats:st.incCats).map(c=> <button key={c.id} className={`gr-pill-btn ${bCatId===c.id?'on':''}`} style={bCatId===c.id?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setBCatId(c.id)}>{c.name}</button>)}</div>
        <div className="gr-pg-label">결제수단</div>
        <div className="gr-pills-scroll">{paymentMethods.map(pm=> <button key={pm.id} className={`gr-pill-btn ${bPmId===pm.id?'on':''}`} style={bPmId===pm.id?{background:'var(--gr-text)',borderColor:'var(--gr-text)',color:'#fff'}:{}} onClick={()=>setBPmId(pm.id)}>{pm.name}</button>)}</div>
        <div className="gr-form-sec-row" style={{marginTop:8}}><span className="gr-form-sec-title"><I n="cal" size={14}/> 캘린더에 표시</span><Toggle on={bShowInCal} toggle={()=>setBShowInCal(!bShowInCal)}/></div>
      </div>}

      <div className="gr-form-divider">
        <div className="gr-form-sec-title"><I n="image" size={14} color="var(--gr-t2)"/> 파일 첨부</div>
        <div className="gr-diary-upload-area">
          {images.map((img,i)=> <div key={i} className="gr-diary-upload-thumb" style={{position:'relative'}}>
            {isVideo(img)?<video src={img} muted style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}}/>:<img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}}/>}
            {isVideo(img)&&<div className="gr-video-badge"><I n="play" size={14} color="#fff"/></div>}
            <button className="gr-diary-upload-remove" onClick={()=>removeImage(i)}><I n="x" size={12} color="#fff"/></button>
          </div>)}
          <div className="gr-diary-upload-add" onClick={handleAddClick} style={{cursor:'pointer'}}>
            {storageChecking ? <div className="gr-loading-spinner" style={{width:20,height:20}}/> : <I n="plus" size={24} color="var(--gr-t3)"/>}
            <span style={{fontSize:11,color:'var(--gr-t3)',marginTop:2}}>{storageChecking?'확인중':'추가'}</span>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleImages} style={{display:'none'}}/>
          </div>
        </div>
      </div>

      <div style={{height:20}}/>
    </div>
    <div className="gr-save-bar"><button className="gr-save-btn" disabled={!title.trim()||saving} onClick={save}>{saving?'저장중...':(isEdit?'수정하기':'저장하기')}</button></div>
    {showStorageModal && <StorageLimitModal onClose={()=>setShowStorageModal(false)} usedSize={storageUsed} storageLimit={me?.storageLimit||1073741824} userId={userId} onUpgradeComplete={()=>setShowStorageModal(false)}/>}
  </div>;
}
