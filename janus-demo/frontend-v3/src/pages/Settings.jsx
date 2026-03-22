import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sun, Moon, Bell, Shield, Database, Globe, Key,
  Mail, Smartphone, Monitor, Save, RefreshCw, AlertTriangle,
  Check, ChevronRight, Building2
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { getIndustryList } from '../../../shared/industryKPIs'

function SettingSection({ title, description, icon: Icon, children, delay }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          flexShrink: 0
        }}>
          <Icon size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>{title}</h3>
          <p style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  )
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          background: checked ? 'var(--navy)' : 'var(--bg-tertiary)',
          border: `2px solid ${checked ? 'var(--navy)' : 'var(--border)'}`,
          position: 'relative',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
      >
        <motion.div
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: '1px',
            left: '1px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
      </div>
    </label>
  )
}

function ThresholdSlider({ label, value, onChange, min, max, unit, warning, critical }) {
  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.813rem', fontWeight: '600', color: 'var(--navy)' }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{ width: '100%' }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        marginTop: '4px'
      }}>
        <span>{min}{unit}</span>
        {warning && <span style={{ color: 'var(--warning)' }}>Warning: {warning}{unit}</span>}
        {critical && <span style={{ color: 'var(--danger)' }}>Critical: {critical}{unit}</span>}
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

const SETTINGS_KEY = 'janus_settings'

const defaultSettings = {
  // Notifications
  emailAlerts: true,
  pushNotifications: true,
  smsAlerts: false,
  weeklyDigest: true,

  // Thresholds
  capacityWarning: 70,
  capacityCritical: 90,
  dwellTimeAlert: 30,

  // API
  apiEndpoint: 'http://localhost:8000',
  refreshInterval: 5,

  // Data
  retentionDays: 90,
  autoArchive: true,
  anonymization: true,

  // Industry
  industry: 'generic'
}

