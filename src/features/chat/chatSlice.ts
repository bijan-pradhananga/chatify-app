import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface Attachment {
  id: string
  message_id: string
  sender_id: string
  storage_path: string
  public_url: string
  file_name: string
  file_size: number
  mime_type: string
  width?: number
  height?: number
  created_at: string
}

export interface Message {
  id: string
  room_id: string
  sender_id: string
  content: string | null
  message_type: 'text' | 'image' | 'mixed'
  is_spam: boolean
  spam_score: number
  nb_score: number
  perspective_score: number
  spam_reason: string | null
  is_deleted: boolean
  created_at: string
  attachments?: Attachment[]
  profiles?: { username: string; avatar_url: string | null }
}

interface ChatState {
  messages: Message[]
  loading: boolean
  activeRoomId: string | null
}

type ReconcileMessagePayload = {
  optimisticId: string
  serverMessage: Message
}

const initialState: ChatState = {
  messages: [],
  loading: false,
  activeRoomId: null,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages(state, action: PayloadAction<Message[]>) {
      state.messages = action.payload
    },
    addMessage(state, action: PayloadAction<Message>) {
      const exists = state.messages.find(m => m.id === action.payload.id)
      if (!exists) state.messages.push(action.payload)
    },
    reconcileMessage(state, action: PayloadAction<ReconcileMessagePayload>) {
      const { optimisticId, serverMessage } = action.payload

      const serverIdx = state.messages.findIndex(m => m.id === serverMessage.id)
      const optimisticIdx = state.messages.findIndex(m => m.id === optimisticId)

      if (serverIdx !== -1) {
        if (optimisticIdx !== -1) state.messages.splice(optimisticIdx, 1)
        return
      }

      if (optimisticIdx !== -1) {
        const optimistic = state.messages[optimisticIdx]
        state.messages[optimisticIdx] = {
          ...optimistic,
          ...serverMessage,
          attachments: serverMessage.attachments ?? optimistic.attachments,
          profiles: serverMessage.profiles ?? optimistic.profiles,
        }
        return
      }

      state.messages.push(serverMessage)
    },
    updateMessage(state, action: PayloadAction<Partial<Message> & { id: string }>) {
      const idx = state.messages.findIndex(m => m.id === action.payload.id)
      if (idx !== -1) Object.assign(state.messages[idx], action.payload)
    },
    setActiveRoom(state, action: PayloadAction<string | null>) {
      state.activeRoomId = action.payload
      state.messages = []
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
  },
})

export const { setMessages, addMessage, reconcileMessage, updateMessage, setActiveRoom, setLoading } = chatSlice.actions
export default chatSlice.reducer
