import { useState, useMemo } from 'react';
import I from '../../../components/shared/Icon';
import Avatar from '../../../components/shared/Avatar';
import ImageViewer from '../../../components/shared/ImageViewer';
import DiarySlider from '../../../components/shared/DiarySlider';
import { fmtTime, shortId, canEdit } from '../../../lib/helpers';

export default function RoomDiary({diaries,schedules,isMulti,getName,room,updateRoom,onSchClick,updateDiaryLikes,updateDiaryComments,userId,myRole}){
  const [commentText,setCommentText]=useState('');
  const [viewerImgs,setViewerImgs]=useState(null);
  const [viewerIdx,setViewerIdx]=useState(0);
  const [replyTo,setReplyTo]=useState(null);

  const toggleLike=async (did,e)=>{
    e.stopPropagation();
    let newLikes;
    updateRoom(room.id,r=>({...r,diaries:r.diaries.map(d=>{
      if(d.id!==did) return d;
      const likes=d.likes||[];
      const already=likes.includes(userId);
      newLikes = already?likes.filter(x=>x!==userId):[...likes,userId];
      return {...d,likes:newLikes};
    })}));
    if(newLikes) await updateDiaryLikes(did, newLikes);
  };
  const addComment=async (did)=>{
    if(!commentText.trim()) return;
    const newComment = {id:shortId(),text:commentText.trim(),by:userId,at:Date.now()};
    let newComments;
    updateRoom(room.id,r=>({...r,diaries:r.diaries.map(d=>{
      if(d.id!==did) return d;
      newComments = [...(d.comments||[]),newComment];
      return {...d,comments:newComments};
    })}));
    setCommentText('');
    if(newComments) await updateDiaryComments(did, newComments);
  };
  const share=(item,e)=>{
    e.stopPropagation();
    const text=item._type==='schedule'
      ? `${item.title||''}\n${item.date} ${item.time||''}`
      : `${item.mood||''}${item.weather||''} ${item.title||''}\n${item.content?.slice(0,100)||''}`;
    if(navigator.share) navigator.share({title:item.title||'',text}).catch(()=>{});
    else {navigator.clipboard?.writeText(text);alert('복사됨!');}
  };

  const feed = useMemo(()=>{
    const items = [];
    (diaries||[]).forEach(d=>items.push({...d,_type:'diary'}));
    (schedules||[]).forEach(s=>items.push({...s,createdAt:s.createdAt||new Date(s.date+'T00:00:00').getTime(),_type:'schedule'}));
    return items.sort((a,b)=>b.createdAt-a.createdAt);
  },[diaries,schedules]);

  if(!feed.length) return <div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>📖</div>피드가 비어있습니다</div>;

  return <div className="gr-thr-feed">
    {viewerImgs&&<ImageViewer images={viewerImgs} startIdx={viewerIdx} onClose={()=>setViewerImgs(null)}/>}

    {feed.map(item=>{
      const isDiary = item._type==='diary';
      const isSch = item._type==='schedule';
      const imgs = item.images||[];
      const author = getName(item.createdBy||userId);
      const time = item.createdAt?fmtTime(item.createdAt):(item.date||'');

      return <div key={(isSch?'s-':'')+item.id} className="gr-thr-post">
        {/* Header: avatar + name + time + more */}
        <div className="gr-thr-post-header">
          <Avatar name={author} size={40}/>
          <div style={{flex:1,minWidth:0}}>
            <div className="gr-thr-post-name">{author}</div>
            <div className="gr-thr-post-time">{time}</div>
          </div>
          {canEdit(myRole)&&<button className="gr-icon-btn" style={{color:'var(--gr-t3)'}}><I n="more" size={18}/></button>}
        </div>

        {/* Content */}
        <div className="gr-thr-post-content">
          {isSch && <>
            <div className="gr-thr-sch-title" onClick={()=>onSchClick&&onSchClick(item)}>
              <div className="gr-thr-sch-dot" style={{background:item.color||'var(--gr-acc)'}}/>
              <span>{item.title}</span>
              {item.time&&<span className="gr-thr-sch-time">{item.time}</span>}
            </div>
            {item.memo&&<div className="gr-thr-post-text">{item.memo}</div>}
            {item.location&&<div className="gr-thr-sch-loc"><I n="mapPin" size={13} color="var(--gr-t3)"/> {item.location}</div>}
            {item.budget&&<div className="gr-thr-sch-budget" style={{color:item.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}>{item.budget.type==='income'?'+':'-'}{item.budget.amount?.toLocaleString()}원</div>}
          </>}
          {isDiary && <>
            {(item.mood||item.weather)&&<div className="gr-thr-diary-mood">{item.mood||''}{item.weather||''}</div>}
            {item.title&&<div className="gr-thr-post-title">{item.title}</div>}
            {item.content&&<div className="gr-thr-post-text">{item.content}</div>}
          </>}
        </div>

        {/* Images slider */}
        {imgs.length>0&&<DiarySlider images={imgs} onImgClick={(i)=>{setViewerImgs(imgs);setViewerIdx(i);}}/>}

        {/* Actions: like, comment, share, (schedule: detail link) */}
        <div className="gr-thr-post-actions">
          {isDiary&&<button className="gr-thr-act-btn" onClick={e=>toggleLike(item.id,e)}>
            {(item.likes||[]).includes(userId)
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--gr-exp)" stroke="var(--gr-exp)" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gr-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>}
            <span>{(item.likes||[]).length||''}</span>
          </button>}
          {isDiary&&<button className="gr-thr-act-btn" onClick={e=>{e.stopPropagation();setReplyTo(replyTo===item.id?null:item.id);}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gr-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span>{(item.comments||[]).length||''}</span>
          </button>}
          <button className="gr-thr-act-btn" onClick={e=>share(item,e)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gr-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
          {isSch&&<button className="gr-thr-act-btn" style={{marginLeft:'auto'}} onClick={()=>onSchClick&&onSchClick(item)}>
            <span style={{fontSize:12,color:'var(--gr-acc)'}}>상세보기</span> <I n="right" size={14} color="var(--gr-acc)"/>
          </button>}
        </div>

        {/* Comments (diary only) */}
        {isDiary && (replyTo===item.id || (item.comments||[]).length>0) && <div className="gr-thr-comments">
          {(item.comments||[]).map(c=> <div key={c.id} className="gr-thr-comment">
            <Avatar name={getName(c.by)} size={28}/>
            <div style={{flex:1,minWidth:0}}>
              <div className="gr-thr-comment-header">
                <span className="gr-thr-comment-name">{getName(c.by)}</span>
                <span className="gr-thr-comment-time">{fmtTime(c.at)}</span>
              </div>
              <div className="gr-thr-comment-text">{c.text}</div>
            </div>
          </div>)}
          {replyTo===item.id&&<div className="gr-thr-comment-input">
            <Avatar name="나" size={28}/>
            <input className="gr-thr-comment-field" value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="댓글 달기..." onKeyDown={e=>{if(e.key==='Enter') addComment(item.id);}}/>
            <button className="gr-thr-comment-send" onClick={()=>addComment(item.id)} disabled={!commentText.trim()}>게시</button>
          </div>}
        </div>}
      </div>;
    })}
  </div>;
}
