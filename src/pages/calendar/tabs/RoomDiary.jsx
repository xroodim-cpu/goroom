import { useState } from 'react';
import I from '../../../components/shared/Icon';
import Avatar from '../../../components/shared/Avatar';
import ImageViewer from '../../../components/shared/ImageViewer';
import DiarySlider from '../../../components/shared/DiarySlider';
import { fmtTime, shortId } from '../../../lib/helpers';

export default function RoomDiary({diaries,schedules,isMulti,getName,room,updateRoom,onSchClick,updateDiaryLikes,updateDiaryComments,userId}){
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
  const share=(d,e)=>{
    e.stopPropagation();
    const text=`${d.mood||''}${d.weather||''} ${d.title||''}\n${d.content?.slice(0,100)||''}`;
    if(navigator.share) navigator.share({title:d.title||'',text}).catch(()=>{});
    else {navigator.clipboard?.writeText(text);alert('복사됨!');}
  };

  if(!diaries.length) return <div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>📖</div>일기를 작성해보세요</div>;

  return <div className="gr-thr-feed">
    {viewerImgs&&<ImageViewer images={viewerImgs} startIdx={viewerIdx} onClose={()=>setViewerImgs(null)}/>}

    {diaries.sort((a,b)=>b.createdAt-a.createdAt).map(d=> <div key={d.id} className="gr-thr-post">
      <div className="gr-thr-post-header">
        <Avatar name={getName(d.createdBy||userId)} size={36}/>
        <div style={{flex:1}}>
          <div className="gr-thr-post-name">{getName(d.createdBy||userId)} <span className="gr-thr-post-time">{d.createdAt?fmtTime(d.createdAt):d.date}</span></div>
          <div className="gr-thr-post-text">{d.mood||''}{d.weather||''} {d.title||''}</div>
        </div>
        <button className="gr-icon-btn"><I n="more" size={18}/></button>
      </div>

      {d.content&&<div className="gr-thr-post-body">{d.content}</div>}

      {d.images&&d.images.length>0&&<DiarySlider images={d.images} onImgClick={(i)=>{setViewerImgs(d.images);setViewerIdx(i);}}/>}

      <div className="gr-thr-post-actions">
        <button className="gr-thr-act-btn" onClick={e=>toggleLike(d.id,e)}>
          {(d.likes||[]).includes(userId) ? <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--gr-exp)" stroke="var(--gr-exp)" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gr-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>}
          <span>{(d.likes||[]).length||''}</span>
        </button>
        <button className="gr-thr-act-btn" onClick={e=>{e.stopPropagation();setReplyTo(replyTo===d.id?null:d.id);}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gr-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>{(d.comments||[]).length||''}</span>
        </button>
        <button className="gr-thr-act-btn" onClick={e=>share(d,e)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gr-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>

      {(replyTo===d.id || (d.comments||[]).length>0) && <div className="gr-thr-comments">
        {(d.comments||[]).map(c=> <div key={c.id} className="gr-thr-comment">
          <Avatar name={getName(c.by)} size={28}/>
          <div style={{flex:1,minWidth:0}}>
            <div className="gr-thr-comment-header">
              <span className="gr-thr-comment-name">{getName(c.by)}</span>
              <span className="gr-thr-comment-time">{fmtTime(c.at)}</span>
            </div>
            <div className="gr-thr-comment-text">{c.text}</div>
          </div>
        </div>)}
        {replyTo===d.id&&<div className="gr-thr-comment-input">
          <Avatar name="나" size={28}/>
          <input className="gr-thr-comment-field" value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="댓글 달기..." onKeyDown={e=>{if(e.key==='Enter') addComment(d.id);}}/>
          <button className="gr-thr-comment-send" onClick={()=>addComment(d.id)} disabled={!commentText.trim()}>게시</button>
        </div>}
      </div>}
    </div>)}
  </div>;
}