function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return defaultSettings
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const { addToast } = useToast()

  const [settings, setSettings] = useState(loadSettings)
  const [backendStatus, setBackendStatus] = useState(null) // null=unknown, true=connected, false=disconnected

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      addToast('Settings saved successfully', 'success')
    } catch (e) {
      addToast('Failed to save settings', 'error')
    }
  }

  const checkBackendConnection = async () => {
    try {
      const res = await fetch(`${settings.apiEndpoint}/health`, { signal: AbortSignal.timeout(3000) })
      setBackendStatus(res.ok)
    } catch {
      setBackendStatus(false)
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your dashboard preferences and system settings</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} />
          Save Changes
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-lg)' }}>
        {/* Appearance */}
        <SettingSection
          title="Appearance"
          description="Customize the look and feel of your dashboard"
          icon={Monitor}
          delay={0}
        >
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-lg)'
          }}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => theme !== 'light' && toggleTheme()}
              style={{
                flex: 1,
                padding: 'var(--space-lg)',
                background: theme === 'light' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                border: `2px solid ${theme === 'light' ? 'var(--navy)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <Sun size={24} color={theme === 'light' ? 'var(--gold)' : 'var(--text-muted)'} />
              <div style={{ fontSize: '0.875rem', fontWeight: '500', marginTop: 'var(--space-sm)' }}>Light</div>
              {theme === 'light' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: 'var(--space-xs)',
                  fontSize: '0.7rem',
                  color: 'var(--success)'
                }}>
                  <Check size={12} />
                  Active
                </div>
              )}
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => theme !== 'dark' && toggleTheme()}
              style={{
                flex: 1,
                padding: 'var(--space-lg)',
                background: theme === 'dark' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                border: `2px solid ${theme === 'dark' ? 'var(--navy)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <Moon size={24} color={theme === 'dark' ? 'var(--gold)' : 'var(--text-muted)'} />
              <div style={{ fontSize: '0.875rem', fontWeight: '500', marginTop: 'var(--space-sm)' }}>Dark</div>
              {theme === 'dark' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: 'var(--space-xs)',
                  fontSize: '0.7rem',
                  color: 'var(--success)'
                }}>
                  <Check size={12} />
                  Active
                </div>
              )}
            </motion.div>
          </div>
        </SettingSection>

        {/* Industry Preset */}
        <SettingSection
          title="Industry Preset"
          description="Select your industry for tailored KPIs and insights"
          icon={Building2}
          delay={1}
        >
          <select
            className="input"
            value={settings.industry}
            onChange={(e) => setSettings(prev => ({ ...prev, industry: e.target.value }))}
            style={{ marginBottom: 'var(--space-md)' }}
          >
            {getIndustryList().map(ind => (
              <option key={ind.id} value={ind.id}>{ind.name}</option>
            ))}
          </select>
          <div style={{
            padding: 'var(--space-md)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.813rem'
          }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Selected preset includes:</div>
            <div style={{ color: 'var(--text-primary)' }}>
              15+ industry-specific KPIs
            </div>
          </div>
        </SettingSection>

        {/* Notifications */}
        <SettingSection
          title="Notifications"
          description="Manage how you receive alerts and updates"
          icon={Bell}
          delay={2}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <ToggleSwitch
              label="Email alerts for critical events"
              checked={settings.emailAlerts}
              onChange={(v) => setSettings(prev => ({ ...prev, emailAlerts: v }))}
            />
            <ToggleSwitch
              label="Push notifications"
              checked={settings.pushNotifications}
              onChange={(v) => setSettings(prev => ({ ...prev, pushNotifications: v }))}
            />
            <ToggleSwitch
              label="SMS alerts (premium)"
              checked={settings.smsAlerts}
              onChange={(v) => setSettings(prev => ({ ...prev, smsAlerts: v }))}
            />
            <ToggleSwitch
              label="Weekly performance digest"
              checked={settings.weeklyDigest}
              onChange={(v) => setSettings(prev => ({ ...prev, weeklyDigest: v }))}
            />
          </div>
        </SettingSection>

        {/* Alert Thresholds */}
        <SettingSection
          title="Alert Thresholds"
          description="Configure when to trigger capacity and dwell alerts"
          icon={AlertTriangle}
          delay={3}
        >
          <ThresholdSlider
            label="Capacity Warning Level"
            value={settings.capacityWarning}
            onChange={(v) => setSettings(prev => ({ ...prev, capacityWarning: v }))}
            min={50}
            max={95}
            unit="%"
          />
          <ThresholdSlider
            label="Capacity Critical Level"
            value={settings.capacityCritical}
            onChange={(v) => setSettings(prev => ({ ...prev, capacityCritical: v }))}
            min={60}
            max={100}
            unit="%"
          />
          <ThresholdSlider
            label="Dwell Time Alert"
            value={settings.dwellTimeAlert}
            onChange={(v) => setSettings(prev => ({ ...prev, dwellTimeAlert: v }))}
            min={5}
            max={120}
            unit=" min"
          />
        </SettingSection>

        {/* API Configuration */}
        <SettingSection
          title="API Configuration"
          description="Connect to your data sources and APIs"
          icon={Key}
          delay={4}
        >
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px' }}>
              API Endpoint
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input
                type="text"
                className="input"
                value={settings.apiEndpoint}
                onChange={(e) => setSettings(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                style={{ flex: 1 }}
              />
              <button className="btn btn-secondary btn-icon" onClick={checkBackendConnection} title="Test connection">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              className="input"
              value={settings.refreshInterval}
              min={1}
              max={60}
              onChange={(e) => setSettings(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) || 5 }))}
            />
          </div>
          {backendStatus !== null && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              background: backendStatus ? 'rgba(56, 161, 105, 0.1)' : 'rgba(229, 62, 62, 0.1)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: backendStatus ? 'var(--success)' : 'var(--danger)'
            }}>
              {backendStatus ? <Check size={14} /> : <AlertTriangle size={14} />}
              {backendStatus ? 'Connected to backend' : 'Cannot reach backend'}
            </div>
          )}
        </SettingSection>

        {/* Data Management */}
        <SettingSection
          title="Data Management"
          description="Control data retention and privacy settings"
          icon={Database}
          delay={5}
        >
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Data Retention Period
            </label>
            <select
              className="input"
              value={settings.retentionDays}
              onChange={(e) => setSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <ToggleSwitch
              label="Auto-archive old data"
              checked={settings.autoArchive}
              onChange={(v) => setSettings(prev => ({ ...prev, autoArchive: v }))}
            />
            <ToggleSwitch
              label="Data anonymization (GDPR)"
              checked={settings.anonymization}
              onChange={(v) => setSettings(prev => ({ ...prev, anonymization: v }))}
            />
          </div>
        </SettingSection>
      </div>
    </div>
  )
}
