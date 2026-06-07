import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAppDispatch } from '../app/hooks'
import { addMessage, updateMessage } from '../features/chat/chatSlice'
import type { Message } from '../features/chat/chatSlice'
import { updateRoomLastMessage } from '../features/rooms/roomsSlice'

export function useRealtime(roomId: string | null) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const msg = payload.new as Message
          // fetch with attachments and profile
          const { data } = await supabase
            .from('messages')
            .select('*, attachments(*), profiles(username, avatar_url)')
            .eq('id', msg.id)
            .single()
          if (data) {
            dispatch(addMessage(data as Message))
            if (!(data as any).is_spam) {
              dispatch(updateRoomLastMessage({
                roomId: msg.room_id,
                message: (data as any).message_type === 'image' ? '📷 Photo' : ((data as any).content || '📷 Photo'),
                at: (data as any).created_at,
              }))
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          dispatch(updateMessage(payload.new as Message))
          if (payload.new.is_spam === true) {
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('content, created_at, message_type')
              .eq('room_id', payload.new.room_id)
              .eq('is_spam', false)
              .eq('is_deleted', false)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            dispatch(updateRoomLastMessage({
              roomId: payload.new.room_id as string,
              message: lastMsg
                ? (lastMsg as any).message_type === 'image' ? '📷 Photo' : ((lastMsg as any).content || '📷 Photo')
                : '',
              at: (lastMsg as any)?.created_at ?? '',
            }))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, dispatch])
}
