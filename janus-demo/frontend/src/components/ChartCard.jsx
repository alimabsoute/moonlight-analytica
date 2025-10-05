import './ChartCard.css';

export default function ChartCard({ title, children, actions = null }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
        {actions && <div className="chart-card-actions">{actions}</div>}
      </div>
      <div className="chart-card-content">
        {children}
      </div>
    </div>
  );
}
