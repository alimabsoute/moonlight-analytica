import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getKpis, getSeriesCsv, parseSeries } from '../api';
import ChartCard from '../components/ChartCard';
import ErrorBanner from '../components/ErrorBanner';
import Loading from '../components/Loading';
import './Reports.css';

export default function Reports() {
  const [reportType, setReportType] = useState('daily'); // 'daily' or 'weekly'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      const hours = reportType === 'daily' ? 24 : 168;
      const [kpiData, csvData] = await Promise.all([
        getKpis(hours),
        getSeriesCsv(hours)
      ]);

      const series = parseSeries(csvData);
      setData({ kpis: kpiData, series });
    } catch (err) {
      setError(err.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [reportType]);

  const getTop5BusiestHours = () => {
    if (!data?.series || data.series.length === 0) return [];

    const sorted = [...data.series].sort((a, b) => b.count_value - a.count_value);
    return sorted.slice(0, 5).map(item => ({
      time: new Date(item.ts).toLocaleString(),
      count: item.count_value
    }));
  };

  const getDailySummary = () => {
    if (!data?.kpis) return null;

    return {
      totalEvents: data.kpis.total_events || 0,
      avgCount: (data.kpis.avg_count || 0).toFixed(1),
      peakCount: data.kpis.peak_count || 0,
      throughput: (data.kpis.throughput || 0).toFixed(2)
    };
  };

  const getWeeklySummary = () => {
    if (!data?.series || data.series.length === 0) return null;

    // Group by day
    const days = {};
    data.series.forEach(item => {
      const date = new Date(item.ts).toLocaleDateString();
      if (!days[date]) {
        days[date] = { total: 0, count: 0, peak: 0 };
      }
      days[date].total += item.count_value;
      days[date].count += 1;
      days[date].peak = Math.max(days[date].peak, item.count_value);
    });

    return Object.entries(days).map(([date, stats]) => ({
      date,
      average: (stats.total / stats.count).toFixed(1),
      peak: stats.peak,
      events: stats.count
    }));
  };

  if (loading) {
    return <Loading message="Generating report..." />;
  }

  const summary = reportType === 'daily' ? getDailySummary() : null;
  const weeklyData = reportType === 'weekly' ? getWeeklySummary() : null;
  const top5 = getTop5BusiestHours();

  return (
    <div className="reports">
      <div className="page-header">
        <h1>Reports</h1>
        <div className="report-type-selector">
          <button
            className={`report-type-btn ${reportType === 'daily' ? 'active' : ''}`}
            onClick={() => setReportType('daily')}
          >
            Daily
          </button>
          <button
            className={`report-type-btn ${reportType === 'weekly' ? 'active' : ''}`}
            onClick={() => setReportType('weekly')}
          >
            Weekly
          </button>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {reportType === 'daily' && summary && (
        <div className="report-summary">
          <h2>Daily Summary (Last 24 Hours)</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">Total Events</div>
              <div className="summary-value">{summary.totalEvents}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Average Count</div>
              <div className="summary-value">{summary.avgCount}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Peak Count</div>
              <div className="summary-value">{summary.peakCount}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Throughput</div>
              <div className="summary-value">{summary.throughput}/hr</div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'weekly' && weeklyData && (
        <ChartCard title="Weekly Summary (Last 7 Days)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="average" fill="#007bff" name="Average" />
              <Bar dataKey="peak" fill="#dc3545" name="Peak" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ChartCard title={`Top 5 Busiest Hours (${reportType === 'daily' ? 'Last 24h' : 'Last 7d'})`}>
        {top5.length === 0 ? (
          <div className="no-data">No data available</div>
        ) : (
          <div className="top5-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Time</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {top5.map((item, idx) => (
                  <tr key={idx}>
                    <td className="rank-cell">#{idx + 1}</td>
                    <td>{item.time}</td>
                    <td className="count-cell">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
