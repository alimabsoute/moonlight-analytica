import { NavLink, useLocation } from 'react-router-dom'
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useUIStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  icon: LucideIcon
  path: string
  highlight?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Explorer', icon: Globe, path: '/explorer' },
  { label: 'Keywords', icon: Search, path: '/keywords' },
  { label: 'Rank Tracker', icon: TrendingUp, path: '/rank-tracker' },
  { label: 'Site Audit', icon: ShieldCheck, path: '/site-audit' },
  { label: 'Competitors', icon: Users, path: '/competitors' },
  { label: 'Content Editor', icon: FileEdit, path: '/content-editor' },
  { label: 'Pulse Lab', icon: Activity, path: '/pulse-lab', highlight: true },
  { label: 'Reports', icon: FileBarChart, path: '/reports' },
]

const bottomItems: NavItem[] = [
  { label: 'Settings', icon: Settings, path: '/settings' },
]

export function Sidebar() {
  const collapsed = useUIStore(s => s.sidebarCollapsed)
  const toggleSidebar = useUIStore(s => s.toggleSidebar)
  const location = useLocation()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-dvh flex-col border-r border-border bg-sidebar transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-16 items-center border-b border-border overflow-hidden',
        collapsed ? 'justify-center px-2' : 'px-4'
      )}>
        <img
          src="/caposeo-logo.png"
          alt="Caposeo"
          className={cn(
            'object-contain object-left transition-all duration-200',
            collapsed ? 'h-8 w-8' : 'h-9 w-auto max-w-[180px]'
          )}
        />
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {navItems.map(item => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-accent hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive && 'text-primary',
                  item.highlight && !isActive && 'text-success'
                )}
              />
              {!collapsed && (
                <span className="truncate">
                  {item.label}
                  {item.highlight && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                      NEW
                    </span>
                  )}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t border-border px-2 py-3">
        {bottomItems.map(item => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-accent hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="flex h-10 items-center justify-center border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}
