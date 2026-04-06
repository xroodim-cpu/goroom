import { useState } from 'react';
import DiarySlider from './DiarySlider';
import ImageViewer from './ImageViewer';

export default function SchCard({sc,onClick}){
  const imgs=sc.images||[];
  const [viewerImgs,setViewerImgs]=useState(null);
  const [viewerIdx,setViewerIdx]=useState(0);

  return <div className="gr-sch-card" style={{cursor:'pointer'}}>
    {viewerImgs&&<ImageViewer images={viewerImgs} startIdx={viewerIdx} onClose={()=>setViewerImgs(null)}/>}
    {imgs.length>0&&<DiarySlider images={imgs} square schId={sc.id} onImgClick={(i)=>{setViewerImgs(imgs);setViewerIdx(i);}}/>}
    <div className="gr-sch-card-body" onClick={onClick}>
      <div className="gr-sch-bar" style={{background:sc.color||'var(--gr-acc)'}}/>
      <div className="gr-sch-body"><div className="gr-sch-title">{sc.mood&&<span>{sc.mood} </span>}{sc.title}</div><div className="gr-sch-meta">{sc.time&&<span>{sc.time}</span>}{sc.date&&<span>{sc.date}</span>}{sc.memo&&<span>{sc.memo}</span>}</div>{sc.budget&&<div className="gr-sch-budget" style={{color:sc.budget.type==='income'?'var(--gr-inc)':'var(--gr-exp)'}}>{sc.budget.type==='income'?'+':'-'}{sc.budget.amount?.toLocaleString()}원</div>}</div>
    </div>
  </div>;
}
