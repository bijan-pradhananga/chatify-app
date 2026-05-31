import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAppSelector, useAppDispatch } from '../../app/hooks'
import { addRoom } from './roomsSlice'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface Props {
  onClose: () => void
  initialTab?: 'dm' | 'group'
}

type ProfileResult = {
  id: string
  username: string
  avatar_url: string | null
}

export default function NewRoomModal({ onClose, initialTab = 'dm' }: Props) {
  const dispatch = useAppDispatch()
  const user = useAppSelector(s => s.auth.user)
  const [username, setUsername] = useState('')
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)

  const [dmResults, setDmResults] = useState<ProfileResult[]>([])
  const [dmSearching, setDmSearching] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState<ProfileResult | null>(null)
  const lastSearchIdRef = useRef(0)

  const usernameTrimmed = username.trim()
  const showDmDropdown = usernameTrimmed.length >= 2 && (!selectedTarget || selectedTarget.username !== usernameTrimmed)

  useEffect(() => {
    if (!user) return

    const q = username.trim()
    if (selectedTarget && selectedTarget.username === q) {
      setDmResults([])
      setDmSearching(false)
      return
    }
    if (q.length < 2) {
      setDmResults([])
      setDmSearching(false)
      return
    }

    const mySearchId = ++lastSearchIdRef.current
    setDmSearching(true)

    const t = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,username,avatar_url')
        .ilike('username', `%${q}%`)
        .neq('id', user.id)
        .order('username', { ascending: true })
        .limit(8)

      if (lastSearchIdRef.current !== mySearchId) return

      if (error) {
        setDmResults([])
        setDmSearching(false)
        return
      }

      setDmResults((data as ProfileResult[]) || [])
      setDmSearching(false)
    }, 300)

    return () => window.clearTimeout(t)
  }, [username, user, selectedTarget])

  async function createDM() {
    if (!user) return
    setLoading(true)
    const trimmed = username.trim()

    const { data: target } = selectedTarget && selectedTarget.username === trimmed
      ? { data: selectedTarget }
      : await supabase
        .from('profiles')
        .select('id,username,avatar_url')
        .eq('username', trimmed)
        .single()

    if (!target) { toast.error('User not found'); setLoading(false); return }

    const { data: room, error } = await supabase
      .from('rooms').insert({ type: 'dm', created_by: user.id }).select().single()
    if (error || !room) { toast.error(error?.message || 'Failed to create'); setLoading(false); return }

    await supabase.from('room_members').insert([
      { room_id: room.id, user_id: user.id, role: 'admin' },
      { room_id: room.id, user_id: target.id, role: 'member' },
    ])
    dispatch(addRoom({ ...room, other_user: { username: target.username, avatar_url: (target as any).avatar_url ?? null } }))
    toast.success(`Chat with ${target.username} created`)
    setLoading(false)
    onClose()
  }

  async function createGroup() {
    if (!user) return
    if (!groupName.trim()) { toast.error('Group name is required'); return }
    setLoading(true)
    const { data: room, error } = await supabase
      .from('rooms').insert({ type: 'group', name: groupName.trim(), created_by: user.id }).select().single()
    if (error || !room) { toast.error(error?.message || 'Failed to create'); setLoading(false); return }
    await supabase.from('room_members').insert({ room_id: room.id, user_id: user.id, role: 'admin' })
    dispatch(addRoom(room))
    toast.success(`Group "${groupName}" created`)
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-headline-md text-on-surface">New Conversation</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="dm" className="flex-1">Direct Message</TabsTrigger>
            <TabsTrigger value="group" className="flex-1">Group Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="dm" className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-label-md text-on-surface">Username</Label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">person</span>
                <Input
                  value={username}
                  onChange={e => {
                    const next = e.target.value
                    setUsername(next)
                    if (selectedTarget && selectedTarget.username !== next.trim()) setSelectedTarget(null)
                  }}
                  placeholder="Enter username"
                  className="pl-10 bg-surface-container-low border-outline-variant/50 focus-visible:ring-primary/20 focus-visible:border-primary rounded-lg" />
              </div>

              {showDmDropdown && (
                <div className="mt-2 rounded-lg border border-outline-variant/50 bg-surface-container-low overflow-hidden">
                  <ScrollArea className="max-h-48">
                    <div className="py-1">
                      {dmResults.map(p => {
                        const initials = (p.username || '?').slice(0, 2).toUpperCase()
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedTarget(p)
                              setUsername(p.username)
                              setDmResults([])
                            }}
                            className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-surface-container-high transition-colors"
                          >
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={p.avatar_url ?? undefined} alt={p.username} />
                              <AvatarFallback className="bg-surface-container-highest text-primary font-bold text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-body-md text-on-surface truncate">{p.username}</p>
                            </div>
                          </button>
                        )
                      })}

                      {dmSearching && (
                        <div className="px-3 py-2 text-body-md text-on-surface-variant">Searching…</div>
                      )}

                      {!dmSearching && dmResults.length === 0 && (
                        <div className="px-3 py-2 text-body-md text-on-surface-variant">No users found</div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
            <Button onClick={createDM} disabled={loading || !username.trim()} className="w-full bg-primary text-white rounded-lg h-11">
              {loading ? 'Creating...' : 'Start Chat'}
            </Button>
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-label-md text-on-surface">Group Name</Label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">group</span>
                <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Enter group name"
                  className="pl-10 bg-surface-container-low border-outline-variant/50 focus-visible:ring-primary/20 focus-visible:border-primary rounded-lg" />
              </div>
            </div>
            <Button onClick={createGroup} disabled={loading || !groupName.trim()} className="w-full bg-primary text-white rounded-lg h-11">
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
