import './Button.css';

/**
 * Unified Button Component
 *
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} fullWidth - Makes button full width
 * @param {boolean} loading - Shows loading state
 * @param {boolean} disabled - Disables the button
 * @param {string} icon - Icon to show (emoji or icon component)
 * @param {string} iconPosition - 'left' | 'right'
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  ...props
}) {
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full',
    loading && 'btn-loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="btn-icon">{icon}</span>
      )}
      {children && <span className="btn-text">{children}</span>}
      {!loading && icon && iconPosition === 'right' && (
        <span className="btn-icon">{icon}</span>
      )}
    </button>
  );
}

// Icon Button variant
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  tooltip = '',
  ...props
}) {
  return (
    <button
      className={`btn-icon-only btn-${variant} btn-${size}`}
      title={tooltip}
      {...props}
    >
      {icon}
    </button>
  );
}

// Button Group for related actions
export function ButtonGroup({ children, className = '' }) {
  return (
    <div className={`btn-group ${className}`}>
      {children}
    </div>
  );
}
