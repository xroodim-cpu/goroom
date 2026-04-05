import { sbPost } from '../../supabase';
import I from '../../components/shared/Icon';
import Avatar from '../../components/shared/Avatar';

export default function InviteMembers({room,updateRoom,friends,sb,goBack,userId}){
  const available=friends.filter(f=>!room.members.includes(f.id));
  const invite=async (fid)=>{
    updateRoom(room.id,r=>({...r,members:[...r.members,fid]}));
    try {
      await sbPost('goroom_room_members', { room_id: room.id, user_id: fid, role: 'member' });
    } catch(e) { console.error(e); }
    goBack();
  };
  return <div className="gr-panel"><div className="gr-pg-top">{sb&&<button className="gr-icon-btn" onClick={goBack}><I n="back" size={20}/></button>}<div className="gr-pg-title">멤버 초대</div><div style={{width:28}}/></div><div className="gr-pg-body">{available.length===0?<div className="gr-empty">초대 가능한 친구가 없습니다</div>:available.map(f=> <div key={f.id} className="gr-friend-row" onClick={()=>invite(f.id)}><Avatar name={f.nickname} size={40} src={f.profileImg}/><div className="gr-friend-info"><div className="gr-friend-name">{f.nickname}</div><div className="gr-friend-status">{f.statusMsg}</div></div><button className="gr-btn-invite"><I n="plus" size={14} color="#fff"/> 초대</button></div>)}</div></div>;
}
