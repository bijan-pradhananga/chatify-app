import { useRef, useState } from 'react'
import { useAppSelector, useAppDispatch } from '../../app/hooks'
import { addMessage, reconcileMessage } from './chatSlice'
import { updateRoomLastMessage } from '../rooms/roomsSlice'
import { supabase } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024

export default function MessageInput() {
  const dispatch = useAppDispatch()
  const roomId = useAppSelector(s => s.chat.activeRoomId)
  const user = useAppSelector(s => s.auth.user)
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function sendMessage(content: string, attachmentFiles?: File[]) {
    if (!roomId || !user) return
    const messageType = attachmentFiles?.length ? (content ? 'mixed' : 'image') : 'text'

    const optimisticId = crypto.randomUUID()
    const optimistic = {
      id: optimisticId,
      room_id: roomId,
      sender_id: user.id,
      content: content || null,
      message_type: messageType as 'text' | 'image' | 'mixed',
      is_spam: false,
      spam_score: 0,
      nb_score: 0,
      perspective_score: 0,
      spam_reason: null,
      is_deleted: false,
      created_at: new Date().toISOString(),
      attachments: [],
      profiles: { username: user.email || '', avatar_url: null },
    }
    dispatch(addMessage(optimistic))

    const { data: msg, error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, sender_id: user.id, content: content || null, message_type: messageType })
      .select('*, attachments(*), profiles(username, avatar_url)')
      .single()

    if (error || !msg) {
      toast.error('Failed to send message')
      return
    }

    dispatch(reconcileMessage({ optimisticId, serverMessage: msg }))
    dispatch(updateRoomLastMessage({
      roomId,
      message: messageType === 'image' ? '📷 Photo' : (content || '📷 Photo'),
      at: msg.created_at,
    }))

    if (attachmentFiles?.length) {
      for (const file of attachmentFiles) {
        const path = `${roomId}/${user.id}/${Date.now()}_${file.name}`
        const { data: uploaded } = await supabase.storage.from('attachments').upload(path, file)
        if (uploaded) {
          const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path)
          await supabase.from('attachments').insert({
            message_id: msg.id,
            sender_id: user.id,
            storage_path: path,
            public_url: urlData.publicUrl,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
          })
        }
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    await sendMessage(content)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const invalid = files.filter(f => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_SIZE)
    if (invalid.length) toast.error('Some files were skipped (invalid type or >5MB)')
    const valid = files.filter(f => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_SIZE)
    if (valid.length) {
      setUploading(true)
      await sendMessage(text.trim(), valid)
      setText('')
      setUploading(false)
    }
    e.target.value = ''
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <footer className="bg-white dark:bg-gray-900 px-6 py-4 border-t border-slate-100 dark:border-gray-800">
      <form onSubmit={handleSubmit}>
        <div className="max-w-4xl mx-auto flex items-center bg-surface-container-low dark:bg-gray-800 rounded-full px-4 py-2 border border-slate-200 dark:border-gray-700 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Button type="button" variant="ghost" size="icon" onClick={() => fileRef.current?.click()}
            className="text-slate-500 hover:text-primary rounded-full h-9 w-9">
            <span className="material-symbols-outlined">add_circle</span>
          </Button>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-body-lg text-on-surface dark:text-gray-100 px-2 placeholder:text-slate-400 dark:placeholder:text-gray-500"
          />
          <div className="flex items-center space-x-1">
            <Button type="button" variant="ghost" size="icon" onClick={() => fileRef.current?.click()}
              className="text-slate-500 hover:text-primary rounded-full h-9 w-9">
              <span className="material-symbols-outlined">attach_file</span>
            </Button>
            <Button type="submit" size="icon" disabled={!text.trim() && !uploading}
              className="ml-2 w-10 h-10 bg-primary text-on-primary rounded-full shadow-md hover:bg-primary/90 disabled:opacity-40">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </Button>
          </div>
        </div>
      </form>
      <input ref={fileRef} type="file" accept={ALLOWED_TYPES.join(',')} multiple className="hidden" onChange={handleFile} />
    </footer>
  )
}
