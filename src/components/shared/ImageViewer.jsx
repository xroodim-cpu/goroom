import { useState, useRef, useCallback } from 'react';
import I from './Icon';
import { isVideo } from '../../lib/helpers';

export default function ImageViewer({images,startIdx,onClose}){
  const [idx,setIdx]=useState(startIdx||0);
  const [muted,setMuted]=useState(true);
  const vidRef=useRef(null);
  const touchRef=useRef({startX:0,startY:0,moved:false});

  const toggleMute=(e)=>{
    e.stopPropagation();
    const vid=vidRef.current;
    if(!vid) return;
    vid.muted=!vid.muted;
    setMuted(vid.muted);
  };

  const changeIdx=useCallback((newIdx)=>{
    setIdx(newIdx);
    setMuted(true);
  },[]);

  const goPrev=useCallback(()=>{if(images.length>1) changeIdx((idx-1+images.length)%images.length);},[idx,images.length,changeIdx]);
  const goNext=useCallback(()=>{if(images.length>1) changeIdx((idx+1)%images.length);},[idx,images.length,changeIdx]);

  const onTouchStart=useCallback((e)=>{
    const t=e.touches[0];
    touchRef.current={startX:t.clientX,startY:t.clientY,moved:false};
  },[]);

  const onTouchEnd=useCallback((e)=>{
    const t=e.changedTouches[0];
    const dx=t.clientX-touchRef.current.startX;
    const dy=t.clientY-touchRef.current.startY;
    if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)){
      if(dx<0) goNext();
      else goPrev();
      touchRef.current.moved=true;
    }
  },[goNext,goPrev]);

  const handleBgClick=(e)=>{
    if(!touchRef.current.moved) onClose();
    touchRef.current.moved=false;
  };

  return <div className="gr-img-viewer" onClick={handleBgClick}
    onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <button className="gr-img-viewer-close" onClick={(e)=>{e.stopPropagation();onClose();}}><I n="x" size={24} color="#fff"/></button>
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
        <button className="gr-img-viewer-btn" onClick={()=>goPrev()}><I n="left" size={24} color="#fff"/></button>
        <span style={{color:'#fff',fontSize:14}}>{idx+1} / {images.length}</span>
        <button className="gr-img-viewer-btn" onClick={()=>goNext()}><I n="right" size={24} color="#fff"/></button>
      </div>}
    </div>
  </div>;
}
