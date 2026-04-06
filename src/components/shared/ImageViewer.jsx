import { useState, useRef, useCallback, useEffect } from 'react';
import I from './Icon';
import { isVideo } from '../../lib/helpers';
import { getDownloadUrl } from '../../wasabi';

export default function ImageViewer({images,startIdx,onClose}){
  const [idx,setIdx]=useState(startIdx||0);
  const [muted,setMuted]=useState(true);
  const [showDlMenu,setShowDlMenu]=useState(false);
  const [downloading,setDownloading]=useState(false);
  const [toast,setToast]=useState('');
  const vidRef=useRef(null);
  const touchRef=useRef({startX:0,startY:0,moved:false});
  const toastTimer=useRef(null);

  const showToast=(msg)=>{
    if(toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current=setTimeout(()=>setToast(''),2500);
  };

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
    setShowDlMenu(false);
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
    if(showDlMenu){setShowDlMenu(false);return;}
    if(!touchRef.current.moved) onClose();
    touchRef.current.moved=false;
  };

  // 파일 확장자 추출
  const getExt=(url)=>{
    const m=url.match(/\.(\w+)(\?|$)/);
    return m?m[1]:(isVideo(url)?'mp4':'jpg');
  };

  // Presigned URL로 다운로드 (CORS 불필요, 브라우저가 직접 다운로드)
  const downloadOne=async(url,fileIdx)=>{
    const filename=`goroom_${fileIdx+1}.${getExt(url)}`;
    try {
      const dlUrl=await getDownloadUrl(url,filename);
      const a=document.createElement('a');
      a.href=dlUrl;
      a.download=filename;
      a.style.display='none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch(err){
      console.error('download error:',err);
      return false;
    }
  };

  // 이 파일만 받기
  const downloadCurrent=async(e)=>{
    e.stopPropagation();
    setShowDlMenu(false);
    if(downloading) return;
    setDownloading(true);
    showToast('파일을 다운로드합니다...');
    const ok=await downloadOne(images[idx],idx);
    setDownloading(false);
    showToast(ok?'저장 완료!':'다운로드에 실패했습니다');
  };

  // 모두 받기
  const downloadAll=async(e)=>{
    e.stopPropagation();
    setShowDlMenu(false);
    if(downloading) return;
    setDownloading(true);
    showToast(`${images.length}개 파일을 다운로드합니다...`);
    let ok=0;
    for(let i=0;i<images.length;i++){
      if(await downloadOne(images[i],i)) ok++;
      if(i<images.length-1) await new Promise(r=>setTimeout(r,500));
    }
    setDownloading(false);
    showToast(ok>0?`${ok}개 파일 저장 완료!`:'다운로드에 실패했습니다');
  };

  return <div className="gr-img-viewer" onClick={handleBgClick}
    onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <button className="gr-img-viewer-close" onClick={(e)=>{e.stopPropagation();onClose();}}><I n="x" size={24} color="#fff"/></button>
    <button className="gr-img-viewer-download" onClick={(e)=>{e.stopPropagation();setShowDlMenu(!showDlMenu);}} disabled={downloading}>
      <I n="download" size={22} color="#fff"/>
    </button>
    {showDlMenu&&<div className="gr-dl-menu" onClick={e=>e.stopPropagation()}>
      <div onClick={downloadCurrent}>이 파일만 받기</div>
      {images.length>1&&<div onClick={downloadAll}>모두 받기 ({images.length})</div>}
    </div>}
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
    {toast&&<div className="gr-toast">{toast}</div>}
  </div>;
}
