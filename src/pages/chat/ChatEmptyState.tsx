import { useState } from 'react'
import NewRoomModal from '@/features/rooms/NewRoomModal'

export default function ChatEmptyState() {
  const [open, setOpen] = useState(false)
  const [initialTab, setInitialTab] = useState<'dm' | 'group'>('dm')

  return (
    <>
      <section className="hidden lg:flex flex-1 flex-col bg-slate-50 items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center mb-6">
          <span
            className="material-symbols-outlined text-4xl text-blue-100"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            chat_bubble
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Chatify</h2>
        <p className="text-slate-500 max-w-sm text-body-md">
          Select a conversation from the sidebar to start chatting or create a new message.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-md">
          <button
            type="button"
            onClick={() => {
              setInitialTab('dm')
              setOpen(true)
            }}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center hover:shadow-md transition-shadow cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary mb-2">edit_square</span>
            <span className="text-label-md text-slate-700">New Message</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInitialTab('group')
              setOpen(true)
            }}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center hover:shadow-md transition-shadow cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary mb-2">group_add</span>
            <span className="text-label-md text-slate-700">Create Group</span>
          </button>
        </div>
      </section>

      {open && <NewRoomModal initialTab={initialTab} onClose={() => setOpen(false)} />}
    </>
  )
}
