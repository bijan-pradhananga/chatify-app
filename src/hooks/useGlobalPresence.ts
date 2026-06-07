import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { setOnlineUsers } from '../features/presence/presenceSlice'

export function useGlobalPresence() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(s => s.auth.user)

  useEffect(() => {
    if (!user) return

    const channel = supabase.channel('presence:global', {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const ids = Object.keys(channel.presenceState())
        dispatch(setOnlineUsers(ids))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, dispatch])
}
