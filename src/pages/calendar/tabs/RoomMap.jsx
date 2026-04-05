import { useEffect, useRef, useMemo } from 'react';
import { fmt } from '../../../lib/helpers';

export default function RoomMap({schedules,sel}){
  const mapRef=useRef(null);
  const mapInstance=useRef(null);
  const ss=useMemo(()=>{
    const d=sel instanceof Date?sel.toISOString().slice(0,10):sel;
    return schedules.filter(s=>s.date===d&&s.location).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  },[schedules,sel]);

  useEffect(()=>{
    if(!mapRef.current||typeof window.kakao==='undefined') return;
    const kakao=window.kakao;
    if(!kakao.maps){return;}
    const init=()=>{
      const container=mapRef.current;
      if(!container) return;
      const map=new kakao.maps.Map(container,{center:new kakao.maps.LatLng(37.5665,126.978),level:5});
      mapInstance.current=map;
      if(ss.length===0) return;
      const geocoder=new kakao.maps.services.Geocoder();
      const places=new kakao.maps.services.Places();
      const bounds=new kakao.maps.LatLngBounds();
      const coords=[];
      let resolved=0;
      const MARKER_COLORS=['#4A90D9','#F09819','#27AE60','#8E44AD','#00B4D8','#E74C3C','#F5A928','#95A5A6'];
      ss.forEach((sc,idx)=>{
        const query=sc.locationDetail||sc.location;
        places.keywordSearch(query,(result,status)=>{
          resolved++;
          if(status===kakao.maps.services.Status.OK&&result.length>0){
            const pos=new kakao.maps.LatLng(result[0].y,result[0].x);
            coords[idx]=pos;
            bounds.extend(pos);
            const mColor=sc.color||MARKER_COLORS[idx%MARKER_COLORS.length];
            const markerContent=`<div style="display:flex;flex-direction:column;align-items:center;">
              <div style="background:${mColor};color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.2);border:2px solid #fff;">
                ${sc.time?'<span style="margin-right:4px;opacity:.85;">'+sc.time+'</span>':''}${sc.title}
              </div>
              <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${mColor};margin-top:-1px;"></div>
            </div>`;
            const overlay=new kakao.maps.CustomOverlay({position:pos,content:markerContent,yAnchor:1.3});
            overlay.setMap(map);
          }
          if(resolved===ss.length){
            // 연결선 그리기
            const validCoords=ss.map((_,i)=>coords[i]).filter(Boolean);
            if(validCoords.length>=2){
              const polyline=new kakao.maps.Polyline({path:validCoords,strokeWeight:3,strokeColor:'#F5A928',strokeOpacity:0.8,strokeStyle:'shortdash'});
              polyline.setMap(map);
              // 순서 표시 화살표 마커
              for(let i=0;i<validCoords.length-1;i++){
                const mid=new kakao.maps.LatLng(
                  (validCoords[i].getLat()+validCoords[i+1].getLat())/2,
                  (validCoords[i].getLng()+validCoords[i+1].getLng())/2
                );
                const arrow=new kakao.maps.CustomOverlay({position:mid,content:`<div style="background:#F5A928;color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.3);border:2px solid #fff;">${i+1}</div>`,yAnchor:0.5});
                arrow.setMap(map);
              }
            }
            if(validCoords.length>0){map.setBounds(bounds,80,80,80,80);}
          }
        },{size:1});
      });
    };
    if(kakao.maps.load) kakao.maps.load(init);
    else init();
  },[ss]);

  const dateStr=sel instanceof Date?sel.toISOString().slice(0,10):sel;
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
    <div ref={mapRef} style={{flex:1,minHeight:300,borderRadius:12,overflow:'hidden',border:'1px solid var(--gr-border)'}}/>
    {ss.length===0&&<div style={{padding:16,textAlign:'center',color:'var(--gr-t3)',fontSize:13}}>
      {dateStr} 에 장소가 등록된 스케줄이 없습니다
    </div>}
    {ss.length>0&&<div style={{padding:'12px 0',overflowY:'auto',maxHeight:200}}>
      <div style={{fontSize:12,color:'var(--gr-t3)',marginBottom:8,fontWeight:600}}>📍 {dateStr} 동선 ({ss.length}곳)</div>
      {ss.map((sc,i)=><div key={sc.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',fontSize:13}}>
        <div style={{width:22,height:22,borderRadius:'50%',background:sc.color||'#4A90D9',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:600}}>{sc.time&&<span style={{color:'var(--gr-t3)',marginRight:4}}>{sc.time}</span>}{sc.title}</div>
          <div style={{fontSize:12,color:'var(--gr-t3)'}}>{sc.location}</div>
        </div>
      </div>)}
    </div>}
  </div>;
}
