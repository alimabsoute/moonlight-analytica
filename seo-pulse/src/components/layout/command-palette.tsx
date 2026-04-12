import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Globe,
  Search,
  TrendingUp,
  ShieldCheck,
  Users,
  FileEdit,
  Activity,
  FileBarChart,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useUIStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  label: string
  icon: LucideIcon
  path: string
  keywords: string[]
}

const commands: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', keywords: ['home', 'overview', 'kpi'] },
  { id: 'explorer', label: 'Site Explorer', icon: Globe, path: '/explorer', keywords: ['domain', 'site', 'analyze'] },
  { id: 'keywords', label: 'Keyword Research', icon: Search, path: '/keywords', keywords: ['keyword', 'research', 'discover'] },
  { id: 'rank-tracker', label: 'Rank Tracker', icon: TrendingUp, path: '/rank-tracker', keywords: ['rank', 'position', 'track'] },
  { id: 'site-audit', label: 'Site Audit', icon: ShieldCheck, path: '/site-audit', keywords: ['audit', 'health', 'technical'] },
  { id: 'competitors', label: 'Competitors', icon: Users, path: '/competitors', keywords: ['competitor', 'compare', 'gap'] },
  { id: 'content-editor', label: 'Content Editor', icon: FileEdit, path: '/content-editor', keywords: ['content', 'write', 'optimize'] },
  { id: 'pulse-lab', label: 'Pulse Lab', icon: Activity, path: '/pulse-lab', keywords: ['pulse', 'trend', 'predict'] },
  { id: 'reports', label: 'Reports', icon: FileBarChart, path: '/reports', keywords: ['report', 'export', 'pdf'] },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', keywords: ['settings', 'billing', 'account'] },
]

export function CommandPalette() {
  const open = useUIStore(s => s.commandPaletteOpen)
  const toggle = useUIStore(s => s.toggleCommandPalette)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const filtered = commands.filter(cmd => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords.some(k => k.includes(q))
    )
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  function handleSelect(path: string) {
    navigate(path)
    toggle()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex].path)
    } else if (e.key === 'Escape') {
      toggle()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={toggle} />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, commands..."
            className="flex-1 bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd.path)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  i === selectedIndex
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                <cmd.icon className="h-4 w-4 shrink-0" />
                <span>{cmd.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
