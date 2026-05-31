import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function usePresence(roomId: string | null) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    if (!roomId) return

    const channel = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: roomId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const ids = Object.values(state).flat().map((p: any) => p.user_id)
        setOnlineUsers(ids)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) await channel.track({ user_id: user.id })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  return onlineUsers
}
