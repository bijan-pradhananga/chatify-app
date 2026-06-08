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
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background">
      <AppHeader />

      <main className="flex-grow flex items-center justify-center relative overflow-hidden px-4 py-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl dark:bg-blue-500/5" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl dark:bg-indigo-500/5" />
        </div>

        <div className="w-full max-w-[440px] z-10">
          <div className="
          bg-white/70 backdrop-blur-xl
          border border-slate-200/50
          dark:bg-slate-900/70
          dark:border-slate-700/40
          rounded-2xl
          shadow-[0_12px_32px_rgba(0,0,0,0.08)]
          dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)]
          p-8
        ">

            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                Create Account
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Join Chatify for seamless communication.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300">
                  Full Name
                </Label>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    person
                  </span>

                  <Input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className="
                    pl-10
                    bg-slate-50
                    border-slate-200
                    dark:bg-slate-800
                    dark:border-slate-700
                    dark:text-slate-100
                    focus-visible:ring-2
                    focus-visible:ring-blue-500/20
                    focus-visible:border-blue-500
                    rounded-lg
                  "
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    mail
                  </span>

                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="
                    pl-10
                    bg-slate-50
                    border-slate-200
                    dark:bg-slate-800
                    dark:border-slate-700
                    dark:text-slate-100
                    focus-visible:ring-2
                    focus-visible:ring-blue-500/20
                    focus-visible:border-blue-500
                    rounded-lg
                  "
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300">
                  Password
                </Label>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock
                  </span>

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="
                    pl-10 pr-10
                    bg-slate-50
                    border-slate-200
                    dark:bg-slate-800
                    dark:border-slate-700
                    dark:text-slate-100
                    focus-visible:ring-2
                    focus-visible:ring-blue-500/20
                    focus-visible:border-blue-500
                    rounded-lg
                  "
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="
                    absolute right-1 top-1/2 -translate-y-1/2
                    h-8 w-8
                    text-slate-500
                    hover:text-slate-700
                    dark:text-slate-400
                    dark:hover:text-slate-200
                  "
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </Button>
                </div>
              </div>



              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="
                w-full h-11 mt-2 rounded-lg
                bg-blue-600
                text-white font-medium
                shadow-lg shadow-blue-600/20
                hover:bg-blue-700
                active:scale-[0.98]
                transition-all
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>

              <span className="relative bg-white dark:bg-slate-900 px-4 text-xs tracking-wider text-slate-500 dark:text-slate-400">
                OR REGISTER WITH
              </span>
            </div>

            {/* Google */}
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              className="
              w-full h-10 gap-2 rounded-lg
              border-slate-200
              dark:bg-slate-800
              dark:border-slate-700
              dark:text-slate-100
              dark:hover:bg-slate-700
            "
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              Already have an account?{" "}
              <Link
                className="text-blue-600 font-semibold hover:underline"
                to="/login"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
