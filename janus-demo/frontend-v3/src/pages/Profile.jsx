import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Store, Camera, Clock, Users, Save, RefreshCw,
  Globe, Database, Server, CheckCircle
} from 'lucide-react'

const API = 'http://localhost:8000'

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Toronto', 'Europe/London',
  'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland'
]

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [systemInfo, setSystemInfo] = useState(null)

  useEffect(() => {
    fetchProfile()
    fetchSystemInfo()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API}/api/profile`)
      if (res.ok) {
        setProfile(await res.json())
      }
    } catch (e) {
      console.error('Failed to fetch profile:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSystemInfo = async () => {
    try {
      const [healthRes, videosRes] = await Promise.all([
        fetch(`${API}/health`),
        fetch(`${API}/video/library`)
      ])
      const health = healthRes.ok ? await healthRes.json() : {}
      const videos = videosRes.ok ? await videosRes.json() : { videos: [] }
      setSystemInfo({
        backend_status: health.ok ? 'Online' : 'Offline',
        video_count: videos.videos?.length || 0
      })
    } catch {
      setSystemInfo({ backend_status: 'Offline', video_count: 0 })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      if (res.ok) {
        setProfile(await res.json())
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (e) {
      console.error('Failed to save profile:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--navy)', borderRadius: '50%' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="page-title">Location Profile</h1>
          <p className="page-subtitle">Configure your store and camera settings</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-secondary" onClick={fetchProfile}>
            <RefreshCw size={16} />
            Reset
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {isSaving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Store Settings */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card-header">
            <h3 className="card-title"><Store size={16} /> Store Settings</h3>
          </div>
          <div style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Store Name
              </label>
              <input
                className="input"
                type="text"
                value={profile?.store_name || ''}
                onChange={e => updateField('store_name', e.target.value)}
                style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Capacity
              </label>
              <input
                className="input"
                type="number"
                value={profile?.total_capacity || 100}
                onChange={e => updateField('total_capacity', parseInt(e.target.value) || 0)}
                style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Timezone
              </label>
              <select
                className="input"
                value={profile?.timezone || 'America/New_York'}
                onChange={e => updateField('timezone', e.target.value)}
                style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Camera & Hours */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="card-header">
            <h3 className="card-title"><Camera size={16} /> Camera & Hours</h3>
          </div>
          <div style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Camera Name
              </label>
              <input
                className="input"
                type="text"
                value={profile?.camera_name || ''}
                onChange={e => updateField('camera_name', e.target.value)}
                style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Business Hours Start
                </label>
                <select
                  className="input"
                  value={profile?.business_hours_start ?? 9}
                  onChange={e => updateField('business_hours_start', parseInt(e.target.value))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Business Hours End
                </label>
                <select
                  className="input"
                  value={profile?.business_hours_end ?? 21}
                  onChange={e => updateField('business_hours_end', parseInt(e.target.value))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <Clock size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
                Operating: {(profile?.business_hours_start ?? 9).toString().padStart(2, '0')}:00
                {' '}-{' '}
                {(profile?.business_hours_end ?? 21).toString().padStart(2, '0')}:00
                {' '}({(profile?.business_hours_end ?? 21) - (profile?.business_hours_start ?? 9)}h)
              </span>
            </div>
          </div>
        </motion.div>

        {/* System Info */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3 className="card-title"><Server size={16} /> System Information</h3>
          </div>
          <div style={{
            padding: 'var(--space-xl)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-lg)'
          }}>
            <div style={{ textAlign: 'center', padding: 'var(--space-lg)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <Server size={24} color="var(--navy)" style={{ marginBottom: 'var(--space-sm)' }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Backend</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: systemInfo?.backend_status === 'Online' ? 'var(--success)' : 'var(--danger)' }}>
                {systemInfo?.backend_status || 'Checking...'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--space-lg)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <Database size={24} color="var(--navy)" style={{ marginBottom: 'var(--space-sm)' }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Database</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>SQLite (WAL)</div>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--space-lg)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <Camera size={24} color="var(--navy)" style={{ marginBottom: 'var(--space-sm)' }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Videos</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{systemInfo?.video_count ?? '...'}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--space-lg)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <Globe size={24} color="var(--navy)" style={{ marginBottom: 'var(--space-sm)' }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Version</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>Beta 1.0</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
