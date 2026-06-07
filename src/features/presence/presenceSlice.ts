import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface PresenceState {
  onlineUserIds: string[]
}

const initialState: PresenceState = {
  onlineUserIds: [],
}

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setOnlineUsers(state, action: PayloadAction<string[]>) {
      state.onlineUserIds = action.payload
    },
  },
})

export const { setOnlineUsers } = presenceSlice.actions
export default presenceSlice.reducer
