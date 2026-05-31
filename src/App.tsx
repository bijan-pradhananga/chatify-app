import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from '@/components/ui/sonner'
import { store } from './app/store'
import { supabase } from './lib/supabase'
import { setUser, clearUser } from './features/auth/authSlice'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import ChatPage from './pages/ChatPage'
import ContactsPage from './pages/ContactsPage'
import SettingsPage from './pages/SettingsPage'
import ProtectedRoute from './pages/ProtectedRoute'

function AuthListener() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) store.dispatch(setUser({ user: session.user, session }))
      else store.dispatch(clearUser())
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) store.dispatch(setUser({ user: session.user, session }))
      else store.dispatch(clearUser())
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthListener />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/chat" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </Provider>
  )
}
