import { useAppSelector } from '@/app/hooks'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const navItems = [
  { key: 'chat', icon: 'chat', label: 'Chats' },
  { key: 'contacts', icon: 'group', label: 'Contacts' },
  { key: 'settings', icon: 'settings', label: 'Settings' },
] as const

export default function SideNavRail({
  activePage,
  onNavigate,
}: {
  activePage: (typeof navItems)[number]['key']
  onNavigate: (p: (typeof navItems)[number]['key']) => void
}) {
  const user = useAppSelector(s => s.auth.user)
  const initials = (user?.email || '?').slice(0, 2).toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="bg-slate-50 border-r border-slate-200 flex flex-col items-center py-6 w-20 h-screen space-y-8 flex-shrink-0">
        <div className="text-lg font-black text-blue-600">C</div>

        <nav className="flex flex-col space-y-2 w-full px-2 flex-1">
          {navItems.map(item => (
            <Tooltip key={item.key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavigate(item.key)}
                  className={cn(
                    'flex flex-col items-center justify-center py-3 w-full rounded-lg transition-all active:scale-95 duration-200',
                    activePage === item.key ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-200'
                  )}
                >
                  <span
                    className="material-symbols-outlined"
                    style={activePage === item.key ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative focus:outline-none">
                <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-primary-container text-on-primary-container font-bold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-44">
              <DropdownMenuItem onClick={() => onNavigate('settings')}>
                <span className="material-symbols-outlined text-[16px] mr-2">settings</span>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                <span className="material-symbols-outlined text-[16px] mr-2">logout</span>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  )
}
