import { useState, useRef } from 'react';
import I from './Icon';
import { isVideo } from '../../lib/helpers';

export default function ImageViewer({images,startIdx,onClose}){
  const [idx,setIdx]=useState(startIdx||0);
  const [muted,setMuted]=useState(true);
  const vidRef=useRef(null);

  const toggleMute=(e)=>{
    e.stopPropagation();
    const vid=vidRef.current;
    if(!vid) return;
    vid.muted=!vid.muted;
    setMuted(vid.muted);
  };

  const changeIdx=(newIdx)=>{
    setIdx(newIdx);
    setMuted(true);
  };

  return <div className="gr-img-viewer" onClick={onClose}>
    <button className="gr-img-viewer-close" onClick={onClose}><I n="x" size={24} color="#fff"/></button>
    <div className="gr-img-viewer-body" onClick={e=>e.stopPropagation()}>
      <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
        {isVideo(images[idx])
          ? <>
              <video ref={vidRef} src={images[idx]} className="gr-img-viewer-img" autoPlay playsInline loop muted={muted}/>
              <button className="gr-video-sound-btn gr-video-sound-btn-viewer" onClick={toggleMute}>
                <I n={muted?'volumeOff':'volumeOn'} size={20} color="#fff"/>
              </button>
            </>
          : <img src={images[idx]} className="gr-img-viewer-img" alt=""/>}
      </div>
      {images.length>1&&<div className="gr-img-viewer-nav">
        <button className="gr-img-viewer-btn" onClick={()=>changeIdx((idx-1+images.length)%images.length)} disabled={images.length<=1}><I n="left" size={24} color="#fff"/></button>
        <span style={{color:'#fff',fontSize:14}}>{idx+1} / {images.length}</span>
        <button className="gr-img-viewer-btn" onClick={()=>changeIdx((idx+1)%images.length)} disabled={images.length<=1}><I n="right" size={24} color="#fff"/></button>
      </div>}
    </div>
  </div>;
}
