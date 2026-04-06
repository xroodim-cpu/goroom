import { useRef, useState } from 'react';
import { isVideo } from '../../lib/helpers';
import I from './Icon';

export default function DiarySlider({images,onImgClick,square,full}){
  const ref=useRef(null);
  const drag=useRef({down:false,startX:0,scrollLeft:0,moved:false});

  const onDown=(e)=>{
    drag.current={down:true,startX:e.pageX||e.touches?.[0]?.pageX||0,scrollLeft:ref.current.scrollLeft,moved:false};
    ref.current.style.cursor='grabbing';
  };
  const onMove=(e)=>{
    if(!drag.current.down) return;
    const x=(e.pageX||e.touches?.[0]?.pageX||0)-drag.current.startX;
    if(Math.abs(x)>5) drag.current.moved=true;
    ref.current.scrollLeft=drag.current.scrollLeft-x;
  };
  const onUp=()=>{
    drag.current.down=false;
    if(ref.current) ref.current.style.cursor='grab';
  };

  const cls=`gr-thr-slider${square?' gr-thr-slider-sq':''}${full?' gr-thr-slider-full':''}`;

  return <div className={cls} ref={ref}
    onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
    onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
    {images.map((img,i)=> <div key={i} className={`gr-thr-slide${square?' gr-thr-slide-sq':''}`} style={{position:'relative'}} onClick={e=>{e.stopPropagation();if(!drag.current.moved) onImgClick(i);}}>
      {isVideo(img)?<video src={img} className="gr-thr-slide-img" muted playsInline draggable={false}/>:<img src={img} className="gr-thr-slide-img" alt="" draggable={false}/>}
      {isVideo(img)&&<div className="gr-video-badge"><I n="play" size={16} color="#fff"/></div>}
    </div>)}
    {images.length>1&&<div className="gr-thr-slide-count">{images.length} 장</div>}
  </div>;
}
