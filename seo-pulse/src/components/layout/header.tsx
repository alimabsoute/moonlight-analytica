import { useLocation } from 'react-router-dom'
import {
  Sun,
  Moon,
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { DateRangePicker } from '@/components/date-picker/date-range-picker'
import { cn } from '@/lib/utils'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/explorer': 'Site Explorer',
  '/keywords': 'Keyword Research',
  '/rank-tracker': 'Rank Tracker',
  '/site-audit': 'Site Audit',
  '/competitors': 'Competitors',
  '/content-editor': 'Content Editor',
  '/pulse-lab': 'Pulse Lab',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

export function Header() {
  const location = useLocation()
  const theme = useUIStore(s => s.theme)
  const toggleTheme = useUIStore(s => s.toggleTheme)
  const toggleCommandPalette = useUIStore(s => s.toggleCommandPalette)
  const user = useAuthStore(s => s.user)
  const pageTitle = pageTitles[location.pathname] ?? 'Caposeo'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/60 px-6 backdrop-blur-md">
      {/* Left: Page Title */}
      <h1 className="text-base font-semibold tracking-tight text-foreground">{pageTitle}</h1>

      {/* Center: Date Range Picker */}
      <div className="hidden md:block">
        <DateRangePicker />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Search / Command Palette */}
        <button
          onClick={toggleCommandPalette}
          className="flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground hover:text-foreground hover:border-metallic-light transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden lg:inline text-xs">Search...</span>
          <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-metallic lg:inline">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-steel" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* User Avatar */}
        <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent transition-colors">
          <div className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
            'bg-steel/15 text-steel'
          )}>
            {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <ChevronDown className="h-3 w-3 text-metallic" />
        </button>
      </div>
    </header>
  )
}
