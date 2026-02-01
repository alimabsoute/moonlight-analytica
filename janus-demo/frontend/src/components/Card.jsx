import './Card.css';

/**
 * Unified Card Component
 *
 * @param {string} variant - 'default' | 'stat' | 'chart' | 'info' | 'glass'
 * @param {boolean} hoverable - Adds hover effect
 * @param {boolean} glow - Adds glow effect
 * @param {string} padding - 'none' | 'sm' | 'md' | 'lg'
 */
export default function Card({
  children,
  variant = 'default',
  hoverable = false,
  glow = false,
  padding = 'md',
  className = '',
  ...props
}) {
  const classNames = [
    'card',
    `card-${variant}`,
    `card-padding-${padding}`,
    hoverable && 'card-hoverable',
    glow && 'card-glow',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}

// Card Header
export function CardHeader({ title, subtitle, actions, icon, className = '' }) {
  return (
    <div className={`card-header ${className}`}>
      <div className="card-header-content">
        {icon && <span className="card-header-icon">{icon}</span>}
        <div className="card-header-text">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="card-header-actions">{actions}</div>}
    </div>
  );
}

// Card Content
export function CardContent({ children, className = '' }) {
  return (
    <div className={`card-content ${className}`}>
      {children}
    </div>
  );
}

// Card Footer
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`card-footer ${className}`}>
      {children}
    </div>
  );
}

// Stat Card - For KPI display
export function StatCard({
  label,
  value,
  unit = '',
  trend = null,
  trendLabel = '',
  icon = null,
  variant = 'default',
  size = 'md',
  glow = false,
  animated = false,
  className = ''
}) {
  const trendClass = trend !== null
    ? trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-neutral'
    : '';

  return (
    <div className={`stat-card stat-card-${variant} stat-card-${size} ${glow ? 'stat-card-glow' : ''} ${className}`}>
      <div className="stat-card-header">
        {icon && <span className="stat-card-icon">{icon}</span>}
        <span className="stat-card-label">{label}</span>
      </div>
      <div className={`stat-card-value ${animated ? 'animated' : ''}`}>
        {value}
        {unit && <span className="stat-card-unit">{unit}</span>}
      </div>
      {trend !== null && (
        <div className={`stat-card-trend ${trendClass}`}>
          <span className="trend-arrow">
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
          </span>
          <span className="trend-value">{Math.abs(trend).toFixed(1)}%</span>
          {trendLabel && <span className="trend-label">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

// Hero Stat Card - For prominent metrics
export function HeroStatCard({
  label,
  value,
  unit = '',
  icon = null,
  color = 'primary',
  pulsing = false,
  className = ''
}) {
  return (
    <div className={`hero-stat-card hero-stat-${color} ${pulsing ? 'pulsing' : ''} ${className}`}>
      {icon && <div className="hero-stat-icon">{icon}</div>}
      <div className="hero-stat-content">
        <div className="hero-stat-label">{label}</div>
        <div className="hero-stat-value">
          {value}
          {unit && <span className="hero-stat-unit">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
