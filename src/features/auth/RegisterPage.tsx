import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/chat` },
    })
    if (error) toast.error(error.message)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { toast.error('You must agree to the Terms of Service.'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, username: email.split('@')[0] } },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: email.split('@')[0],
        avatar_url: null,
      })
      navigate('/chat')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <AppHeader />

      <main className="flex-grow flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-surface-container-low via-background to-secondary-fixed/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 py-8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-fixed/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary-fixed/20 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[440px] z-10">
          <div className="bg-surface-container-lowest dark:bg-gray-800 border border-outline-variant/30 dark:border-gray-700 rounded-xl shadow-[0px_12px_32px_rgba(0,0,0,0.06)] p-8">
            <div className="mb-6 text-center">
              <h1 className="text-headline-lg text-on-background dark:text-gray-100 mb-1">Create Account</h1>
              <p className="text-body-md text-on-surface-variant dark:text-gray-400">Join Chatify for seamless communication.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="full-name" className="text-label-md text-on-surface">Full Name</Label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">person</span>
                  <Input id="full-name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Doe"
                    className="pl-10 bg-surface-container-low dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 border-outline-variant/50 focus-visible:ring-primary/20 focus-visible:border-primary rounded-lg" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-label-md text-on-surface">Email Address</Label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">mail</span>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@company.com"
                    className="pl-10 bg-surface-container-low dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 border-outline-variant/50 focus-visible:ring-primary/20 focus-visible:border-primary rounded-lg" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-label-md text-on-surface">Password</Label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">lock</span>
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                    className="pl-10 pr-10 bg-surface-container-low border-outline-variant/50 focus-visible:ring-primary/20 focus-visible:border-primary rounded-lg" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-outline hover:text-primary">
                    <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 py-1">
                <input id="terms" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
                <label className="text-body-md text-on-surface-variant" htmlFor="terms">
                  I agree to the <a className="text-primary font-medium hover:underline" href="#">Terms of Service</a> and{' '}
                  <a className="text-primary font-medium hover:underline" href="#">Privacy Policy</a>.
                </label>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-primary text-on-primary rounded-lg shadow-sm h-11 mt-2">
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/30" /></div>
              <span className="relative bg-surface-container-lowest px-4 text-label-md text-outline">OR REGISTER WITH</span>
            </div>

            <Button variant="outline" onClick={handleGoogleSignIn} className="w-full gap-2 border-outline-variant/50 rounded-lg h-10 mb-6">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </Button>

            <p className="text-center text-body-md text-on-surface-variant">
              Already have an account?{' '}
              <Link className="text-primary font-semibold hover:underline" to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
