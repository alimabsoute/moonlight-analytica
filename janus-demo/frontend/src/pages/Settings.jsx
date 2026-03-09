import { useState, useEffect } from 'react';
import { health, postCount } from '../api';
import ChartCard from '../components/ChartCard';
import ErrorBanner from '../components/ErrorBanner';
import './Settings.css';

export default function Settings() {
  const [preferences, setPreferences] = useState({
    autoRefresh: localStorage.getItem('autoRefresh') !== 'false',
    refreshInterval: parseInt(localStorage.getItem('refreshInterval') || '10'),
    defaultTimeRange: parseFloat(localStorage.getItem('defaultTimeRange') || '1')
  });

  // Tracking configuration state
  const [trackingConfig, setTrackingConfig] = useState({
    model: localStorage.getItem('trackingModel') || 'yolov8n.pt',
    tracker: localStorage.getItem('trackingAlgorithm') || 'bytetrack.yaml',
    confidence: parseFloat(localStorage.getItem('trackingConfidence') || '0.35'),
    useCase: localStorage.getItem('trackingUseCase') || 'custom'
  });

  // Use case presets for B2B analytics scenarios
  const useCasePresets = {
    retail: {
      name: 'Retail / Foot Traffic',
      description: 'Optimized for store entrances, malls, and foot traffic counting',
      model: 'yolo11n.pt',
      tracker: 'bytetrack.yaml',
      confidence: 0.30,
      icon: '🏪'
    },
    restaurant: {
      name: 'Restaurant / Hospitality',
      description: 'Best for table occupancy, seating areas, and turnover tracking',
      model: 'yolo11s.pt',
      tracker: 'botsort.yaml',
      confidence: 0.35,
      icon: '🍽️'
    },
    queue: {
      name: 'Queue Analysis',
      description: 'Optimized for waiting lines, checkout queues, and service areas',
      model: 'yolo11n.pt',
      tracker: 'botsort.yaml',
      confidence: 0.25,
      icon: '🚶'
    },
    office: {
      name: 'Office / Coworking',
      description: 'For lobby traffic, meeting rooms, and desk occupancy',
      model: 'yolo11s.pt',
      tracker: 'bytetrack.yaml',
      confidence: 0.35,
      icon: '🏢'
    },
    venue: {
      name: 'Venue / Events',
      description: 'High-density crowds, event entrances, and flow analysis',
      model: 'yolo11m.pt',
      tracker: 'botsort.yaml',
      confidence: 0.20,
      icon: '🎪'
    },
    custom: {
      name: 'Custom Configuration',
      description: 'Manually configure all settings below',
      icon: '⚙️'
    }
  };

  const [healthStatus, setHealthStatus] = useState(null);
  const [testCount, setTestCount] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const savePreference = (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem(key, value.toString());
    setSuccess('Preferences saved!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const saveTrackingConfig = (key, value) => {
    const newConfig = { ...trackingConfig, [key]: value };
    if (key !== 'useCase') {
      newConfig.useCase = 'custom';
      localStorage.setItem('trackingUseCase', 'custom');
    }
    setTrackingConfig(newConfig);
    const storageKeys = { model: 'trackingModel', tracker: 'trackingAlgorithm', confidence: 'trackingConfidence', useCase: 'trackingUseCase' };
    localStorage.setItem(storageKeys[key], value.toString());
    setSuccess('Tracking configuration updated! Changes apply on next video start.');
    setTimeout(() => setSuccess(null), 3000);
  };

  const applyPreset = (presetKey) => {
    const preset = useCasePresets[presetKey];
    if (!preset || presetKey === 'custom') {
      saveTrackingConfig('useCase', 'custom');
      return;
    }
    const newConfig = { model: preset.model, tracker: preset.tracker, confidence: preset.confidence, useCase: presetKey };
    setTrackingConfig(newConfig);
    localStorage.setItem('trackingModel', preset.model);
    localStorage.setItem('trackingAlgorithm', preset.tracker);
    localStorage.setItem('trackingConfidence', preset.confidence.toString());
    localStorage.setItem('trackingUseCase', presetKey);
    setSuccess(`Applied "${preset.name}" preset! Changes apply on next video start.`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const checkHealth = async () => {
    try {
      setError(null);
      const status = await health();
      setHealthStatus(status);
      setSuccess('Health check successful!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Health check failed');
      setHealthStatus(null);
    }
  };

  const handleTestCount = async (e) => {
    e.preventDefault();
    const value = parseInt(testCount);

    if (isNaN(value) || value < 0) {
      setError('Please enter a valid non-negative number');
      return;
    }

    try {
      setError(null);
      await postCount(value);
      setSuccess(`Test count ${value} posted successfully!`);
      setTestCount('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to post test count');
    }
  };

  const resetPreferences = () => {
    const defaults = {
      autoRefresh: true,
      refreshInterval: 10,
      defaultTimeRange: 1
    };
    setPreferences(defaults);
    localStorage.setItem('autoRefresh', 'true');
    localStorage.setItem('refreshInterval', '10');
    localStorage.setItem('defaultTimeRange', '1');
    setSuccess('Preferences reset to defaults!');
    setTimeout(() => setSuccess(null), 3000);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="settings">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {success && (
        <div className="success-banner">
          <span>✓</span> {success}
        </div>
      )}

      <ChartCard title="User Preferences">
        <div className="preferences-form">
          <div className="preference-item">
            <label className="preference-label">
              <input
                type="checkbox"
                checked={preferences.autoRefresh}
                onChange={(e) => savePreference('autoRefresh', e.target.checked)}
              />
              Enable Auto-Refresh
            </label>
          </div>

          <div className="preference-item">
            <label className="preference-label">
              Refresh Interval (seconds):
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={preferences.refreshInterval}
              onChange={(e) => savePreference('refreshInterval', parseInt(e.target.value) || 10)}
              className="preference-input"
            />
          </div>

          <div className="preference-item">
            <label className="preference-label">
              Default Time Range (hours):
            </label>
            <select
              value={preferences.defaultTimeRange}
              onChange={(e) => savePreference('defaultTimeRange', parseFloat(e.target.value))}
              className="preference-select"
            >
              <option value="0.167">10 minutes</option>
              <option value="0.5">30 minutes</option>
              <option value="1">1 hour</option>
              <option value="24">24 hours</option>
              <option value="168">7 days</option>
            </select>
          </div>

          <button onClick={resetPreferences} className="btn-secondary">
            Reset to Defaults
          </button>
        </div>
      </ChartCard>

      <ChartCard title="Tracking Configuration">
        <div className="preferences-form">
          <div className="use-case-presets">
            <label className="preference-label">Quick Setup - Select Your Use Case:</label>
            <div className="preset-grid">
              {Object.entries(useCasePresets).map(([key, preset]) => (
                <button
                  key={key}
                  className={`preset-card ${trackingConfig.useCase === key ? 'active' : ''}`}
                  onClick={() => applyPreset(key)}
                >
                  <span className="preset-icon">{preset.icon}</span>
                  <span className="preset-name">{preset.name}</span>
                  {key !== 'custom' && (
                    <span className="preset-desc">{preset.description}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="config-divider"><span>Advanced Settings</span></div>

          <div className="preference-item">
            <label className="preference-label">Detection Model:</label>
            <select
              value={trackingConfig.model}
              onChange={(e) => saveTrackingConfig('model', e.target.value)}
              className="preference-select"
            >
              <optgroup label="YOLOv8 (Legacy)">
                <option value="yolov8n.pt">YOLOv8 Nano - Fast (Default)</option>
              </optgroup>
              <optgroup label="YOLOv11 (Recommended)">
                <option value="yolo11n.pt">YOLOv11 Nano - Fast & Accurate</option>
                <option value="yolo11s.pt">YOLOv11 Small - Balanced</option>
                <option value="yolo11m.pt">YOLOv11 Medium - Best Accuracy</option>
              </optgroup>
            </select>
            <p className="preference-help">YOLOv11 models offer better accuracy. Larger models are more accurate but slower.</p>
          </div>

          <div className="preference-item">
            <label className="preference-label">Tracking Algorithm:</label>
            <select
              value={trackingConfig.tracker}
              onChange={(e) => saveTrackingConfig('tracker', e.target.value)}
              className="preference-select"
            >
              <option value="bytetrack.yaml">ByteTrack - Fast (171 FPS)</option>
              <option value="botsort.yaml">BoT-SORT - Accurate (Better Re-ID)</option>
            </select>
            <p className="preference-help">ByteTrack is faster with fewer false positives. BoT-SORT better handles occlusion and re-identification.</p>
          </div>

          <div className="preference-item">
            <label className="preference-label">Detection Confidence: {(trackingConfig.confidence * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={trackingConfig.confidence}
              onChange={(e) => saveTrackingConfig('confidence', parseFloat(e.target.value))}
              className="preference-range"
            />
            <p className="preference-help">Lower = more detections (may include false positives). Higher = fewer but more confident detections.</p>
          </div>

          <div className="tracking-summary">
            <h4>Current Configuration</h4>
            <div className="config-badge">
              <span className="badge-label">Model:</span>
              <span className="badge-value">{trackingConfig.model}</span>
            </div>
            <div className="config-badge">
              <span className="badge-label">Tracker:</span>
              <span className="badge-value">{trackingConfig.tracker.replace('.yaml', '')}</span>
            </div>
            <div className="config-badge">
              <span className="badge-label">Confidence:</span>
              <span className="badge-value">{(trackingConfig.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </ChartCard>

      <ChartCard title="System Health">
        <div className="health-section">
          <button onClick={checkHealth} className="btn-primary">
            Check Health
          </button>

          {healthStatus && (
            <div className="health-status">
              <div className="health-item">
                <span className="health-label">Status:</span>
                <span className={`health-value ${healthStatus.status === 'healthy' ? 'healthy' : 'unhealthy'}`}>
                  {healthStatus.status}
                </span>
              </div>
              {healthStatus.database && (
                <div className="health-item">
                  <span className="health-label">Database:</span>
                  <span className="health-value healthy">Connected</span>
                </div>
              )}
              {healthStatus.timestamp && (
                <div className="health-item">
                  <span className="health-label">Timestamp:</span>
                  <span className="health-value">{new Date(healthStatus.timestamp).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </ChartCard>

      <ChartCard title="Test Utilities">
        <form onSubmit={handleTestCount} className="test-form">
          <label className="test-label">Post Test Count:</label>
          <div className="test-input-group">
            <input
              type="number"
              min="0"
              placeholder="Enter count value"
              value={testCount}
              onChange={(e) => setTestCount(e.target.value)}
              className="test-input"
            />
            <button type="submit" className="btn-primary">
              Post Count
            </button>
          </div>
          <p className="test-help">Use this to manually post a count value for testing purposes.</p>
        </form>
      </ChartCard>
    </div>
  );
}
