import { useState, useEffect } from 'react';
import { sbGet } from '../../supabase';
import I from '../../components/shared/Icon';
import Avatar from '../../components/shared/Avatar';

export default function JoinRoomPrompt({ roomId, userId, joinRoom, goBack, sb }) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // UUID면 id로, 아니면 slug로 조회
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
        const query = isUUID ? `id=eq.${roomId}` : `slug=eq.${encodeURIComponent(roomId)}`;
        const arr = await sbGet(`/goroom_rooms?select=id,name,description,is_public,invite_password,thumbnail_url&${query}`);
        const r = arr?.[0];
        if (r) {
          const members = await sbGet(`/goroom_room_members?select=user_id&room_id=eq.${r.id}`);
          setRoom({ ...r, memberCount: members?.length || 0 });
        }
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    })();
  }, [roomId]);

  const handleJoin = async () => {
    if (!room) return;
    if (room.invite_password) {
      if (pw.trim() !== (room.invite_password||'').trim()) { setErr('비밀번호가 틀렸습니다.'); return; }
    }
    setJoining(true);
    try {
      await joinRoom(roomId, room.name);
    } catch (e) {
      setErr('가입에 실패했습니다.');
      setJoining(false);
    }
  };

  if (loading) return <div className="gr-panel" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><div className="gr-loading-spinner"/></div>;
  if (!room) return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">캘린더</div></div>
    <div className="gr-empty"><div style={{fontSize:48,marginBottom:12}}>😢</div>존재하지 않는 캘린더입니다.</div>
  </div>;

  return <div className="gr-panel">
    <div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">캘린더 가입</div></div>
    <div style={{padding:40,textAlign:'center'}}>
      <Avatar name={room.name} size={80} src={room.thumbnail_url}/>
      <div style={{fontSize:20,fontWeight:700,marginTop:16}}>{room.name}</div>
      {room.description&&<div style={{fontSize:14,color:'var(--gr-t3)',marginTop:6}}>{room.description}</div>}
      <div style={{fontSize:13,color:'var(--gr-t3)',marginTop:8,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
        <I n="users" size={14} color="var(--gr-t3)"/> {room.memberCount}명
      </div>

      <div style={{marginTop:32,maxWidth:300,margin:'32px auto 0'}}>
        {room.invite_password ? <>
          <div style={{fontSize:14,color:'var(--gr-t2)',marginBottom:12,textAlign:'left'}}>이 캘린더는 비밀번호가 필요합니다.</div>
          <input className="gr-input" type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr('');}} placeholder="비밀번호를 입력하세요" onKeyDown={e=>e.key==='Enter'&&handleJoin()}/>
          {err&&<div style={{color:'var(--gr-exp)',fontSize:12,marginTop:6,textAlign:'left'}}>{err}</div>}
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button className="gr-btn-danger" onClick={goBack} style={{flex:1}}>취소</button>
            <button className="gr-btn-primary" onClick={handleJoin} disabled={joining} style={{flex:1}}>{joining?'가입 중...':'가입하기'}</button>
          </div>
        </> : <>
          <div style={{fontSize:14,color:'var(--gr-t2)',marginBottom:16}}>이 캘린더에 가입하시겠습니까?</div>
          {err&&<div style={{color:'var(--gr-exp)',fontSize:12,marginBottom:8}}>{err}</div>}
          <div style={{display:'flex',gap:8}}>
            <button className="gr-btn-danger" onClick={goBack} style={{flex:1}}>취소</button>
            <button className="gr-btn-primary" onClick={handleJoin} disabled={joining} style={{flex:1}}>{joining?'가입 중...':'가입하기'}</button>
          </div>
        </>}
      </div>
    </div>
  </div>;
}
