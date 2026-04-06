import { useState } from 'react';
import I from './Icon';
import { isVideo } from '../../lib/helpers';

export default function ImageViewer({images,startIdx,onClose}){
  const [idx,setIdx]=useState(startIdx||0);
  return <div className="gr-img-viewer" onClick={onClose}>
    <button className="gr-img-viewer-close" onClick={onClose}><I n="x" size={24} color="#fff"/></button>
    <div className="gr-img-viewer-body" onClick={e=>e.stopPropagation()}>
      {isVideo(images[idx])?<video src={images[idx]} className="gr-img-viewer-img" controls autoPlay playsInline/>:<img src={images[idx]} className="gr-img-viewer-img" alt=""/>}
      {images.length>1&&<div className="gr-img-viewer-nav">
        <button className="gr-img-viewer-btn" onClick={()=>setIdx(p=>(p-1+images.length)%images.length)} disabled={images.length<=1}><I n="left" size={24} color="#fff"/></button>
        <span style={{color:'#fff',fontSize:14}}>{idx+1} / {images.length}</span>
        <button className="gr-img-viewer-btn" onClick={()=>setIdx(p=>(p+1)%images.length)} disabled={images.length<=1}><I n="right" size={24} color="#fff"/></button>
      </div>}
    </div>
  </div>;
}
