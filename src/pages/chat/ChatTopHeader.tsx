import { useState } from 'react'
import { Button } from '@/components/ui/button'
import AddContactModal from '@/features/contacts/AddContactModal'

export default function ChatTopHeader({
  search,
  onSearchChange,
}: {
  search: string
  onSearchChange: (next: string) => void
}) {
  const [openAdd, setOpenAdd] = useState(false)

  return (
    <>
      <header className="flex items-center justify-between px-6 py-3 w-full bg-white border-b border-slate-200">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Chatify</h1>

        <div className="relative w-full max-w-md sm:ml-8 hidden ">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
            search
          </span>
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-200 outline-none"
            placeholder="Search conversations..."
            type="text"
          />
        </div>
      </div>

        <div className="flex items-center space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-500"
            onClick={() => setOpenAdd(true)}
          >
            <span className="material-symbols-outlined">person_add</span>
          </Button>
        </div>
      </header>

      <AddContactModal open={openAdd} onOpenChange={setOpenAdd} />
    </>
  )
}
