import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAppSelector(s => s.auth)
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg animate-pulse">
          <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
        </div>
        <p className="text-body-md text-on-surface-variant">Loading...</p>
      </div>
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}
