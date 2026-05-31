import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAppDispatch } from '../app/hooks'
import { addMessage, updateMessage } from '../features/chat/chatSlice'
import type { Message } from '../features/chat/chatSlice'

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
          if (data) dispatch(addMessage(data as Message))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          dispatch(updateMessage(payload.new as Message))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, dispatch])
}
