import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'

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

  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/chat` },
    })
    if (error) toast.error(error.message)
  }

  return (
    <div
      className="
      min-h-screen flex flex-col overflow-x-hidden
      bg-[radial-gradient(circle_at_top_right,_#dbe1ff_0%,_#faf8ff_50%,_#eef0ff_100%)]
      dark:bg-[radial-gradient(circle_at_top_right,_#1e293b_0%,_#0f172a_50%,_#020617_100%)]
    "
    >
      <AppHeader />

      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <div
          className="
          w-full max-w-md p-8 flex flex-col gap-6 rounded-2xl
          border border-white/50
          bg-white/70 backdrop-blur-xl
          shadow-[0_12px_32px_rgba(0,0,0,0.08)]

          dark:bg-slate-900/70
          dark:border-slate-700/50
          dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)]
        "
        >
          {/* Brand */}
          <div className="text-center flex flex-col gap-1">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span
                  className="material-symbols-outlined text-white text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  chat_bubble
                </span>
              </div>
            </div>

            <h1 className="text-headline-lg text-slate-900 dark:text-slate-100">
              Welcome Back
            </h1>

            <p className="text-body-md text-slate-500 dark:text-slate-400">
              Please enter your details to sign in
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="email"
                className="text-label-md text-slate-700 dark:text-slate-300"
              >
                Email Address
              </Label>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
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

                  focus-visible:border-blue-500
                  focus-visible:ring-1
                  focus-visible:ring-blue-500
                  rounded-lg
                "
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <Label
                  htmlFor="password"
                  className="text-label-md text-slate-700 dark:text-slate-300"
                >
                  Password
                </Label>

                {/* <a
                className="text-label-md text-primary hover:underline"
                href="#"
              >
                Forgot Password?
              </a> */}
              </div>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
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

                  focus-visible:border-blue-500
                  focus-visible:ring-1
                  focus-visible:ring-blue-500
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
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="
                  w-full h-11 mt-2 rounded-lg

                  bg-blue-600
                  text-white
                  font-medium

                  shadow-lg shadow-blue-600/20

                  hover:bg-blue-700
                  active:scale-[0.98]

                  focus-visible:ring-2
                  focus-visible:ring-blue-500
                  focus-visible:ring-offset-2
                  dark:focus-visible:ring-offset-slate-900

                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  disabled:hover:bg-blue-600

                  transition-all duration-200
                "
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />

            <span className="mx-4 text-xs tracking-wider text-slate-500 dark:text-slate-400">
              OR CONTINUE WITH
            </span>

            <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
          </div>

          {/* Google Sign In */}
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

          <p className="text-center text-body-md text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link
              className="text-primary font-semibold hover:underline"
              to="/register"
            >
              Create Account
            </Link>
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
