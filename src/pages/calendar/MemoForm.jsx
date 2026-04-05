import { useState } from 'react';
import I from '../../components/shared/Icon';
import { uid } from '../../lib/helpers';

export default function MemoForm({goBack,room,updateRoom,sb,saveMemoDb,userId}){
  const [title,setTitle]=useState(''); const [content,setContent]=useState('');
  const save=async ()=>{
    if(!title.trim()) return;
    const memo = {id:uid(),title:title.trim(),content,pinned:false,createdAt:Date.now(),createdBy:userId};
    updateRoom(room.id,r=>({...r,memos:[...r.memos,memo]}));
    await saveMemoDb(room.id, memo);
    goBack();
  };
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">새 메모</div><div style={{width:28}}/></div><div className="gr-pg-body"><div className="gr-pg-label">제목</div><input className="gr-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="메모 제목" autoFocus style={{marginBottom:12}}/><div className="gr-pg-label">내용</div><textarea className="gr-input" value={content} onChange={e=>setContent(e.target.value)} placeholder="내용을 입력하세요" rows={6} style={{resize:'none'}}/></div><div className="gr-save-bar"><button className="gr-save-btn" disabled={!title.trim()} onClick={save}>저장하기</button></div></div>;
}
