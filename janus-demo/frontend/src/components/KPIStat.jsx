import './KPIStat.css';

export default function KPIStat({ label, value, unit = '', trend = null }) {
  return (
    <div className="kpi-stat">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value}
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      {trend !== null && (
        <div className={`kpi-trend ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
