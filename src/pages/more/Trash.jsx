import { useState, useEffect } from 'react';
import { sbGet, sbPost, sbDelete } from '../../supabase';
import { moveInWasabi, deleteFromWasabi, getWasabiUrl } from '../../wasabi';
import I from '../../components/shared/Icon';

export default function TrashPage({goBack, sb, userId, rooms, setRooms, updateRoom}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const data = await sbGet(`/goroom_trash?select=*&user_id=eq.${userId}&order=deleted_at.desc`);
      setItems(data || []);
      setLoading(false);
    })();
  }, [userId]);

  const daysLeft = (deletedAt) => {
    const d = new Date(deletedAt);
    const expire = new Date(d.getTime() + 90 * 24 * 60 * 60 * 1000);
    const diff = Math.ceil((expire - new Date()) / (24 * 60 * 60 * 1000));
    return Math.max(0, diff);
  };

  const restoreItem = async (item) => {
    try {
      // 이미지 복원: trash/ → 원래 경로
      if (item.image_paths && item.image_paths.length > 0) {
        for (const trashPath of item.image_paths) {
          const originalPath = trashPath.replace(/^trash\//, '');
          await moveInWasabi(trashPath, originalPath);
        }
      }
      // DB 복원
      const od = item.original_data;
      if (item.type === 'schedule' && od) {
        await sbPost('goroom_schedules', {
          id: od.id, room_id: item.room_id, created_by: od.createdBy || userId,
          title: od.title, color: od.color, date: od.date, time: od.time || null,
          cat_id: od.catId || null, memo: od.memo || null,
          location: od.location || null, location_detail: od.locationDetail || null,
          dday: od.dday || false, repeat: od.repeat || null,
          alarm: od.alarm || null, budget: od.budget || null,
          todos: od.todos || [],
          images: (item.image_paths || []).map(p => getWasabiUrl(p.replace(/^trash\//, ''))),
        });
        // 로컬 상태 업데이트
        if (updateRoom && item.room_id) {
          updateRoom(item.room_id, r => ({
            ...r, schedules: [...r.schedules, { ...od, images: (item.image_paths || []).map(p => getWasabiUrl(p.replace(/^trash\//, ''))) }]
          }));
        }
      } else if (item.type === 'diary' && od) {
        await sbPost('goroom_diaries', {
          id: od.id, room_id: item.room_id, created_by: od.createdBy || userId,
          content: od.content || '', mood: od.mood || null, weather: od.weather || null,
          images: (item.image_paths || []).map(p => getWasabiUrl(p.replace(/^trash\//, ''))),
          likes: od.likes || [], comments: od.comments || [],
        });
        if (updateRoom && item.room_id) {
          updateRoom(item.room_id, r => ({
            ...r, diaries: [...r.diaries, { ...od, images: (item.image_paths || []).map(p => getWasabiUrl(p.replace(/^trash\//, ''))) }]
          }));
        }
      } else if (item.type === 'memo' && od) {
        await sbPost('goroom_memos', {
          id: od.id, room_id: item.room_id, created_by: od.createdBy || userId,
          title: od.title, content: od.content || '', pinned: od.pinned || false,
        });
      } else if (item.type === 'todo' && od) {
        await sbPost('goroom_todos', {
          id: od.id, room_id: item.room_id, created_by: od.createdBy || userId,
          text: od.text, done: od.done || false,
        });
      }
      // 휴지통에서 삭제
      await sbDelete(`/goroom_trash?id=eq.${item.id}`);
      setItems(prev => prev.filter(i => i.id !== item.id));
      alert('복구되었습니다!');
    } catch (e) { console.error('restore error:', e); alert('복구 실패'); }
  };

  const permanentDelete = async (item) => {
    if (!confirm('영구 삭제하시겠습니까? 복구할 수 없습니다.')) return;
    try {
      // trash/ 이미지 영구 삭제
      if (item.image_paths && item.image_paths.length > 0) {
        for (const p of item.image_paths) await deleteFromWasabi(p);
      }
      await sbDelete(`/goroom_trash?id=eq.${item.id}`);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (e) { console.error(e); }
  };

  const typeLabel = { schedule: '스케줄', diary: '일기', memo: '메모', todo: '할 일' };
  const getTitle = (item) => {
    const od = item.original_data;
    if (!od) return '(알 수 없음)';
    return od.title || od.text || od.content?.slice(0, 30) || '(제목 없음)';
  };
  const roomName = (roomId) => {
    const r = rooms.find(rm => rm.id === roomId);
    return r ? r.name : '';
  };

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">휴지통</div></div>
    <div className="gr-pg-body">
      <div style={{fontSize:13,color:'var(--gr-t3)',marginBottom:16}}>삭제된 항목은 90일 후 자동으로 영구 삭제됩니다.</div>
      {loading ? <div style={{textAlign:'center',padding:40}}><div className="gr-loading-spinner"/></div> :
       items.length === 0 ? <div style={{textAlign:'center',padding:60,color:'var(--gr-t3)'}}>
        <I n="trash" size={48} color="var(--gr-t3)"/><div style={{marginTop:12,fontSize:15}}>휴지통이 비어있습니다</div>
      </div> :
      items.map(item => <div key={item.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:'1px solid var(--gr-brd)'}}>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:600}}>{getTitle(item)}</div>
          <div style={{fontSize:12,color:'var(--gr-t3)',marginTop:2}}>
            {typeLabel[item.type]||item.type} · {roomName(item.room_id)} · {daysLeft(item.deleted_at)}일 남음
          </div>
        </div>
        <button onClick={()=>restoreItem(item)} style={{padding:'6px 12px',fontSize:13,background:'var(--gr-acc)',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>복구</button>
        <button onClick={()=>permanentDelete(item)} style={{padding:'6px 12px',fontSize:13,background:'none',color:'var(--gr-exp)',border:'1px solid var(--gr-exp)',borderRadius:8,cursor:'pointer'}}>삭제</button>
      </div>)}
    </div>
  </div>;
}
