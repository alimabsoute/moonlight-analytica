import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, BarChart3, FileText, Map, Settings as SettingsIcon,
  Layers, Sun, Moon, Bell, Brain, TrendingUp, User, Search
} from 'lucide-react'
import { useTheme } from './context/ThemeContext'
import { useToast } from './context/ToastContext'

// Pages
import LiveMonitor from './pages/LiveMonitor'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Heatmap from './pages/Heatmap'
import ZoneConfig from './pages/ZoneConfig'
import Settings from './pages/Settings'
import Insights from './pages/Insights'
import Forecasting from './pages/Forecasting'

const NAV_ITEMS = [
  { id: 'live', label: 'Live Monitor', icon: Activity, badge: null },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: null },
  { id: 'insights', label: 'Insights', icon: Brain, badge: null },
  { id: 'forecasting', label: 'Forecasting', icon: TrendingUp, badge: null },
  { id: 'reports', label: 'Reports', icon: FileText, badge: null },
  { id: 'heatmap', label: 'Heatmap', icon: Map, badge: null },
  { id: 'zones', label: 'Zone Config', icon: Layers, badge: null },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, badge: null }
]

const PAGES = {
  live: LiveMonitor,
  analytics: Analytics,
  insights: Insights,
  forecasting: Forecasting,
  reports: Reports,
  heatmap: Heatmap,
  zones: ZoneConfig,
  settings: Settings
}

export default function App() {
  const [activePage, setActivePage] = useState('live')
  const [isMobile, setIsMobile] = useState(false)
  const [alertCount, setAlertCount] = useState(2)
  const { theme, toggleTheme } = useTheme()
  const { addToast } = useToast()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 8) {
          e.preventDefault()
          setActivePage(NAV_ITEMS[num - 1].id)
        }
        if (e.key === 'd') {
          e.preventDefault()
          toggleTheme()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleTheme])

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.9) {
        setAlertCount(prev => prev + 1)
        addToast('New capacity alert detected', 'warning')
      }
    }, 20000)
    return () => clearInterval(interval)
  }, [addToast])

  const ActivePage = PAGES[activePage]

  const navItems = NAV_ITEMS.map(item => ({
    ...item,
    badge: item.id === 'live' && alertCount > 0 ? alertCount : null
  }))

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">J</div>
              <div>
                <div className="sidebar-logo-text">Janus</div>
                <div className="sidebar-logo-subtitle">Enterprise</div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="nav-section-title">Analytics</div>
              {navItems.slice(0, 6).map((item, index) => (
                <motion.div
                  key={item.id}
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <item.icon size={18} className="nav-item-icon" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="nav-item-badge">{item.badge}</span>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="nav-section">
              <div className="nav-section-title">Administration</div>
              {navItems.slice(6).map((item, index) => (
                <motion.div
                  key={item.id}
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + 6) * 0.03 }}
                >
                  <item.icon size={18} className="nav-item-icon" />
                  <span>{item.label}</span>
                </motion.div>
              ))}
            </div>
          </nav>

          <div className="sidebar-footer">
            <motion.div
              className="nav-item"
              onClick={toggleTheme}
              whileHover={{ x: 4 }}
              style={{ cursor: 'pointer' }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </motion.div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
            {isMobile && (
              <div className="sidebar-logo">
                <div className="sidebar-logo-icon" style={{ width: 32, height: 32, fontSize: '1rem' }}>J</div>
              </div>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  width: '200px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
              <Bell size={18} />
              {alertCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  background: 'var(--danger)',
                  borderRadius: '50%'
                }} />
              )}
            </button>

            {!isMobile && (
              <button className="btn btn-ghost btn-icon" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}>
              <User size={18} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ActivePage />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="mobile-nav">
          <div className="mobile-nav-items">
            {navItems.slice(0, 5).map(item => (
              <motion.div
                key={item.id}
                className={`mobile-nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => setActivePage(item.id)}
                whileTap={{ scale: 0.9 }}
              >
                <item.icon size={20} />
                <span>{item.label.split(' ')[0]}</span>
              </motion.div>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
