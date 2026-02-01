import { useState, useEffect } from "react";
import { useHashTabs } from "./useHashTabs";
import LiveMonitor from "./pages/LiveMonitor";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Heatmap from "./pages/Heatmap";
import ZoneConfig from "./pages/ZoneConfig";
import Settings from "./pages/Settings";
import "./App.css";

const NAV_ITEMS = [
  { id: 'live', label: 'Live Monitor', icon: '📊', description: 'Real-time tracking' },
  { id: 'analytics', label: 'Analytics', icon: '📈', description: 'Deep insights' },
  { id: 'reports', label: 'Reports', icon: '📋', description: 'Export data' },
  { id: 'heatmap', label: 'Heatmap', icon: '🗺️', description: 'Zone analysis' },
  { id: 'zones', label: 'Zone Config', icon: '⚙️', description: 'Configure zones' },
  { id: 'settings', label: 'Settings', icon: '🔧', description: 'Preferences' }
];

export default function App() {
  const [tab, setTab] = useHashTabs("live");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when tab changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [tab]);

  const handleNavClick = (id) => {
    location.hash = `#${id}`;
    setMobileMenuOpen(false);
  };

  const currentNav = NAV_ITEMS.find(item => item.id === tab);

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🔍</span>
            {!sidebarCollapsed && <span className="logo-text">Project Janus</span>}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && (
                <div className="nav-content">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              )}
              {tab === item.id && <div className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <>
              <div className="version-badge">v2.0</div>
              <div className="status-indicator">
                <span className="status-dot" />
                <span className="status-text">All systems operational</span>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="main-wrapper">
        {/* Top Header Bar */}
        <header className="top-header">
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="hamburger" />
          </button>

          <div className="header-content">
            <div className="page-title">
              <span className="page-icon">{currentNav?.icon}</span>
              <h1>{currentNav?.label || 'Dashboard'}</h1>
            </div>
            <div className="header-actions">
              <div className="live-indicator">
                <span className="live-dot" />
                <span>Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          {tab === "live" && <LiveMonitor />}
          {tab === "analytics" && <Analytics />}
          {tab === "reports" && <Reports />}
          {tab === "heatmap" && <Heatmap />}
          {tab === "zones" && <ZoneConfig />}
          {tab === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );
}
