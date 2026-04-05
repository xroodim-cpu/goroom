export default function Avatar({name, size=44, color, src}) {
  if (src) return <div style={{width:size,height:size,borderRadius:size*.32,overflow:'hidden',flexShrink:0}}><img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>;
  const cs = ['#4A90D9','#F09819','#27AE60','#8E44AD','#E74C3C','#00B4D8','#E91E63','#009688'];
  const bg = color || cs[Math.abs(name?.charCodeAt(0)||0) % cs.length];
  return <div style={{width:size,height:size,borderRadius:size*.32,background:bg,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:size*.4,fontWeight:700,flexShrink:0}}>{name?.charAt(0)||'?'}</div>;
}
