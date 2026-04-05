import I from '../../../components/shared/Icon';
import { fmtTime } from '../../../lib/helpers';

export default function RoomTodo({todos,room,updateRoom,isMulti,getName,deleteTodoDb,updateTodoDoneDb,userId}){
  const toggle=async (id)=>{
    const t = todos.find(x=>x.id===id);
    if(!t) return;
    const newDone = !t.done;
    updateRoom(room.id,r=>({...r,todos:r.todos.map(t=>t.id===id?{...t,done:newDone,doneAt:newDone?Date.now():null,doneBy:newDone?userId:null}:t)}));
    await updateTodoDoneDb(id, newDone);
  };
  const del=async (id)=>{
    updateRoom(room.id,r=>({...r,todos:r.todos.filter(t=>t.id!==id)}));
    await deleteTodoDb(id);
  };
  if(!todos.length) return <div className="gr-empty"><div style={{fontSize:32,marginBottom:8}}>✅</div>할 일을 추가해보세요</div>;
  return <div style={{padding:12}}>{todos.map(t=> <div key={t.id} className="gr-todo-row">
    <button className={`gr-todo-cb ${t.done?'done':''}`} onClick={()=>toggle(t.id)}>{t.done&&<I n="check" size={14} color="#fff"/>}</button>
    <div style={{flex:1,minWidth:0}}>
      <span className={`gr-todo-text ${t.done?'done':''}`}>{t.text}</span>
      <div className="gr-todo-meta">
        {isMulti && t.createdBy && <span>{getName(t.createdBy)}</span>}
        {t.createdAt && <span>{fmtTime(t.createdAt)} 작성</span>}
        {t.done && t.doneAt && <span style={{color:'var(--gr-inc)'}}>
          {isMulti && t.doneBy && <span>{getName(t.doneBy)} · </span>}{fmtTime(t.doneAt)} 완료
        </span>}
      </div>
    </div>
    <button className="gr-todo-del" onClick={()=>del(t.id)}><I n="x" size={14}/></button>
  </div>)}</div>;
}
