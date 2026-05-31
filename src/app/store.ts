import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import chatReducer from '../features/chat/chatSlice'
import roomsReducer from '../features/rooms/roomsSlice'
import spamReducer from '../features/spam/spamSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    rooms: roomsReducer,
    spam: spamReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ serializableCheck: false }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
