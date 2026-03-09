import { cn } from '../lib/utils';
import './Card.css';

/**
 * Unified Card Component with shadcn/Tailwind styling
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
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-[#374151] bg-[#161e2e] text-white shadow-lg',
        paddingClasses[padding],
        hoverable && 'transition-all hover:border-[#3b82f6] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
        glow && 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
        variant === 'glass' && 'bg-[#161e2e]/80 backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header
export function CardHeader({ title, subtitle, actions, icon, className = '' }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex items-center gap-3">
        {icon && <span className="text-2xl">{icon}</span>}
        <div>
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

// Card Content
export function CardContent({ children, className = '' }) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  );
}

// Card Footer
export function CardFooter({ children, className = '' }) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-[#374151] flex items-center', className)}>
      {children}
    </div>
  );
}

// Stat Card - For KPI display with glass effect
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
  const variantClasses = {
    default: 'border-l-[#6b7280]/60',
    primary: 'border-l-[#3b82f6]/80',
    success: 'border-l-[#10b981]/80',
    warning: 'border-l-[#f59e0b]/80',
    error: 'border-l-[#ef4444]/80'
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5'
  };

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn(
      // Glass morphism
      'rounded-lg border border-l-4 transition-all duration-200',
      'bg-gradient-to-br from-[rgba(30,41,59,0.7)] to-[rgba(22,30,46,0.8)]',
      'backdrop-blur-md border-[#374151]/50',
      'shadow-[0_4px_16px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.03)]',
      'hover:bg-[rgba(30,41,59,0.85)] hover:border-[#374151]',
      variantClasses[variant],
      sizeClasses[size],
      glow && 'shadow-[0_0_20px_rgba(59,130,246,0.12)]',
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-base opacity-60">{icon}</span>}
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className={cn(
        'font-bold text-white tabular-nums',
        valueSizeClasses[size],
        animated && 'animate-[countUp_0.5s_ease-out]'
      )}>
        {value}
        {unit && <span className="text-base font-normal text-gray-400 ml-1">{unit}</span>}
      </div>
      {trend !== null && (
        <div className={cn(
          'mt-2 flex items-center gap-1 text-sm font-medium',
          trend > 0 ? 'text-[#10b981]' : trend < 0 ? 'text-[#ef4444]' : 'text-gray-400'
        )}>
          <span>{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>
          <span>{Math.abs(trend).toFixed(1)}%</span>
          {trendLabel && <span className="text-gray-500 ml-1">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

// Hero Stat Card - For prominent metrics with liquid glass effect
export function HeroStatCard({
  label,
  value,
  unit = '',
  icon = null,
  color = 'primary',
  pulsing = false,
  className = ''
}) {
  const colorClasses = {
    primary: 'border-[#3b82f6]/20 hover:border-[#3b82f6]/40',
    success: 'border-[#10b981]/20 hover:border-[#10b981]/40',
    warning: 'border-[#f59e0b]/20 hover:border-[#f59e0b]/40',
    error: 'border-[#ef4444]/20 hover:border-[#ef4444]/40'
  };

  const iconColorClasses = {
    primary: 'text-[#3b82f6]',
    success: 'text-[#10b981]',
    warning: 'text-[#f59e0b]',
    error: 'text-[#ef4444]'
  };

  const glowClasses = {
    primary: 'hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)]',
    success: 'hover:shadow-[0_8px_32px_rgba(16,185,129,0.15)]',
    warning: 'hover:shadow-[0_8px_32px_rgba(245,158,11,0.15)]',
    error: 'hover:shadow-[0_8px_32px_rgba(239,68,68,0.15)]'
  };

  return (
    <div className={cn(
      // Glass morphism base
      'relative rounded-xl p-5 transition-all duration-300 hover:translate-y-[-2px]',
      'bg-gradient-to-br from-[rgba(30,41,59,0.8)] to-[rgba(22,30,46,0.9)]',
      'backdrop-blur-xl border',
      'shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]',
      colorClasses[color],
      glowClasses[color],
      className
    )}>
      {/* Subtle inner highlight */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {label}
          </div>
          <div className="text-4xl font-bold text-white tabular-nums">
            {value}
            {unit && <span className="text-lg font-normal text-gray-400 ml-1">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className={cn('opacity-70', iconColorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
      {pulsing && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
          </span>
        </div>
      )}
    </div>
  );
}
