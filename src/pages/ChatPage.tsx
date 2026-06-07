import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { setRooms, setActiveRoom as setRoomsActiveRoom } from '../features/rooms/roomsSlice'
import { setMessages, setActiveRoom as setChatActiveRoom } from '../features/chat/chatSlice'
import { supabase } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
import { useGlobalPresence } from '../hooks/useGlobalPresence'
import RoomList from '../features/rooms/RoomList'
import MessageList from '../features/chat/MessageList'
import MessageInput from '../features/chat/MessageInput'
import type { Room } from '../features/rooms/roomsSlice'
import SideNavRail from '@/components/SideNavRail'
import ChatTopHeader from './chat/ChatTopHeader'
import ChatRoomHeader from './chat/ChatRoomHeader'
import ChatEmptyState from './chat/ChatEmptyState'

export default function ChatPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const activeRoom = useAppSelector(s => s.rooms.activeRoom)
  const activeRoomId = useAppSelector(s => s.chat.activeRoomId)
  const user = useAppSelector(s => s.auth.user)
  const [activePage, setActivePage] = useState<'chat' | 'contacts' | 'settings'>('chat')
  const [search, setSearch] = useState('')

  useRealtime(activeRoomId)
  useGlobalPresence()

  useEffect(() => {
    if (!user) return
    loadRooms()
  }, [user])

  useEffect(() => {
    if (!activeRoomId) return
    loadMessages(activeRoomId)
  }, [activeRoomId])

  async function loadRooms() {
    if (!user) return
    const { data } = await supabase
      .from('room_members')
      .select('room_id, rooms(id, name, type, created_by, created_at)')
      .eq('user_id', user.id)

    if (!data) return

    const rooms: Room[] = await Promise.all(
      (data as any[]).map(async (d) => {
        const room = d.rooms

        const [otherMemberResult, lastMsgResult] = await Promise.all([
          room.type === 'dm'
            ? supabase
                .from('room_members')
                .select('user_id, profiles(username, avatar_url)')
                .eq('room_id', room.id)
                .neq('user_id', user.id)
                .single()
            : Promise.resolve({ data: null }),
          supabase
            .from('messages')
            .select('content, created_at, message_type')
            .eq('room_id', room.id)
            .eq('is_deleted', false)
            .eq('is_spam', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

        const lastMsg = lastMsgResult.data as any
        const base = {
          ...room,
          last_message: lastMsg
            ? lastMsg.message_type === 'image' ? '📷 Photo' : (lastMsg.content || '📷 Photo')
            : null,
          last_message_at: lastMsg?.created_at ?? null,
        }

        if (room.type === 'dm') {
          const om = otherMemberResult.data as any
          return { ...base, other_user: { id: om?.user_id, ...(om?.profiles || { username: 'Unknown', avatar_url: null }) } }
        }
        return base
      })
    )
    dispatch(setRooms(rooms))
  }

  async function loadMessages(roomId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*, attachments(*), profiles(username, avatar_url)')
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) dispatch(setMessages(data as any))
  }

  function handleNavigate(page: 'chat' | 'contacts' | 'settings') {
    setActivePage(page)
    if (page === 'settings') navigate('/settings')
    if (page === 'contacts') navigate('/contacts')
    if (page === 'chat') navigate('/chat')
  }

  function handleBackToRooms() {
    dispatch(setRoomsActiveRoom(null))
    dispatch(setChatActiveRoom(null))
  }

  const roomName = activeRoom
    ? activeRoom.type === 'dm' ? (activeRoom.other_user?.username ?? 'Unknown') : (activeRoom.name ?? 'Group')
    : null
  const roomInitials = roomName ? roomName.slice(0, 2).toUpperCase() : '??'

  return (
    <div className="flex h-screen overflow-hidden">
      <SideNavRail activePage={activePage} onNavigate={handleNavigate} />

      <main className="flex flex-col flex-1 min-w-0 bg-white dark:bg-gray-900">
        <ChatTopHeader search={search} onSearchChange={setSearch} />

        <div className="flex flex-1 overflow-hidden">
          <div className={activeRoom ? 'hidden md:block' : 'block w-full md:w-96'}>
            <RoomList />
          </div>

          {activeRoom ? (
            <div className="flex flex-col flex-1 min-w-0">
              <ChatRoomHeader
                roomId={activeRoom.id}
                roomName={roomName ?? 'Unknown'}
                roomInitials={roomInitials}
                roomType={activeRoom.type}
                createdBy={activeRoom.created_by}
                otherUserId={activeRoom.other_user?.id}
                onBack={handleBackToRooms}
              />

              <MessageList />
              <MessageInput />
            </div>
          ) : (
            <div className="hidden md:flex flex-1 min-w-0">
              <ChatEmptyState />
            </div>
          )}
        </div>
      </main>

    </div>
  )
}
