import { useEffect, useRef } from 'react';
import { supabase } from '../supabase';

function mapRow(s) {
  return {
    id: s.id, title: s.title, date: s.date, time: s.time || '',
    memo: s.memo || '', color: s.color || '#4A90D9', catId: s.cat_id || '',
    images: s.images || [], location: s.location || '',
    locationDetail: s.location_detail || '',
    createdAt: new Date(s.created_at || Date.now()).getTime(),
    createdBy: s.created_by, todos: s.todos || [],
    dday: s.dday || false, repeat: s.repeat || null,
    alarm: s.alarm || null, budget: s.budget || null,
  };
}

function showNotification(title, body) {
  const opts = { body, icon: '/icon-192.png' };
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then(reg => reg.showNotification(title, opts)).catch(() => {});
  } else if (Notification.permission === 'granted') {
    new Notification(title, opts);
  }
}

export default function useRealtimeSchedules(rooms, userId, updateRoom) {
  const roomIdsRef = useRef('');

  useEffect(() => {
    if (!rooms.length || !userId) return;
    const roomIds = rooms.map(r => r.id);
    const key = roomIds.sort().join(',');
    if (key === roomIdsRef.current) return;
    roomIdsRef.current = key;

    const channel = supabase
      .channel('schedule-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'goroom_schedules',
      }, (payload) => {
        const row = payload.new;
        if (row.created_by === userId) return;
        if (!roomIds.includes(row.room_id)) return;

        const sch = mapRow(row);
        updateRoom(row.room_id, r => ({
          ...r,
          schedules: [...(r.schedules || []), sch],
        }));

        const notiEnabled = localStorage.getItem('gr_noti_schedule') !== 'false';
        if (notiEnabled && Notification.permission === 'granted') {
          const room = rooms.find(r => r.id === row.room_id);
          showNotification(room?.name || '고룸', `새 스케줄: ${row.title}`);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [rooms, userId, updateRoom]);
}
