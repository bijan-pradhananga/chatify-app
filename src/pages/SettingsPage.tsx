import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Profile = {
  username: string
  avatar_url: string | null
  bio: string
}

const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const AVATAR_MAX_SIZE = 800 * 1024
const AVATAR_BUCKET = 'avatars'

const sections = [
  { key: 'profile', icon: 'person', label: 'Profile' },
  // { key: 'notifications', icon: 'notifications', label: 'Notifications' },
  { key: 'appearance', icon: 'palette', label: 'Appearance' },
  { key: 'privacy', icon: 'lock', label: 'Privacy & Security' },
  // { key: 'data', icon: 'database',i label: 'Data & Storage' },
]

// function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
//   return (
//     <label className="relative inline-flex items-center cursor-pointer">
//       <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
//       <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
//     </label>
//   )
// } 

export default function SettingsPage() {
  const navigate = useNavigate()
  const user = useAppSelector(s => s.auth.user)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  // const [desktopNotif, setDesktopNotif] = useState(true)
  // const [msgPreview, setMsgPreview] = useState(true)
  // const [soundEffects, setSoundEffects] = useState(false)
  const [readReceipts, setReadReceipts] = useState(true)
  const [activeSection, setActiveSection] = useState('profile')

  const [profile, setProfile] = useState<Profile>({ username: '', avatar_url: null, bio: '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const originalProfileRef = useRef<Profile | null>(null)
  const avatarFileRef = useRef<HTMLInputElement>(null)

  const displayName = profile.username || user?.email?.split('@')[0] || '?'
  const initials = (displayName || '?').slice(0, 2).toUpperCase()

  function applyTheme(t: 'light' | 'dark' | 'system') {
    setTheme(t)
    localStorage.setItem('theme', t)
    if (t === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  useEffect(() => {
    if (!user) return

    let cancelled = false
    setProfileLoading(true)
    ;(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        toast.error('Failed to load profile')
        const fallback: Profile = {
          username: user.email?.split('@')[0] || '',
          avatar_url: null,
          bio: '',
        }
        setProfile(fallback)
        originalProfileRef.current = fallback
        setProfileLoading(false)
        return
      }

      const next: Profile = {
        username: (data as any)?.username || user.email?.split('@')[0] || '',
        avatar_url: (data as any)?.avatar_url ?? null,
        bio: (data as any)?.bio || '',
      }
      setProfile(next)
      originalProfileRef.current = next
      setProfileLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  async function handleSaveProfile() {
    if (!user) return

    const usernameTrimmed = profile.username.trim()
    if (!usernameTrimmed) {
      toast.error('Username is required')
      return
    }

    setProfileSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: usernameTrimmed,
        bio: profile.bio.trim(),
        avatar_url: profile.avatar_url,
      })

    setProfileSaving(false)

    if (error) {
      toast.error(error.message || 'Failed to update profile')
      return
    }

    const saved: Profile = {
      username: usernameTrimmed,
      bio: profile.bio.trim(),
      avatar_url: profile.avatar_url,
    }
    originalProfileRef.current = saved
    setProfile(saved)
    toast.success('Profile updated')
  }

  function handleDiscardChanges() {
    if (!originalProfileRef.current) return
    setProfile(originalProfileRef.current)
    toast.message('Changes discarded')
  } 

  async function uploadAvatar(file: File) {
    if (!user) return
    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type (JPG, GIF, PNG, WEBP only)')
      return   
    }
    if (file.size > AVATAR_MAX_SIZE) {
      toast.error('File too large (max 800KB)')
      return
    }

    setProfileSaving(true)
    const ext = file.name.split('.').pop() || 'png'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setProfileSaving(false)
      toast.error(uploadError.message || 'Failed to upload avatar')
      return
    }

    const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, avatar_url: publicUrl, username: profile.username.trim() || user.email?.split('@')[0] || '' })

    setProfileSaving(false)

    if (profileError) {
      toast.error(profileError.message || 'Failed to update avatar')
      return
    }

    setProfile(p => ({ ...p, avatar_url: publicUrl }))
    if (originalProfileRef.current) originalProfileRef.current = { ...originalProfileRef.current, avatar_url: publicUrl }
    toast.success('Profile photo updated')
  }

  async function removeAvatar() {
    if (!user) return
    setProfileSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, avatar_url: null, username: profile.username.trim() || user.email?.split('@')[0] || '' })
    setProfileSaving(false)

    if (error) {
      toast.error(error.message || 'Failed to remove avatar')
      return
    }

    setProfile(p => ({ ...p, avatar_url: null }))
    if (originalProfileRef.current) originalProfileRef.current = { ...originalProfileRef.current, avatar_url: null }
    toast.success('Profile photo removed')
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    await uploadAvatar(file)
  }

  return (
    <div className="bg-background text-body-md text-on-background h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="bg-white border-b border-slate-200 flex items-center justify-between px-6 py-3 fixed top-0 w-full z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chat')} className="text-slate-500">
            <span className="material-symbols-outlined">arrow_back</span>
          </Button>
          <span className="text-xl font-bold tracking-tight text-slate-900">Chatify</span>
          <div className="ml-4 flex items-center bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30">
            <span className="material-symbols-outlined text-slate-400 mr-2 text-lg">search</span>
            <input className="bg-transparent border-none focus:ring-0 outline-none text-body-md w-64" placeholder="Search settings..." type="text" />
          </div>
        </div>
      </header>

      <div className="flex h-full pt-[56px]">
        {/* Side Rail */}
        <aside className="bg-slate-50 border-r border-slate-200 flex flex-col items-center py-6 w-20 h-full space-y-8 flex-shrink-0">
          <div className="flex flex-col items-center gap-1">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-primary-container text-on-primary-container font-bold text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="w-2 h-2 rounded-full bg-green-500 border border-white -mt-2 ml-7" />
          </div>
          <nav className="flex flex-col gap-4">
            {[
              { key: 'chat', icon: 'chat', path: '/chat' },
              { key: 'group', icon: 'group' },
              { key: 'call', icon: 'call' },
              { key: 'settings', icon: 'settings' },
            ].map(item => (
              <button key={item.key} onClick={() => item.path ? navigate(item.path) : undefined}
                className={cn('p-3 transition-colors active:scale-95 duration-200 rounded-lg',
                  item.key === 'settings' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-200')}>
                <span className="material-symbols-outlined" style={item.key === 'settings' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.icon}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 flex overflow-hidden">
          {/* Settings Sidebar */}
          <div className="w-72 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
            <div className="p-6">
              <h1 className="text-headline-lg mb-6">Settings</h1>
              <div className="space-y-1">
                {sections.map(s => (
                  <a key={s.key} href={`#${s.key}`} onClick={() => setActiveSection(s.key)}
                    className={cn('flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors',
                      activeSection === s.key ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50')}>
                    <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                    <span className="text-label-md">{s.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50">
            <div className="max-w-3xl mx-auto px-8 py-12 space-y-12">

              {/* Profile */}
              <section id="profile" className="space-y-6">
                <div>
                  <h2 className="text-headline-md text-on-surface">Profile</h2>
                  <p className="text-body-md text-slate-500">Manage your public information and how others see you.</p>
                </div>
                <Card className="shadow-sm border-slate-100">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="relative group cursor-pointer" onClick={() => avatarFileRef.current?.click()}>
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
                          <AvatarFallback className="bg-primary-container text-on-primary-container font-bold text-2xl">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-white">photo_camera</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-label-md text-slate-900 mb-1">Profile Photo</h3>
                        <p className="text-label-sm text-slate-500 mb-3">JPG, GIF or PNG. Max size of 800K</p>
                        <div className="flex gap-2">
                          <Button size="sm" disabled={!user || profileSaving} className="bg-primary text-white hover:bg-blue-700" onClick={() => avatarFileRef.current?.click()}>
                            Upload
                          </Button>
                          <Button size="sm" disabled={!user || profileSaving || !profile.avatar_url} variant="outline" className="border-outline-variant" onClick={removeAvatar}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-label-sm text-slate-600">Email</Label>
                        <Input type="email" value={user?.email || ''} readOnly className="bg-slate-50 text-slate-500 cursor-not-allowed" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-label-sm text-slate-600">Username</Label>
                        <Input
                          type="text"
                          value={profile.username}
                          disabled={!user || profileLoading || profileSaving}
                          onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                          className="focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-label-sm text-slate-600">Bio</Label>
                        <Textarea
                          rows={3}
                          value={profile.bio}
                          disabled={!user || profileLoading || profileSaving}
                          onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                          placeholder="Tell people about yourself..."
                          className="resize-none focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <Separator />

              {/* Notifications */}
              {/* <section id="notifications" className="space-y-6">
                <h2 className="text-headline-md text-on-surface">Notifications</h2>
                <Card className="shadow-sm border-slate-100 overflow-hidden">
                  <CardContent className="p-0 divide-y divide-slate-100">
                    {[
                      { label: 'Desktop Notifications', desc: 'Show a popup for every incoming message', val: desktopNotif, set: setDesktopNotif },
                      { label: 'Message Preview', desc: 'Show message text in desktop notifications', val: msgPreview, set: setMsgPreview },
                      { label: 'Sound Effects', desc: 'Play a sound when you receive or send a message', val: soundEffects, set: setSoundEffects },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between p-6">
                        <div className="space-y-1">
                          <p className="text-label-md text-slate-900">{item.label}</p>
                          <p className="text-body-md text-slate-500">{item.desc}</p>
                        </div>
                        <Toggle checked={item.val} onChange={item.set} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section> */}

              {/* <Separator /> */}

              {/* Appearance */}
              <section id="appearance" className="space-y-6">
                <h2 className="text-headline-md text-on-surface">Appearance</h2>
                <Card className="shadow-sm border-slate-100">
                  <CardContent className="p-6 space-y-8">
                    <div className="space-y-4">
                      <Label className="text-label-md text-slate-900">Theme Preference</Label>
                      <div className="grid grid-cols-3 gap-4">
                        {([
                          { key: 'light', label: 'Light', bg: 'bg-slate-100' },
                          { key: 'dark', label: 'Dark', bg: 'bg-slate-900' },
                          { key: 'system', label: 'System', bg: 'bg-gradient-to-br from-slate-100 to-slate-900' },
                        ] as const).map(t => (
                          <div key={t.key} className="relative cursor-pointer" onClick={() => applyTheme(t.key)}>
                            <div className={cn('h-20 rounded-xl border-2 p-2 flex flex-col gap-2 transition-colors', t.bg,
                              theme === t.key ? 'border-primary' : 'border-transparent hover:border-slate-300')}>
                              <div className="w-1/2 h-2 bg-slate-300/50 rounded" />
                              <div className="w-3/4 h-2 bg-slate-200/50 rounded self-end" />
                            </div>
                            <p className={cn('text-center mt-2 text-label-sm font-medium', theme === t.key ? 'text-primary' : 'text-slate-600')}>{t.label}</p>
                            {theme === t.key && (
                              <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[10px] text-white">✓</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <Separator />

              {/* Privacy */}
              <section id="privacy" className="space-y-6">
                <h2 className="text-headline-md text-on-surface">Privacy & Security</h2>
                <Card className="shadow-sm border-slate-100 overflow-hidden">
                  <CardContent className="p-0 divide-y divide-slate-100">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-label-md text-slate-900">Two-Factor Authentication</p>
                        <Button variant="ghost" size="sm" className="text-primary font-bold hover:text-primary">Enable</Button>
                      </div>
                      <p className="text-body-md text-slate-500">Add an extra layer of security to your account.</p>
                    </div>
                    <div className="p-6">
                      <p className="text-label-md text-slate-900 mb-3">Read Receipts</p>
                      <div className="flex gap-4">
                        {[{ val: true, label: 'Enabled' }, { val: false, label: 'Disabled' }].map(opt => (
                          <button key={String(opt.val)} onClick={() => setReadReceipts(opt.val)}
                            className={cn('flex-1 border p-4 rounded-xl transition-colors',
                              readReceipts === opt.val ? 'border-primary bg-blue-50' : 'border-slate-200 hover:border-slate-300')}>
                            <div className="flex items-center justify-between">
                              <span className={cn('text-label-sm font-bold', readReceipts === opt.val ? 'text-primary' : 'text-slate-600')}>{opt.label}</span>
                              <div className={cn('w-4 h-4 rounded-full', readReceipts === opt.val ? 'border-4 border-primary' : 'border-2 border-slate-300')} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Button variant="ghost" disabled={profileSaving} className="text-slate-600 font-bold" onClick={handleDiscardChanges}>
                  Discard Changes
                </Button>
                <Button className="px-8 bg-primary text-white font-bold shadow-md shadow-blue-200 hover:bg-blue-700"
                  disabled={profileSaving}
                  onClick={handleSaveProfile}>
                  {profileSaving ? 'Saving…' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <input
        ref={avatarFileRef}
        type="file"
        accept={AVATAR_ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleAvatarFile}
      />
    </div>
  )
}
