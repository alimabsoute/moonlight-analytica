import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { getKpis, getSeriesCsv, parseSeries, getConversion, getDwellTime, getZones, getEntriesExits, getOccupancy, getQueue } from '../api';
import KPIStat from '../components/KPIStat';
import ChartCard from '../components/ChartCard';
import ErrorBanner from '../components/ErrorBanner';
import Loading from '../components/Loading';
import './Analytics.css';

const TIME_RANGES = [
  { label: '1 Hour', hours: 1 },
  { label: '6 Hours', hours: 6 },
  { label: '24 Hours', hours: 24 },
  { label: '7 Days', hours: 168 },
  { label: '30 Days', hours: 720 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function Analytics() {
  const [selectedRange, setSelectedRange] = useState(24);
  const [compareRange, setCompareRange] = useState(null);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async (hours) => {
    try {
      const [kpiData, csvData, convData, dwellData, zonesData, entriesExitsData, occupancyData, queueData] = await Promise.all([
        getKpis(hours),
        getSeriesCsv(hours),
        getConversion(hours),
        getDwellTime(hours),
        getZones(hours),
        getEntriesExits(hours),
        getOccupancy(),
        getQueue(hours)
      ]);

      return {
        kpis: kpiData,
        series: parseSeries(csvData),
        conversion: convData,
        dwellTime: dwellData,
        zones: zonesData,
        entriesExits: entriesExitsData,
        occupancy: occupancyData,
        queue: queueData
      };
    } catch (err) {
      console.error('Error fetching data:', err);
      return null;
    }
  };

  const loadAllData = async () => {
    try {
      setError(null);
      setLoading(true);
      const results = {};

      results[selectedRange] = await fetchData(selectedRange);

      if (compareRange) {
        results[compareRange] = await fetchData(compareRange);
      }

      setData(results);
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedRange, compareRange]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedRange, compareRange]);

  if (loading) {
    return <Loading message="Loading comprehensive analytics..." />;
  }

  const primaryData = data[selectedRange];

  if (!primaryData) {
    return <div className="analytics"><ErrorBanner message="No data available" /></div>;
  }

  const dwellMinutes = primaryData.dwellTime ? (primaryData.dwellTime.avg_dwell_seconds / 60) : 0;
  const medianDwellMinutes = primaryData.dwellTime ? (primaryData.dwellTime.median_dwell_seconds / 60) : 0;
  const maxDwellMinutes = primaryData.dwellTime ? (primaryData.dwellTime.max_dwell_seconds / 60) : 0;

  const totalTraffic = (primaryData.entriesExits?.entries || 0) + (primaryData.entriesExits?.exits || 0);
  const trafficBalance = primaryData.entriesExits?.net_traffic || 0;

  const currentOccupancy = primaryData.occupancy?.current_occupancy || 0;
  const totalCapacity = primaryData.occupancy?.total_capacity || 1;
  const occupancyRate = primaryData.occupancy?.occupancy_rate || 0;

  const queueLength = primaryData.queue?.current_queue_length || 0;
  const avgWaitMinutes = primaryData.queue ? (primaryData.queue.avg_wait_seconds / 60) : 0;

  const totalSessions = primaryData.conversion?.total_sessions || 0;
  const conversions = primaryData.conversion?.conversions || 0;
  const conversionRate = primaryData.conversion?.conversion_rate || 0;
  const bounceRate = primaryData.conversion?.bounce_rate || 0;
  const engagementRate = primaryData.conversion?.engagement_rate || 0;

  const dwellDistribution = primaryData.dwellTime?.distribution ? [
    { name: '<1min (Bounced)', value: primaryData.dwellTime.distribution.under_1min },
    { name: '1-5min (Quick)', value: primaryData.dwellTime.distribution['1_to_5min'] },
    { name: '5-15min (Browse)', value: primaryData.dwellTime.distribution['5_to_15min'] },
    { name: '15-30min (Shop)', value: primaryData.dwellTime.distribution['15_to_30min'] },
    { name: '30min+ (Deep)', value: primaryData.dwellTime.distribution.over_30min }
  ] : [];

  const zonePerformance = primaryData.zones?.zones ? primaryData.zones.zones.map(zone => ({
    zone: zone.zone,
    visitors: zone.unique_visitors || 0,
    events: zone.total_events || 0,
    utilization: zone.capacity > 0 ? ((zone.unique_visitors / zone.capacity) * 100).toFixed(1) : 0
  })) : [];

  const conversionFunnel = [
    { stage: 'Visitors', count: totalSessions, percentage: 100 },
    { stage: 'Engaged (5m+)', count: Math.round(totalSessions * engagementRate / 100), percentage: engagementRate },
    { stage: 'Converted', count: conversions, percentage: conversionRate }
  ];

  const buildComparisonData = () => {
    if (!compareRange || !data[compareRange]) return [];

    const primarySeries = primaryData.series || [];
    const compareSeries = data[compareRange].series || [];

    const maxLen = Math.max(primarySeries.length, compareSeries.length);
    const result = [];

    for (let i = 0; i < maxLen; i++) {
      result.push({
        index: i,
        current: primarySeries[i]?.count_value || 0,
        previous: compareSeries[i]?.count_value || 0
      });
    }

    return result;
  };

  return (
    <div className="analytics">
      <div className="page-header">
        <div>
          <h1>📊 Advanced Analytics Dashboard</h1>
          <p>Comprehensive real-time visitor analytics with 26+ KPIs</p>
        </div>
        <div className="header-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (30s)
          </label>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div className="range-selector">
        <div className="range-group">
          <label>Primary Range:</label>
          <div className="range-buttons">
            {TIME_RANGES.map(({ label, hours }) => (
              <button
                key={hours}
                className={`range-btn ${selectedRange === hours ? 'active' : ''}`}
                onClick={() => setSelectedRange(hours)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="range-group">
          <label>Compare To:</label>
          <div className="range-buttons">
            <button
              className={`range-btn ${compareRange === null ? 'active' : ''}`}
              onClick={() => setCompareRange(null)}
            >
              None
            </button>
            {TIME_RANGES.filter(r => r.hours !== selectedRange).map(({ label, hours }) => (
              <button
                key={hours}
                className={`range-btn ${compareRange === hours ? 'active' : ''}`}
                onClick={() => setCompareRange(hours)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="kpi-section">
        <h2>🎯 Key Performance Indicators</h2>
        <div className="kpi-grid-5col">
          <KPIStat label="Total Entries" value={primaryData.entriesExits?.entries || 0} />
          <KPIStat label="Total Exits" value={primaryData.entriesExits?.exits || 0} />
          <KPIStat label="Net Traffic" value={trafficBalance} />
          <KPIStat label="Total Sessions" value={totalSessions} />
          <KPIStat label="Total Traffic" value={totalTraffic} />

          <KPIStat label="Current Occupancy" value={currentOccupancy} />
          <KPIStat label="Total Capacity" value={totalCapacity} />
          <KPIStat label="Occupancy Rate" value={`${occupancyRate}%`} />
          <KPIStat label="Available Space" value={Math.max(0, totalCapacity - currentOccupancy)} />
          <KPIStat label="Utilization" value={`${((currentOccupancy / totalCapacity) * 100).toFixed(1)}%`} />

          <KPIStat label="Avg Dwell Time" value={`${dwellMinutes.toFixed(1)}m`} />
          <KPIStat label="Median Dwell" value={`${medianDwellMinutes.toFixed(1)}m`} />
          <KPIStat label="Max Dwell Time" value={`${maxDwellMinutes.toFixed(1)}m`} />
          <KPIStat label="Min Dwell Time" value={`${(primaryData.dwellTime?.min_dwell_seconds / 60 || 0).toFixed(1)}m`} />
          <KPIStat label="Dwell Samples" value={primaryData.dwellTime?.total_sessions || 0} />

          <KPIStat label="Conversions" value={conversions} />
          <KPIStat label="Conversion Rate" value={`${conversionRate}%`} />
          <KPIStat label="Bounce Rate" value={`${bounceRate}%`} />
          <KPIStat label="Engagement Rate" value={`${engagementRate}%`} />
          <KPIStat label="Non-Converters" value={totalSessions - conversions} />

          <KPIStat label="Queue Length" value={queueLength} />
          <KPIStat label="Avg Wait Time" value={`${avgWaitMinutes.toFixed(1)}m`} />
          <KPIStat label="Total Queued" value={primaryData.queue?.total_queued || 0} />

          <KPIStat label="Avg Traffic" value={(primaryData.kpis?.avg_count || 0).toFixed(1)} />
          <KPIStat label="Peak Traffic" value={primaryData.kpis?.peak_count || 0} />
          <KPIStat label="Throughput" value={primaryData.kpis?.throughput || 0} unit="/hr" />
        </div>
      </div>

      <div className="charts-section">
        <h2>🏢 Zone Performance Analysis</h2>
        <div className="chart-row">
          <ChartCard title="Zone Traffic - Unique Visitors">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zonePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="visitors" fill="#0088FE" name="Unique Visitors" />
                <Bar dataKey="events" fill="#00C49F" name="Total Events" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Zone Utilization Radar">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={zonePerformance}>
                <PolarGrid />
                <PolarAngleAxis dataKey="zone" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Utilization %" dataKey="utilization" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {primaryData.occupancy?.zones && (
          <ChartCard title="Real-Time Zone Occupancy">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={primaryData.occupancy.zones}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill="#FF8042" name="Current Count" />
                <Bar dataKey="capacity" fill="#FFBB28" name="Capacity" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      <div className="charts-section">
        <h2>⏱️ Dwell Time Distribution</h2>
        <div className="chart-row">
          <ChartCard title="Dwell Time Breakdown (Session Count)">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dwellDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dwellDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Dwell Time Distribution (Bar)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dwellDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <div className="charts-section">
        <h2>🔄 Conversion Funnel Analysis</h2>
        <ChartCard title="Visitor Journey Funnel">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionFunnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="charts-section">
        <h2>📈 Traffic Trends</h2>
        {compareRange && data[compareRange] ? (
          <ChartCard title={`Traffic Comparison: ${TIME_RANGES.find(r => r.hours === selectedRange)?.label} vs ${TIME_RANGES.find(r => r.hours === compareRange)?.label}`}>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={buildComparisonData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" label={{ value: 'Time Period', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Traffic Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="current" stroke="#0088FE" strokeWidth={2} name="Current Period" />
                <Line type="monotone" dataKey="previous" stroke="#00C49F" strokeWidth={2} strokeDasharray="5 5" name="Compare Period" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Traffic Time Series">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={primaryData.series || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="count_value" stroke="#8884d8" fill="#8884d8" name="Average Traffic" />
                <Area type="monotone" dataKey="peak" stroke="#82ca9d" fill="#82ca9d" name="Peak Traffic" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      <div className="charts-section">
        <h2>🌊 Traffic Flow Summary</h2>
        <div className="traffic-flow-summary">
          <div className="flow-metric">
            <span className="flow-label">Entries</span>
            <span className="flow-value inbound">{primaryData.entriesExits?.entries || 0}</span>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-metric">
            <span className="flow-label">Total Sessions</span>
            <span className="flow-value">{totalSessions}</span>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-metric">
            <span className="flow-label">Conversions</span>
            <span className="flow-value success">{conversions} ({conversionRate}%)</span>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-metric">
            <span className="flow-label">Exits</span>
            <span className="flow-value outbound">{primaryData.entriesExits?.exits || 0}</span>
          </div>
        </div>
      </div>

      <div className="insights-section">
        <h2>💡 Automated Insights</h2>
        <div className="insights-grid">
          {bounceRate > 40 && (
            <div className="insight-card warning">
              <strong>⚠️ High Bounce Rate</strong>
              <p>{bounceRate.toFixed(1)}% of visitors spend less than 1 minute. Consider improving entrance experience.</p>
            </div>
          )}
          {conversionRate < 20 && totalSessions > 10 && (
            <div className="insight-card alert">
              <strong>🚨 Low Conversion Rate</strong>
              <p>Only {conversionRate.toFixed(1)}% of visitors converted. Analyze zone paths and engagement strategies.</p>
            </div>
          )}
          {queueLength > 10 && (
            <div className="insight-card warning">
              <strong>⏳ Queue Building Up</strong>
              <p>{queueLength} people currently in queue with {avgWaitMinutes.toFixed(1)}m average wait time.</p>
            </div>
          )}
          {occupancyRate > 80 && (
            <div className="insight-card alert">
              <strong>🔴 High Occupancy</strong>
              <p>{occupancyRate.toFixed(1)}% capacity reached. Consider managing traffic flow.</p>
            </div>
          )}
          {engagementRate > 60 && (
            <div className="insight-card success">
              <strong>✅ Strong Engagement</strong>
              <p>{engagementRate.toFixed(1)}% of visitors spend 5+ minutes. Great visitor experience!</p>
            </div>
          )}
          {trafficBalance > 20 && (
            <div className="insight-card info">
              <strong>📊 Net Positive Traffic</strong>
              <p>{trafficBalance} more entries than exits. Active visitor accumulation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
