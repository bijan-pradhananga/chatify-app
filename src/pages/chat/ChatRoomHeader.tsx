import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { removeRoom } from '@/features/rooms/roomsSlice'

type ProfileResult = {
  id: string
  username: string
  avatar_url: string | null
}

type MemberRow = {
  user_id: string
  role: string | null
  profiles: { username: string; avatar_url: string | null } | null
}

export default function ChatRoomHeader({
  roomId,
  roomName,
  roomInitials,
  roomType,
  createdBy,
  onBack,
}: {
  roomId: string
  roomName: string
  roomInitials: string
  roomType: 'dm' | 'group'
  createdBy: string
  onBack: () => void
}) {
  const dispatch = useAppDispatch()
  const user = useAppSelector(s => s.auth.user)

  const [addOpen, setAddOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [results, setResults] = useState<ProfileResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState<ProfileResult | null>(null)
  const [adding, setAdding] = useState(false)
  const lastSearchIdRef = useRef(0)

  const isOwner = !!user && createdBy === user.id
  const dangerLabel = roomType === 'group' ? (isOwner ? 'Delete group' : 'Leave group') : 'Delete chat'
  const dangerConfirm = roomType === 'group'
    ? (isOwner ? 'Delete this group for everyone? This cannot be undone.' : 'Leave this group?')
    : 'Delete this chat from your list?'

  useEffect(() => {
    if (!membersOpen) return
    if (!user) return
    if (roomType !== 'group') return

    let cancelled = false
    setMembersLoading(true)
    ;(async () => {
      const { data, error } = await supabase
        .from('room_members')
        .select('user_id, role, profiles(username, avatar_url)')
        .eq('room_id', roomId)
        .order('role', { ascending: false })

      if (cancelled) return

      if (error) {
        setMembers([])
        setMembersLoading(false)
        toast.error(error.message || 'Failed to load members')
        return
      }

      const next: MemberRow[] = ((data as any[]) || []).map(d => {
        const p = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles
        return {
          user_id: d.user_id,
          role: d.role ?? null,
          profiles: p ? { username: p.username, avatar_url: p.avatar_url ?? null } : null,
        }
      })
      setMembers(next)
      setMembersLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [membersOpen, user, roomType, roomId])

  useEffect(() => {
    if (!addOpen) return
    if (!user) return
    if (roomType !== 'group') return

    const q = username.trim()
    if (selectedTarget && selectedTarget.username === q) {
      setResults([])
      setSearching(false)
      return
    }
    if (q.length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    const mySearchId = ++lastSearchIdRef.current
    setSearching(true)

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
        setResults([])
        setSearching(false)
        return
      }

      setResults((data as ProfileResult[]) || [])
      setSearching(false)
    }, 250)

    return () => window.clearTimeout(t)
  }, [addOpen, username, user, selectedTarget, roomType])

  async function handleAddMember() {
    if (!user) return
    if (roomType !== 'group') return
    const target = selectedTarget
    if (!target) {
      toast.error('Select a user to add')
      return
    }

    setAdding(true)
    const { error } = await supabase
      .from('room_members')
      .insert({ room_id: roomId, user_id: target.id, role: 'member' })
    setAdding(false)

    if (error) {
      toast.error(error.message || 'Failed to add member')
      return
    }

    toast.success(`${target.username} added to the group`)
    setAddOpen(false)
    setUsername('')
    setSelectedTarget(null)
    setResults([])
  }

  async function handleRemoveMember(memberUserId: string) {
    if (!user) return
    if (roomType !== 'group') return
    if (!isOwner) {
      toast.error('Only the group owner can remove members')
      return
    }
    if (memberUserId === user.id) {
      toast.message('Use “Leave group” to remove yourself')
      return
    }

    const ok = window.confirm('Remove this member from the group?')
    if (!ok) return

    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', memberUserId)

    if (error) {
      toast.error(error.message || 'Failed to remove member')
      return
    }

    setMembers(ms => ms.filter(m => m.user_id !== memberUserId))
    toast.success('Member removed')
  }

  async function handleDangerAction() {
    if (!user) return
    const ok = window.confirm(dangerConfirm)
    if (!ok) return

    if (roomType === 'group' && isOwner) {
      const { error } = await supabase.from('rooms').delete().eq('id', roomId)
      if (error) {
        toast.error(error.message || 'Failed to delete group')
        return
      }
      dispatch(removeRoom(roomId))
      toast.success('Group deleted')
      onBack()
      return
    }

    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id)

    if (error) {
      toast.error(error.message || 'Failed to update conversation')
      return
    }

    dispatch(removeRoom(roomId))
    toast.success(roomType === 'group' ? 'Left group' : 'Chat removed')
    onBack()
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between px-6 py-3 shadow-sm dark:shadow-gray-900 z-10">
      <div className="flex items-center space-x-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-slate-500 md:hidden"
          onClick={onBack}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Button>

        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary-container text-on-primary-container font-bold text-sm">
              {roomInitials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        </div>

        <div className="min-w-0">
          <h1 className="text-slate-900 dark:text-gray-100 text-headline-md tracking-tight truncate">{roomName}</h1>
          <p className="text-slate-500 dark:text-gray-400 text-label-md">{roomType === 'dm' ? 'Online' : 'Group Chat'}</p>
        </div>
      </div>

      <div className="flex items-center space-x-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full text-slate-500">
              <span className="material-symbols-outlined">more_vert</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {roomType === 'group' && (
              <>
                <DropdownMenuLabel>Members</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setMembersOpen(true)}>
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  View members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAddOpen(true)}>
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Add members
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuLabel>Danger zone</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={handleDangerAction}
              className="text-red-600 focus:text-red-600"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              {dangerLabel}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {roomType === 'group' && (
        <Dialog
          open={addOpen}
          onOpenChange={open => {
            setAddOpen(open)
            if (!open) {
              setUsername('')
              setSelectedTarget(null)
              setResults([])
              setSearching(false)
            }
          }}
        >
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-headline-md text-on-surface">Add members</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
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
                    placeholder="Search username"
                    className="pl-10 bg-surface-container-low border-outline-variant/50 focus-visible:ring-primary/20 focus-visible:border-primary rounded-lg"
                  />
                </div>

                {(username.trim().length >= 2 && !selectedTarget) && (
                  <div className="mt-2 rounded-lg border border-outline-variant/50 bg-surface-container-low overflow-hidden">
                    <ScrollArea className="max-h-48">
                      <div className="py-1">
                        {results.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedTarget(p)
                              setUsername(p.username)
                              setResults([])
                            }}
                            className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-surface-container-high transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-body-md text-on-surface truncate">{p.username}</p>
                            </div>
                          </button>
                        ))}

                        {searching && (
                          <div className="px-3 py-2 text-body-md text-on-surface-variant">Searching…</div>
                        )}

                        {!searching && results.length === 0 && (
                          <div className="px-3 py-2 text-body-md text-on-surface-variant">No users found</div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              <Button
                onClick={handleAddMember}
                disabled={adding || !selectedTarget}
                className="w-full bg-primary text-white rounded-lg h-11"
              >
                {adding ? 'Adding…' : 'Add to group'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {roomType === 'group' && (
        <Dialog
          open={membersOpen}
          onOpenChange={open => {
            setMembersOpen(open)
            if (!open) {
              setMembers([])
              setMembersLoading(false)
            }
          }}
        >
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-headline-md text-on-surface">Members</DialogTitle>
            </DialogHeader>

            <ScrollArea className="max-h-80">
              <div className="space-y-1">
                {membersLoading && (
                  <div className="px-3 py-2 text-body-md text-on-surface-variant">Loading…</div>
                )}

                {!membersLoading && members.length === 0 && (
                  <div className="px-3 py-2 text-body-md text-on-surface-variant">No members found</div>
                )}

                {!membersLoading && members.map(m => {
                  const username = m.profiles?.username || 'Unknown'
                  const initials = (username || '?').slice(0, 2).toUpperCase()
                  const canRemove = isOwner && user?.id !== m.user_id
                  return (
                    <div key={m.user_id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700">
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarImage src={m.profiles?.avatar_url ?? undefined} alt={username} />
                        <AvatarFallback className="bg-primary-container text-on-primary-container font-bold text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-gray-100 truncate">{username}</p>
                          {m.role && (
                            <span className="text-xs text-slate-500 dark:text-gray-400">({m.role})</span>
                          )}
                          {user?.id === m.user_id && (
                            <span className="text-xs text-slate-500 dark:text-gray-400">(you)</span>
                          )}
                        </div>
                      </div>

                      {canRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </header>
  )
}
