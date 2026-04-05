export default function DiarySlider({images,onImgClick}){
  return <div className="gr-thr-slider">
    {images.map((img,i)=> <div key={i} className="gr-thr-slide" onClick={e=>{e.stopPropagation();onImgClick(i);}}>
      <img src={img} className="gr-thr-slide-img" alt=""/>
    </div>)}
    {images.length>1&&<div className="gr-thr-slide-count">{images.length} 장</div>}
  </div>;
}
