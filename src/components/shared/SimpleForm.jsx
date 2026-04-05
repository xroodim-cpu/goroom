import { useState } from 'react';
import I from './Icon';

export default function SimpleForm({title:pt,fields,goBack,onSave,sb}){
  const [vals,setVals]=useState(()=>{const o={};fields.forEach(f=>o[f.k]='');return o;});
  return <div style={{display:'flex',flexDirection:'column',height:'100%'}}><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">{pt}</div><div style={{width:28}}/></div><div className="gr-pg-body">{fields.map((f,i)=> <div key={f.k} style={{marginBottom:12}}><div className="gr-pg-label">{f.l}</div>{f.type==='textarea'?<textarea className="gr-input" value={vals[f.k]} onChange={e=>setVals(p=>({...p,[f.k]:e.target.value}))} placeholder={f.l} rows={4} style={{resize:'none'}}/>:<input className="gr-input" value={vals[f.k]} onChange={e=>setVals(p=>({...p,[f.k]:e.target.value}))} placeholder={f.l} autoFocus={i===0}/>}</div>)}</div><div className="gr-save-bar"><button className="gr-save-btn" disabled={!vals[fields[0].k]?.trim()} onClick={()=>onSave(vals)}>저장하기</button></div></div>;
}
