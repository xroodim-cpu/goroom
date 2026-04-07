import { useState, useRef } from 'react';
import I from '../../components/shared/Icon';
import StorageLimitModal from '../../components/shared/StorageLimitModal';
import { uid, fmt, markBlobAsVideo, unmarkBlobUrl, isVideo } from '../../lib/helpers';
import { getUserStorageUsage } from '../../lib/storageCheck';

const MOODS=['😊','😢','😡','😴','🥰','😎','🤔','😱','🤗','😤'];
const WEATHERS=['☀️','⛅','🌧️','❄️','🌪️','🌈','🌙','⚡'];

export default function DiaryForm({goBack,room,updateRoom,sb,saveDiaryDb,userId,rooms,me}){
  const [title,setTitle]=useState('');
  const [content,setContent]=useState('');
  const [images,setImages]=useState([]);
  const [mood,setMood]=useState('');
  const [weather,setWeather]=useState('');
  const [saving,setSaving]=useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
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
      setImages(prev=>[...prev, blobUrl]);
    });
    e.target.value = '';
  };
  const removeImage=(idx)=>setImages(prev=>{
    const url = prev[idx];
    if(url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      unmarkBlobUrl(url);
      delete fileMapRef.current[url];
    }
    return prev.filter((_,i)=>i!==idx);
  });
  const save=async ()=>{
    if(!title.trim()||saving) return;
    setSaving(true);
    const diary = {id:uid(),title:title.trim(),content,images,mood,weather,date:fmt(new Date()),createdAt:Date.now(),createdBy:userId,likes:[],comments:[],_fileMap:fileMapRef.current};
    const savedDiary = await saveDiaryDb(room.id, diary);
    updateRoom(room.id,r=>({...r,diaries:[...r.diaries,savedDiary]}));
    setSaving(false);
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
        {images.map((img,i)=> <div key={i} className="gr-diary-upload-thumb" style={{position:'relative'}}>
          {isVideo(img)?<video src={img} muted style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}}/>:<img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}}/>}
          <button className="gr-diary-upload-remove" onClick={()=>removeImage(i)}><I n="x" size={12} color="#fff"/></button>
        </div>)}
        <div className="gr-diary-upload-add" onClick={handleAddClick} style={{cursor:'pointer'}}>
          {storageChecking ? <div className="gr-loading-spinner" style={{width:20,height:20}}/> : <I n="plus" size={24} color="var(--gr-t3)"/>}
          <span style={{fontSize:11,color:'var(--gr-t3)',marginTop:2}}>{storageChecking?'확인중':'추가'}</span>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleImages} style={{display:'none'}}/>
        </div>
      </div>
      <div className="gr-pg-label">제목</div>
      <input className="gr-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="오늘의 제목" autoFocus style={{marginBottom:12}}/>
      <div className="gr-pg-label">내용</div>
      <textarea className="gr-input" value={content} onChange={e=>setContent(e.target.value)} placeholder="오늘의 일기를 작성하세요" rows={6} style={{resize:'none'}}/>
    </div>
    <div className="gr-save-bar"><button className="gr-save-btn" disabled={!title.trim()||saving} onClick={save}>{saving?'저장중...':'저장하기'}</button></div>
    {showStorageModal && <StorageLimitModal onClose={()=>setShowStorageModal(false)} usedSize={storageUsed} storageLimit={me?.storageLimit||1073741824} userId={userId} onUpgradeComplete={()=>setShowStorageModal(false)}/>}
  </div>;
}
