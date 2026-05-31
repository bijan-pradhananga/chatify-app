import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function ChatRoomHeader({
  roomName,
  roomInitials,
  roomType,
  onBack,
}: {
  roomName: string
  roomInitials: string
  roomType: 'dm' | 'group'
  onBack: () => void
}) {
  return (
    <header className="bg-white border-b border-slate-200 flex items-center justify-between px-6 py-3 shadow-sm z-10">
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
          <h1 className="text-slate-900 text-headline-md tracking-tight truncate">{roomName}</h1>
          <p className="text-slate-500 text-label-md">{roomType === 'dm' ? 'Online' : 'Group Chat'}</p>
        </div>
      </div>

      <div className="flex items-center space-x-1">
        <Button variant="ghost" size="icon" className="rounded-full text-slate-500">
          <span className="material-symbols-outlined">more_vert</span>
        </Button>
      </div>
    </header>
  )
}
