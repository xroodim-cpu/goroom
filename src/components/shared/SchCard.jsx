import { useState, useEffect } from 'react';
import ImageViewer from './ImageViewer';
import { isVideo } from '../../lib/helpers';
import { getUploadState, onUploadStateChange } from '../../lib/uploadManager';
import I from './Icon';

function UploadProgress({ progress }) {
  const r = 18, c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  return <div className="gr-upload-progress">
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="3" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="#fff" strokeWidth="3"
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 24 24)" />
    </svg>
    <span className="gr-upload-progress-txt">{progress}%</span>
  </div>;
}

function VideoThumb({ src, className }) {
  return <div style={{position:'relative'}}>
    <video src={src} className={className} muted playsInline draggable={false} />
    <div className="gr-video-badge"><I n="play" size={16} color="#fff"/></div>
  </div>;
}

export default function SchCard({sc,onClick}){
  const imgs=sc.images||[];
  const [viewerImgs,setViewerImgs]=useState(null);
  const [viewerIdx,setViewerIdx]=useState(0);
  const [uploadState, setUploadState] = useState(() => getUploadState(sc.id));

  useEffect(() => {
    const unsub = onUploadStateChange((allState) => {
      setUploadState(allState[sc.id] || null);
    });
    return unsub;
  }, [sc.id]);

  const getProgress = (idx) => {
    if (!uploadState || uploadState.done) return null;
    const item = uploadState.images.find(im => im.index === idx);
    if (!item || item.status === 'done') return null;
    return item.progress;
  };

  return <div className="gr-sch-card" style={{cursor:'pointer'}}>
    {viewerImgs&&<ImageViewer images={viewerImgs} startIdx={viewerIdx} onClose={()=>setViewerImgs(null)}/>}
    {imgs.length>0&&<div className="gr-sch-grid">
      {imgs.map((img,i)=>{
        const progress = getProgress(i);
        return <div key={i} className="gr-sch-grid-item" onClick={e=>{e.stopPropagation();setViewerImgs(imgs);setViewerIdx(i);}}>
          {isVideo(img)
            ? <VideoThumb src={img} className="gr-sch-grid-img" />
            : <img src={img} className="gr-sch-grid-img" alt="" draggable={false}/>}
          {progress !== null && <UploadProgress progress={progress} />}
          {i===0 && imgs.length>1 && <div className="gr-sch-grid-count">{imgs.length} 장</div>}
        </div>;
      })}
    </div>}
    <div className="gr-sch-card-body" onClick={onClick}>
      <div className="gr-sch-bar" style={{background:sc.color||'var(--gr-acc)'}}/>
      <div className="gr-sch-body"><div className="gr-sch-title">{sc.mood&&<span>{sc.mood} </span>}{sc.title}</div><div className="gr-sch-meta">{sc.time&&<span>{sc.time}</span>}{sc.date&&<span>{sc.date}</span>}{sc.memo&&<span>{sc.memo}</span>}</div>{sc.budget&&<div className="gr-sch-budget" style={{color:sc.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}>{sc.budget.type==='income'?'+':'-'}{sc.budget.amount?.toLocaleString()}원</div>}</div>
    </div>
  </div>;
}
