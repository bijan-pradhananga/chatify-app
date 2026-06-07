import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '../../app/hooks'
import { setActiveRoom } from './roomsSlice'
import { setActiveRoom as setChatRoom } from '../chat/chatSlice'
import type { Room } from './roomsSlice'
import NewRoomModal from './NewRoomModal'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

function RoomAvatar({ room }: { room: Room }) {
  const url = room.other_user?.avatar_url
  const name = room.type === 'dm' ? room.other_user?.username : room.name
  const initials = (name || '?').slice(0, 2).toUpperCase()
  return (
    <Avatar className="w-12 h-12 flex-shrink-0">
      <AvatarImage src={url ?? undefined} alt={name ?? ''} />
      <AvatarFallback className="bg-surface-container-highest text-primary font-bold text-sm">{initials}</AvatarFallback>
    </Avatar>
  )
}

function formatRoomTime(ts?: string | null) {
  if (!ts) return ''
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long' })
}

export default function RoomList() {
  const dispatch = useAppDispatch()
  const rooms = useAppSelector(s => s.rooms.rooms)
  const activeRoom = useAppSelector(s => s.rooms.activeRoom)
  const [filter, setFilter] = useState<'all' | 'dms' | 'groups'>('all')
  const [showModal, setShowModal] = useState(false)

  const filtered = rooms.filter(r => {
    if (filter === 'groups') return r.type === 'group'
    if (filter === 'dms') return r.type === 'dm'
    // if (filter === 'unread') return (r.unread_count || 0) > 0
    return true
  })

  function selectRoom(room: Room) {
    dispatch(setActiveRoom(room))
    dispatch(setChatRoom(room.id))
  }
  // console.log('Rendering RoomList with rooms:', rooms, 'activeRoom:', activeRoom)

  return (
    <>
      <section className="w-full md:w-96 flex flex-col border-r border-slate-100 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
        <div className="p-4 flex items-center justify-between">
          <div className="flex space-x-2">
            {(['all', 'dms','groups'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1 rounded-full text-label-md capitalize transition-colors',
                  filter === f ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800')}>
                {f}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowModal(true)} size="icon"
            className="w-10 h-10 bg-primary text-white rounded-full shadow-md hover:bg-blue-700">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {filtered.length === 0 && (
              <div className="text-center text-slate-400 text-body-md py-12">
                <span className="material-symbols-outlined text-4xl block mb-2 text-slate-200">chat_bubble</span>
                No conversations yet
              </div>
            )}
            {filtered.map(room => {
              const name = room.type === 'dm' ? room.other_user?.username : room.name
              const isActive = activeRoom?.id === room.id
              return (
                <div key={room.id} onClick={() => selectRoom(room)}
                  className={cn('flex items-center p-3 rounded-xl cursor-pointer transition-colors',
                    isActive ? 'bg-blue-50 dark:bg-blue-950' : 'hover:bg-slate-50 dark:hover:bg-gray-800')}>
                  <div className="relative">
                    <RoomAvatar room={room} />
                    {room.type === 'dm' && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 truncate">{name || 'Unnamed'}</h3>
                      <span className={cn('text-xs', isActive ? 'text-blue-600 font-medium' : 'text-slate-400 dark:text-gray-500')}>
                        {formatRoomTime(room.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500 dark:text-gray-400 truncate text-body-md">{room.last_message || 'No messages yet'}</p>
                      {(room.unread_count || 0) > 0 && (
                        <Badge className="min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex-shrink-0">
                          {room.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </section>

      {showModal && <NewRoomModal onClose={() => setShowModal(false)} />}
    </>
  )
}
