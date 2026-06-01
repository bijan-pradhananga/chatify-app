import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface Room {
  id: string
  name: string | null
  type: 'dm' | 'group'
  created_by: string
  created_at: string
  last_message?: string | null
  last_message_at?: string | null
  unread_count?: number
  other_user?: { username: string; avatar_url: string | null; is_online?: boolean }
}

interface RoomsState {
  rooms: Room[]
  activeRoom: Room | null
}

const initialState: RoomsState = {
  rooms: [],
  activeRoom: null,
}

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setRooms(state, action: PayloadAction<Room[]>) {
      state.rooms = action.payload
    },
    addRoom(state, action: PayloadAction<Room>) {
      const exists = state.rooms.find(r => r.id === action.payload.id)
      if (!exists) state.rooms.unshift(action.payload)
    },
    setActiveRoom(state, action: PayloadAction<Room | null>) {
      state.activeRoom = action.payload
    },
    removeRoom(state, action: PayloadAction<string>) {
      const id = action.payload
      state.rooms = state.rooms.filter(r => r.id !== id)
      if (state.activeRoom?.id === id) state.activeRoom = null
    },
    updateRoomLastMessage(state, action: PayloadAction<{ roomId: string; message: string; at: string }>) {
      const room = state.rooms.find(r => r.id === action.payload.roomId)
      if (room) {
        room.last_message = action.payload.message
        room.last_message_at = action.payload.at
      }
    },
  },
})

export const { setRooms, addRoom, setActiveRoom, removeRoom, updateRoomLastMessage } = roomsSlice.actions
export default roomsSlice.reducer
