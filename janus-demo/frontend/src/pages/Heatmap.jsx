import { useState, useEffect, useRef } from 'react';
import { getZones, getDwellTime } from '../api';
import ChartCard from '../components/ChartCard';
import TimeRangePicker from '../components/TimeRangePicker';
import ErrorBanner from '../components/ErrorBanner';
import Loading from '../components/Loading';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Heatmap.css';

export default function Heatmap() {
  const [timeRange, setTimeRange] = useState(168); // 7 days default
  const [zonesData, setZonesData] = useState(null);
  const [dwellData, setDwellData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const [zones, dwell] = await Promise.all([
        getZones(timeRange),
        getDwellTime(timeRange)
      ]);
      setZonesData(zones);
      setDwellData(dwell);
    } catch (err) {
      setError(err.message || 'Failed to fetch heatmap data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  // Draw heatmap on canvas
  useEffect(() => {
    if (!zonesData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Define zone positions (matching zones.json)
    const zonePositions = {
      'entrance': { x1: 0, y1: 0, x2: 200, y2: 480 },
      'main_floor': { x1: 200, y1: 0, x2: 440, y2: 480 },
      'queue': { x1: 440, y1: 240, x2: 540, y2: 480 },
      'checkout': { x1: 540, y1: 0, x2: 640, y2: 480 }
    };

    // Find max traffic for normalization
    const zones = zonesData.zones || [];
    const maxTraffic = Math.max(...zones.map(z => z.unique_visitors || 0), 1);

    // Draw heatmap zones
    zones.forEach(zone => {
      const pos = zonePositions[zone.zone];
      if (!pos) return;

      const intensity = (zone.unique_visitors || 0) / maxTraffic;

      // Color gradient from blue (low) to red (high)
      let r, g, b;
      if (intensity < 0.5) {
        // Blue to Yellow
        r = Math.floor(intensity * 2 * 255);
        g = Math.floor(intensity * 2 * 255);
        b = 255 - Math.floor(intensity * 2 * 255);
      } else {
        // Yellow to Red
        r = 255;
        g = 255 - Math.floor((intensity - 0.5) * 2 * 255);
        b = 0;
      }

      // Draw zone with heat color
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
      ctx.fillRect(pos.x1, pos.y1, pos.x2 - pos.x1, pos.y2 - pos.y1);

      // Draw border
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(pos.x1, pos.y1, pos.x2 - pos.x1, pos.y2 - pos.y1);

      // Draw zone label and stats
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(zone.zone, pos.x1 + 10, pos.y1 + 25);

      ctx.font = '14px Arial';
      ctx.fillText(`Visitors: ${zone.unique_visitors || 0}`, pos.x1 + 10, pos.y1 + 45);
      ctx.fillText(`Events: ${zone.total_events || 0}`, pos.x1 + 10, pos.y1 + 65);

      // Draw intensity percentage
      ctx.font = 'bold 24px Arial';
      const centerX = (pos.x1 + pos.x2) / 2;
      const centerY = (pos.y1 + pos.y2) / 2;
      ctx.fillText(`${Math.round(intensity * 100)}%`, centerX - 30, centerY);
    });

    // Draw legend
    const legendY = height - 60;
    const legendWidth = 300;
    const legendX = (width - legendWidth) / 2;

    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText('Traffic Intensity', legendX, legendY - 10);

    // Gradient bar
    const gradient = ctx.createLinearGradient(legendX, 0, legendX + legendWidth, 0);
    gradient.addColorStop(0, 'rgb(0, 0, 255)');
    gradient.addColorStop(0.5, 'rgb(255, 255, 0)');
    gradient.addColorStop(1, 'rgb(255, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(legendX, legendY, legendWidth, 20);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, 20);

    ctx.fillStyle = '#fff';
    ctx.font = '11px Arial';
    ctx.fillText('Low', legendX - 25, legendY + 15);
    ctx.fillText('High', legendX + legendWidth + 5, legendY + 15);

  }, [zonesData]);

  // Build dwell time histogram data
  const buildDwellHistogram = () => {
    if (!dwellData || !dwellData.distribution) return [];

    const dist = dwellData.distribution;
    return [
      { range: '< 1 min', count: dist.under_1min || 0, color: '#F44336' },
      { range: '1-5 min', count: dist['1_to_5min'] || 0, color: '#FF9800' },
      { range: '5-15 min', count: dist['5_to_15min'] || 0, color: '#FFC107' },
      { range: '15-30 min', count: dist['15_to_30min'] || 0, color: '#4CAF50' },
      { range: '> 30 min', count: dist.over_30min || 0, color: '#2196F3' }
    ];
  };

  if (loading) {
    return <Loading message="Loading heatmap data..." />;
  }

  const histogramData = buildDwellHistogram();

  return (
    <div className="heatmap">
      <div className="page-header">
        <h1>Zone Heatmap & Dwell Analysis</h1>
        <p>Visual representation of traffic patterns and visitor behavior</p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div className="time-range-section">
        <TimeRangePicker value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="heatmap-grid">
        <ChartCard title="Traffic Heatmap" className="heatmap-card">
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="heatmap-canvas"
          />
        </ChartCard>

        <ChartCard title="Zone Statistics" className="stats-card">
          <div className="zone-stats-list">
            {zonesData?.zones?.map((zone, idx) => (
              <div key={idx} className="zone-stat-item">
                <div className="zone-stat-header">
                  <h4>{zone.zone}</h4>
                  <span className="zone-capacity">Capacity: {zone.capacity}</span>
                </div>
                <div className="zone-stat-metrics">
                  <div className="metric">
                    <span className="metric-label">Unique Visitors</span>
                    <span className="metric-value">{zone.unique_visitors || 0}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Total Events</span>
                    <span className="metric-value">{zone.total_events || 0}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Avg per Visitor</span>
                    <span className="metric-value">
                      {zone.unique_visitors > 0
                        ? (zone.total_events / zone.unique_visitors).toFixed(1)
                        : '0'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Dwell Time Distribution">
        <div className="dwell-summary">
          <div className="dwell-stat">
            <span className="dwell-label">Average Dwell Time</span>
            <span className="dwell-value">
              {dwellData ? `${Math.floor(dwellData.avg_dwell_seconds / 60)}m ${dwellData.avg_dwell_seconds % 60}s` : '0m'}
            </span>
          </div>
          <div className="dwell-stat">
            <span className="dwell-label">Median</span>
            <span className="dwell-value">
              {dwellData ? `${Math.floor(dwellData.median_dwell_seconds / 60)}m` : '0m'}
            </span>
          </div>
          <div className="dwell-stat">
            <span className="dwell-label">Min</span>
            <span className="dwell-value">
              {dwellData ? `${dwellData.min_dwell_seconds}s` : '0s'}
            </span>
          </div>
          <div className="dwell-stat">
            <span className="dwell-label">Max</span>
            <span className="dwell-value">
              {dwellData ? `${Math.floor(dwellData.max_dwell_seconds / 60)}m` : '0m'}
            </span>
          </div>
          <div className="dwell-stat">
            <span className="dwell-label">Total Sessions</span>
            <span className="dwell-value">{dwellData?.total_sessions || 0}</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#007bff" name="Sessions">
              {histogramData.map((entry, index) => (
                <Bar key={`bar-${index}`} dataKey="count" fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
