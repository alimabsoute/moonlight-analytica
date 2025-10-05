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
