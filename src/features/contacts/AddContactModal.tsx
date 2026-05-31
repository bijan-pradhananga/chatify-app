import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppSelector } from '@/app/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

type ProfileResult = {
  id: string
  username: string
  avatar_url: string | null
}

export default function AddContactModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const user = useAppSelector(s => s.auth.user)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProfileResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  const lastSearchIdRef = useRef(0)
  const queryTrimmed = query.trim()
  const showDropdown = queryTrimmed.length >= 2

  useEffect(() => {
    if (!open) return
    if (!user) return

    const q = query.trim()
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
    }, 300)

    return () => window.clearTimeout(t)
  }, [open, query, user])

  async function addContact(profile: ProfileResult) {
    if (!user) return
    if (addingId) return

    setAddingId(profile.id)

    const { error } = await supabase.from('contacts').insert({
      user_id: user.id,
      contact_id: profile.id,
      status: 'pending',
    })

    setAddingId(null)

    if (error) {
      const msg = (error as any)?.message as string | undefined
      const code = (error as any)?.code as string | undefined

      if (code === '23505' || msg?.toLowerCase().includes('duplicate')) {
        toast.message('Contact already added')
        return
      }

      toast.error(msg || 'Failed to add contact')
      return
    }

    toast.success(`Contact request sent to ${profile.username}`)
    setQuery('')
    setResults([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-headline-md text-on-surface">Add Contact</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-label-md text-on-surface">Search username</Label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
              search
            </span>
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type a username..."
              className="pl-10 bg-surface-container-low border-outline-variant/50 focus-visible:ring-primary/20 focus-visible:border-primary rounded-lg"
            />
          </div>

          {showDropdown && (
            <div className="mt-2 rounded-lg border border-outline-variant/50 bg-surface-container-low overflow-hidden">
              <ScrollArea className="max-h-56">
                <div className="py-1">
                  {results.map(p => {
                    const initials = (p.username || '?').slice(0, 2).toUpperCase()
                    const isAdding = addingId === p.id

                    return (
                      <div
                        key={p.id}
                        className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-surface-container-high transition-colors"
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={p.avatar_url ?? undefined} alt={p.username} />
                          <AvatarFallback className="bg-surface-container-highest text-primary font-bold text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="text-body-md text-on-surface truncate">{p.username}</p>
                        </div>

                        <Button
                          size="sm"
                          disabled={!!addingId}
                          onClick={() => addContact(p)}
                          className="bg-primary text-white rounded-lg"
                        >
                          {isAdding ? 'Adding…' : 'Add'}
                        </Button>
                      </div>
                    )
                  })}

                  {searching && <div className="px-3 py-2 text-body-md text-on-surface-variant">Searching…</div>}

                  {!searching && results.length === 0 && (
                    <div className="px-3 py-2 text-body-md text-on-surface-variant">No users found</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="pt-2">
            <Button variant="outline" className="w-full rounded-lg" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
