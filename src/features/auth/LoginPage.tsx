import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) toast.error(error.message)
    else navigate('/chat')
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-x-hidden" style={{ background: 'radial-gradient(circle at top right, #dbe1ff 0%, #faf8ff 50%, #eef0ff 100%)' }}>
      {/* TopAppBar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-3 max-w-7xl mx-auto">
          <span className="text-xl font-bold tracking-tight text-blue-600">Chatify</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-slate-500">
              <span className="material-symbols-outlined">help_outline</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-white/50 p-8 flex flex-col gap-6"
          style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}>

          {/* Brand */}
          <div className="text-center flex flex-col gap-1">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              </div>
            </div>
            <h1 className="text-headline-lg text-on-surface">Welcome Back</h1>
            <p className="text-body-md text-on-surface-variant">Please enter your details to sign in</p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-label-md text-on-surface">Email Address</Label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">mail</span>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="pl-10 bg-surface-container-low border-transparent focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-label-md text-on-surface">Password</Label>
                <a className="text-label-md text-primary hover:underline" href="#">Forgot Password?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">lock</span>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-surface-container-low border-transparent focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary rounded-lg"
                />
                <Button type="button" variant="ghost" size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-outline hover:text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 mt-2 h-11">
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-outline-variant" />
            <span className="flex-shrink mx-4 text-label-md text-outline">OR CONTINUE WITH</span>
            <div className="flex-grow border-t border-outline-variant" />
          </div>

          {/* Google */}
          <Button variant="outline" className="w-full gap-2 border-outline-variant rounded-lg h-10">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </Button>

          <p className="text-center text-body-md text-on-surface-variant">
            Don't have an account?{' '}
            <Link className="text-primary font-semibold hover:underline" to="/register">Create Account</Link>
          </p>
        </div>
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 py-8 max-w-7xl mx-auto gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-lg font-bold text-slate-900">Chatify</span>
            <span className="text-sm font-medium text-slate-500">© 2024 Chatify. Secure & Encrypted.</span>
          </div>
          <nav className="flex gap-6">
            <a className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors" href="#">Privacy Policy</a>
            <a className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors" href="#">Terms of Service</a>
            <a className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors" href="#">Security Overview</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
