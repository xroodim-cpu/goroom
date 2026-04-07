import { useState, useRef, useCallback } from 'react';
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
  const dlFrameRef=useRef(null);

  const showToast=function(msg){
    if(toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current=setTimeout(function(){setToast('');},2500);
  };

  const toggleMute=function(e){
    e.stopPropagation();
    var vid=vidRef.current;
    if(!vid) return;
    vid.muted=!vid.muted;
    setMuted(vid.muted);
  };

  const changeIdx=useCallback(function(newIdx){
    setIdx(newIdx);
    setMuted(true);
    setShowDlMenu(false);
  },[]);

  const goPrev=useCallback(function(){if(images.length>1) changeIdx((idx-1+images.length)%images.length);},[idx,images.length,changeIdx]);
  const goNext=useCallback(function(){if(images.length>1) changeIdx((idx+1)%images.length);},[idx,images.length,changeIdx]);

  const onTouchStart=useCallback(function(e){
    var t=e.touches[0];
    touchRef.current={startX:t.clientX,startY:t.clientY,moved:false};
  },[]);

  const onTouchEnd=useCallback(function(e){
    var t=e.changedTouches[0];
    var dx=t.clientX-touchRef.current.startX;
    var dy=t.clientY-touchRef.current.startY;
    if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)){
      if(dx<0) goNext();
      else goPrev();
      touchRef.current.moved=true;
    }
  },[goNext,goPrev]);

  const handleBgClick=function(e){
    if(showDlMenu){setShowDlMenu(false);return;}
    if(!touchRef.current.moved) onClose();
    touchRef.current.moved=false;
  };

  // 파일 확장자 추출
  const getExt=function(url){
    var m=url.match(/\.(\w+)(\?|$)/);
    return m?m[1]:(isVideo(url)?'mp4':'jpg');
  };

  // Presigned URL로 직접 다운로드 (Content-Disposition: attachment 포함)
  const downloadOne=async function(url,fileIdx){
    var filename='goroom_'+(fileIdx+1)+'.'+getExt(url);
    try {
      // Wasabi presigned URL 생성 (attachment 헤더 포함)
      var dlUrl = await getDownloadUrl(url, filename);
      // 숨겨진 iframe으로 다운로드 (페이지 이동 없이)
      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = dlUrl;
      document.body.appendChild(iframe);
      setTimeout(function(){ document.body.removeChild(iframe); }, 10000);
      return true;
    } catch(err) {
      console.error('download error:', err);
      // fallback: 새 창으로 열기
      window.open(url, '_blank');
      return false;
    }
  };

  // 이 파일만 받기
  const downloadCurrent=async function(e){
    e.stopPropagation();
    setShowDlMenu(false);
    if(downloading) return;
    setDownloading(true);
    showToast('다운로드 중...');
    var ok = await downloadOne(images[idx],idx);
    setDownloading(false);
    showToast(ok?'저장 완료!':'다운로드에 실패했습니다');
  };

  // 모두 받기
  const downloadAll=async function(e){
    e.stopPropagation();
    setShowDlMenu(false);
    if(downloading) return;
    setDownloading(true);
    showToast(images.length+'개 파일 다운로드 중...');
    var ok=0;
    for(var i=0;i<images.length;i++){
      if(await downloadOne(images[i],i)) ok++;
      if(i<images.length-1) await new Promise(function(r){setTimeout(r,800);});
    }
    setDownloading(false);
    showToast(ok>0?ok+'개 파일 저장 완료!':'다운로드에 실패했습니다');
  };

  return <div className="gr-img-viewer" onClick={handleBgClick}
    onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <button className="gr-img-viewer-close" onClick={function(e){e.stopPropagation();onClose();}}><I n="x" size={24} color="#fff"/></button>
    <button className="gr-img-viewer-download" onClick={function(e){e.stopPropagation();setShowDlMenu(!showDlMenu);}} disabled={downloading}>
      <I n="download" size={22} color="#fff"/>
    </button>
    {showDlMenu&&<div className="gr-dl-menu" onClick={function(e){e.stopPropagation();}}>
      <div onClick={downloadCurrent}>이 파일만 받기</div>
      {images.length>1&&<div onClick={downloadAll}>모두 받기 ({images.length})</div>}
    </div>}
    <div className="gr-img-viewer-body" onClick={function(e){e.stopPropagation();}}>
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
        <button className="gr-img-viewer-btn" onClick={function(){goPrev();}}><I n="left" size={24} color="#fff"/></button>
        <span style={{color:'#fff',fontSize:14}}>{idx+1} / {images.length}</span>
        <button className="gr-img-viewer-btn" onClick={function(){goNext();}}><I n="right" size={24} color="#fff"/></button>
      </div>}
    </div>
    {toast&&<div className="gr-toast">{toast}</div>}
  </div>;
}
