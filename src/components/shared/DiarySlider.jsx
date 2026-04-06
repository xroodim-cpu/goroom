import { useRef, useState, useEffect } from 'react';
import { isVideo } from '../../lib/helpers';
import I from './Icon';
import { getUploadState, onUploadStateChange } from '../../lib/uploadManager';

/** 원형 업로드 프로그레스 */
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

function VideoSlide({ src, className }) {
  const vidRef = useRef(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const vid = vidRef.current;
    if (!vid) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { vid.play().catch(() => {}); }
      else { vid.pause(); setMuted(true); vid.muted = true; }
    }, { threshold: 0.5 });
    obs.observe(vid);
    return () => obs.disconnect();
  }, []);

  const toggleMute = (e) => {
    e.stopPropagation();
    const vid = vidRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  };

  return <>
    <video ref={vidRef} src={src} className={className} muted playsInline loop draggable={false} />
    <button className="gr-video-sound-btn" onClick={toggleMute}>
      <I n={muted ? 'volumeOff' : 'volumeOn'} size={16} color="#fff" />
    </button>
  </>;
}

export default function DiarySlider({images, onImgClick, square, full, schId}){
  const ref = useRef(null);
  const drag = useRef({down:false, startX:0, scrollLeft:0, moved:false});
  const [uploadState, setUploadState] = useState(() => schId ? getUploadState(schId) : null);

  useEffect(() => {
    if (!schId) return;
    const unsub = onUploadStateChange((allState) => {
      setUploadState(allState[schId] || null);
    });
    return unsub;
  }, [schId]);

  const onDown = (e) => {
    drag.current = {down:true, startX:e.pageX||e.touches?.[0]?.pageX||0, scrollLeft:ref.current.scrollLeft, moved:false};
    ref.current.style.cursor = 'grabbing';
  };
  const onMove = (e) => {
    if (!drag.current.down) return;
    const x = (e.pageX||e.touches?.[0]?.pageX||0) - drag.current.startX;
    if (Math.abs(x) > 5) drag.current.moved = true;
    ref.current.scrollLeft = drag.current.scrollLeft - x;
  };
  const onUp = () => {
    drag.current.down = false;
    if (ref.current) ref.current.style.cursor = 'grab';
  };

  const cls = `gr-thr-slider${square?' gr-thr-slider-sq':''}${full?' gr-thr-slider-full':''}`;

  // 각 이미지의 업로드 진행률 가져오기
  const getProgress = (idx) => {
    if (!uploadState || uploadState.done) return null;
    const item = uploadState.images.find(im => im.index === idx);
    if (!item || item.status === 'done') return null;
    return item.progress;
  };

  return <div className={cls} ref={ref}
    onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
    onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
    {images.map((img, i) => {
      const progress = getProgress(i);
      return <div key={i} className={`gr-thr-slide${square?' gr-thr-slide-sq':''}`} style={{position:'relative'}} onClick={e => {e.stopPropagation(); if (!drag.current.moved) onImgClick(i);}}>
        {isVideo(img)
          ? <VideoSlide src={img} className="gr-thr-slide-img" />
          : <img src={img} className="gr-thr-slide-img" alt="" draggable={false} />}
        {progress !== null && <UploadProgress progress={progress} />}
      </div>;
    })}
    {images.length > 1 && <div className="gr-thr-slide-count">{images.length} 장</div>}
  </div>;
}
