import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { setRooms, setActiveRoom as setRoomsActiveRoom } from '../features/rooms/roomsSlice'
import { setMessages, setActiveRoom as setChatActiveRoom } from '../features/chat/chatSlice'
import { supabase } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
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
        if (room.type === 'dm') {
          const { data: otherMember } = await supabase
            .from('room_members')
            .select('user_id, profiles(username, avatar_url)')
            .eq('room_id', room.id)
            .neq('user_id', user.id)
            .single()
          return { ...room, other_user: (otherMember as any)?.profiles || { username: 'Unknown', avatar_url: null } }
        }
        return room
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

      <main className="flex flex-col flex-1 min-w-0 bg-white">
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
