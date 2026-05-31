import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface SpamLog {
  id: string
  message_id: string
  user_id: string
  nb_score: number
  perspective_score: number
  combined_score: number
  action: string
  created_at: string
  profiles?: { username: string }
  messages?: { content: string | null }
}

interface SpamState {
  spamLogs: SpamLog[]
  stats: {
    total: number
    blocked: number
    flagged: number
    topOffenders: { user_id: string; username: string; count: number }[]
  }
}

const initialState: SpamState = {
  spamLogs: [],
  stats: { total: 0, blocked: 0, flagged: 0, topOffenders: [] },
}

const spamSlice = createSlice({
  name: 'spam',
  initialState,
  reducers: {
    setSpamLogs(state, action: PayloadAction<SpamLog[]>) {
      state.spamLogs = action.payload
    },
    addSpamLog(state, action: PayloadAction<SpamLog>) {
      state.spamLogs.unshift(action.payload)
      state.stats.total += 1
    },
    setStats(state, action: PayloadAction<SpamState['stats']>) {
      state.stats = action.payload
    },
  },
})

export const { setSpamLogs, addSpamLog, setStats } = spamSlice.actions
export default spamSlice.reducer
