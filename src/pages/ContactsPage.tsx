import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SideNavRail from '@/components/SideNavRail'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { addRoom, setActiveRoom as setRoomsActiveRoom, type Room } from '@/features/rooms/roomsSlice'
import { setActiveRoom as setChatActiveRoom } from '@/features/chat/chatSlice'

type ContactStatus = 'pending' | 'accepted' | 'blocked'

type ContactRow = {
  contact_id: string
  status: ContactStatus
  created_at: string
  contact: {
    username: string
    avatar_url: string | null
  } | null
}

type IncomingRequestRow = {
  user_id: string
  status: ContactStatus
  created_at: string
  requester: {
    username: string
    avatar_url: string | null
  } | null
}

function statusVariant(status: ContactStatus): 'secondary' | 'default' | 'destructive' {
  if (status === 'accepted') return 'default'
  if (status === 'pending') return 'secondary'
  return 'destructive'
}

function formatContactTime(ts?: string | null) {
  if (!ts) return ''
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long' })
}

export default function ContactsPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector(s => s.auth.user)

  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequestRow[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [activeContactId, setActiveContactId] = useState<string | null>(null)
  const [tab, setTab] = useState<'contacts' | 'requests'>('contacts')
  const [actingOnRequestUserId, setActingOnRequestUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    let cancelled = false
    setLoadingContacts(true)
    setLoadingRequests(true)

    ;(async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select(
          `
          contact_id,
          status,
          created_at,
          contact:profiles!contacts_contact_id_fkey(username, avatar_url)
          `.trim()
        )
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (error) {
        toast.error(error.message || 'Failed to load contacts')
        setContacts([])
        setLoadingContacts(false)
        return
      }

      setContacts(((data as unknown as ContactRow[]) || []).filter(r => !!r.contact))
      setLoadingContacts(false)
    })()

    ;(async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select(
          `
          user_id,
          status,
          created_at,
          requester:profiles!contacts_user_id_fkey(username, avatar_url)
          `.trim()
        )
        .eq('contact_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (error) {
        toast.error(error.message || 'Failed to load requests')
        setIncomingRequests([])
        setLoadingRequests(false)
        return
      }

      setIncomingRequests(((data as unknown as IncomingRequestRow[]) || []).filter(r => !!r.requester))
      setLoadingRequests(false)
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  async function acceptRequest(requesterId: string) {
    if (!user) return
    setActingOnRequestUserId(requesterId)

    const { error: updateError } = await supabase
      .from('contacts')
      .update({ status: 'accepted' })
      .eq('user_id', requesterId)
      .eq('contact_id', user.id)

    if (updateError) {
      setActingOnRequestUserId(null)
      toast.error(updateError.message || 'Failed to accept')
      return
    }

    const { error: reciprocalError } = await supabase
      .from('contacts')
      .upsert({ user_id: user.id, contact_id: requesterId, status: 'accepted' })

    setActingOnRequestUserId(null)

    if (reciprocalError) {
      toast.error(reciprocalError.message || 'Accepted, but failed to sync contact row')
      return
    }

    toast.success('Contact accepted')

    const accepted = incomingRequests.find(r => r.user_id === requesterId)
    if (accepted?.requester) {
      setContacts(prev => {
        const exists = prev.some(c => c.contact_id === requesterId)
        if (exists) return prev
        return [
          {
            contact_id: requesterId,
            status: 'accepted',
            created_at: new Date().toISOString(),
            contact: accepted.requester,
          },
          ...prev,
        ]
      })
    }

    setIncomingRequests(r => r.filter(x => x.user_id !== requesterId))
  }

  async function rejectRequest(requesterId: string) {
    if (!user) return
    setActingOnRequestUserId(requesterId)

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('user_id', requesterId)
      .eq('contact_id', user.id)

    setActingOnRequestUserId(null)

    if (error) {
      toast.error(error.message || 'Failed to reject')
      return
    }

    toast.message('Request rejected')
    setIncomingRequests(r => r.filter(x => x.user_id !== requesterId))
  }

  async function openDMWith(contactId: string, contactProfile: { username: string; avatar_url: string | null }) {
    if (!user) return

    const { data: myMemberships, error: membershipsError } = await supabase
      .from('room_members')
      .select('room_id, rooms(id, name, type, created_by, created_at)')
      .eq('user_id', user.id)

    if (membershipsError) {
      toast.error(membershipsError.message || 'Failed to open chat')
      return
    }

    const dmRoomIds = ((myMemberships as any[]) || [])
      .filter(m => m.rooms?.type === 'dm')
      .map(m => m.room_id as string)

    let room: Room | null = null

    if (dmRoomIds.length) {
      const { data: match, error: matchError } = await supabase
        .from('room_members')
        .select('room_id')
        .in('room_id', dmRoomIds)
        .eq('user_id', contactId)
        .maybeSingle()

      if (matchError) {
        toast.error(matchError.message || 'Failed to open chat')
        return
      }

      const existingRoomId = (match as any)?.room_id as string | undefined
      if (existingRoomId) {
        const { data: existingRoom, error: roomError } = await supabase
          .from('rooms')
          .select('id, name, type, created_by, created_at')
          .eq('id', existingRoomId)
          .single()

        if (roomError || !existingRoom) {
          toast.error(roomError?.message || 'Failed to open chat')
          return
        }

        room = {
          ...(existingRoom as any),
          other_user: {
            username: contactProfile.username,
            avatar_url: contactProfile.avatar_url ?? null,
          },
        } satisfies Room
      }
    }

    if (!room) {
      const { data: createdRoom, error: createError } = await supabase
        .from('rooms')
        .insert({ type: 'dm', created_by: user.id })
        .select('id, name, type, created_by, created_at')
        .single()

      if (createError || !createdRoom) {
        toast.error(createError?.message || 'Failed to create chat')
        return
      }

      const { error: memberError } = await supabase.from('room_members').insert([
        { room_id: (createdRoom as any).id, user_id: user.id, role: 'admin' },
        { room_id: (createdRoom as any).id, user_id: contactId, role: 'member' },
      ])

      if (memberError) {
        toast.error(memberError.message || 'Failed to create chat members')
        return
      }

      room = {
        ...(createdRoom as any),
        other_user: {
          username: contactProfile.username,
          avatar_url: contactProfile.avatar_url ?? null,
        },
      } satisfies Room
    }

    if (!room) return

    dispatch(addRoom(room))
    dispatch(setRoomsActiveRoom(room))
    dispatch(setChatActiveRoom(room.id))
    navigate('/chat')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SideNavRail
        activePage="contacts"
        onNavigate={p => {
          if (p === 'chat') navigate('/chat')
          if (p === 'settings') navigate('/settings')
        }}
      />

      <main className="flex flex-col flex-1 min-w-0 bg-white">
        <header className="flex items-center justify-between px-6 py-3 w-full bg-white border-b border-slate-200">
          <div className="flex items-center space-x-4 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Chatify</h1>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <section className="w-full md:w-96 flex flex-col border-r border-slate-100 flex-shrink-0">
            <div className="p-4 flex items-center justify-between">
              <Tabs value={tab} onValueChange={v => setTab(v as any)} className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="contacts" className="flex-1">
                    Contacts
                  </TabsTrigger>
                  <TabsTrigger value="requests" className="flex-1">
                    Requests
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Tabs value={tab} onValueChange={v => setTab(v as any)} className="flex-1 flex flex-col">
              <TabsContent value="contacts" className="flex-1 m-0">
                <ScrollArea className="flex-1">
                  <div className="space-y-1 p-2">
                    {loadingContacts ? (
                      <div className="text-center text-slate-400 text-body-md py-12">Loading contacts…</div>
                    ) : contacts.length === 0 ? (
                      <div className="text-center text-slate-400 text-body-md py-12">
                        <span className="material-symbols-outlined text-4xl block mb-2 text-slate-200">group</span>
                        No contacts yet
                      </div>
                    ) : (
                      contacts.map(row => {
                        const profile = row.contact!
                        const name = profile.username || 'Unknown'
                        const initials = name.slice(0, 2).toUpperCase()
                        const isActive = activeContactId === row.contact_id

                        return (
                          <div
                            key={row.contact_id}
                            onClick={() => {
                              setActiveContactId(row.contact_id)
                              if (row.contact) openDMWith(row.contact_id, row.contact)
                            }}
                            className={cn(
                              'flex items-center p-3 rounded-xl cursor-pointer transition-colors',
                              isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                            )}
                          >
                            <Avatar className="w-12 h-12 flex-shrink-0">
                              <AvatarImage src={profile.avatar_url ?? undefined} alt={name} />
                              <AvatarFallback className="bg-surface-container-highest text-primary font-bold text-sm">
                                {initials}
                              </AvatarFallback>
                            </Avatar>

                            <div className="ml-4 flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5 gap-2">
                                <h3 className="text-sm font-semibold text-slate-900 truncate">{name}</h3>
                                <span
                                  className={cn(
                                    'text-xs',
                                    isActive ? 'text-blue-600 font-medium' : 'text-slate-400'
                                  )}
                                >
                                  {formatContactTime(row.created_at)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-slate-500 truncate text-body-md">{row.status}</p>
                                <Badge variant={statusVariant(row.status)} className="capitalize flex-shrink-0">
                                  {row.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="requests" className="flex-1 m-0">
                <ScrollArea className="flex-1">
                  <div className="space-y-1 p-2">
                    {loadingRequests ? (
                      <div className="text-center text-slate-400 text-body-md py-12">Loading requests…</div>
                    ) : incomingRequests.length === 0 ? (
                      <div className="text-center text-slate-400 text-body-md py-12">
                        <span className="material-symbols-outlined text-4xl block mb-2 text-slate-200">person</span>
                        No requests
                      </div>
                    ) : (
                      incomingRequests.map(req => {
                        const profile = req.requester!
                        const name = profile.username || 'Unknown'
                        const initials = name.slice(0, 2).toUpperCase()
                        const acting = actingOnRequestUserId === req.user_id

                        return (
                          <div
                            key={req.user_id}
                            className="flex items-center p-3 rounded-xl transition-colors hover:bg-slate-50"
                          >
                            <Avatar className="w-12 h-12 flex-shrink-0">
                              <AvatarImage src={profile.avatar_url ?? undefined} alt={name} />
                              <AvatarFallback className="bg-surface-container-highest text-primary font-bold text-sm">
                                {initials}
                              </AvatarFallback>
                            </Avatar>

                            <div className="ml-4 flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5 gap-2">
                                <h3 className="text-sm font-semibold text-slate-900 truncate">{name}</h3>
                                {/* <span className="text-xs text-slate-400">{formatContactTime(req.created_at)}</span> */}
                              </div>
                              <p className="text-xs text-slate-500 truncate text-body-md">Incoming request</p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                disabled={actingOnRequestUserId !== null}
                                className="bg-primary text-white rounded-lg"
                                onClick={() => acceptRequest(req.user_id)}
                              >
                                {acting ? 'Accepting…' : 'Accept'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actingOnRequestUserId !== null}
                                className="rounded-lg"
                                onClick={() => rejectRequest(req.user_id)}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </section>

          <section className="hidden lg:flex flex-1 flex-col bg-slate-50 items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center mb-6">
              <span
                className="material-symbols-outlined text-4xl text-blue-100"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                group
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your contacts</h2>
            <p className="text-slate-500 max-w-sm text-body-md">Select a contact from the sidebar to view details.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
