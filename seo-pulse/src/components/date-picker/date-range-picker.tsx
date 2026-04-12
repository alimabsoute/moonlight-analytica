import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, ChevronDown, ArrowLeftRight } from 'lucide-react'
import { useDateRange } from '@/hooks/useDateRange'
import { cn } from '@/lib/utils'

const presets = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'last-7d' },
  { label: 'Last 14 days', value: 'last-14d' },
  { label: 'Last 28 days', value: 'last-28d' },
  { label: 'Last 30 days', value: 'last-30d' },
  { label: 'Last 90 days', value: 'last-90d' },
  { label: 'This Month', value: 'this-month' },
  { label: 'Last Month', value: 'last-month' },
  { label: 'This Quarter', value: 'this-quarter' },
  { label: 'This Year', value: 'this-year' },
  { label: 'Last Year', value: 'last-year' },
  { label: 'All Time', value: 'all-time' },
] as const

const compareModes = [
  { label: 'Previous Period', value: 'previous-period' as const },
  { label: 'Same Period Last Year', value: 'yoy' as const },
  { label: 'Custom Range', value: 'custom' as const },
]

export function DateRangePicker() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const {
    startDate,
    endDate,
    compareEnabled,
    compareStartDate,
    compareEndDate,
    preset,
    compareMode,
    setPreset,
    toggleCompare,
    setCompareMode,
  } = useDateRange()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const dateLabel = `${format(startDate, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')}`
  const currentPreset = presets.find(p => p.value === preset)

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm transition-colors',
          'hover:border-muted-foreground/50',
          open && 'border-primary ring-1 ring-primary/20'
        )}
      >
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-foreground">
          {currentPreset?.label ?? dateLabel}
        </span>
        {compareEnabled && (
          <>
            <ArrowLeftRight className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground text-xs">vs</span>
          </>
        )}
        <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card p-4 shadow-xl">
          {/* Presets */}
          <div className="mb-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Presets</p>
            <div className="grid grid-cols-2 gap-1">
              {presets.map(p => (
                <button
                  key={p.value}
                  onClick={() => {
                    setPreset(p.value)
                    if (!compareEnabled) setOpen(false)
                  }}
                  className={cn(
                    'rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
                    preset === p.value
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-accent'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range Display */}
          <div className="mb-3 rounded-lg bg-secondary p-2.5">
            <p className="text-xs text-muted-foreground mb-1">Selected range</p>
            <p className="text-sm font-medium text-foreground">{dateLabel}</p>
          </div>

          {/* Compare Toggle */}
          <div className="border-t border-border pt-3">
            <button
              onClick={toggleCompare}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Compare to
              </span>
              <div
                className={cn(
                  'h-5 w-9 rounded-full transition-colors relative',
                  compareEnabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                    compareEnabled ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </div>
            </button>

            {compareEnabled && (
              <div className="mt-2 space-y-1 pl-2">
                {compareModes.map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => setCompareMode(mode.value)}
                    className={cn(
                      'block w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
                      compareMode === mode.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
                {compareStartDate && compareEndDate && (
                  <div className="mt-2 rounded-lg bg-secondary p-2.5">
                    <p className="text-xs text-muted-foreground mb-1">Comparison range</p>
                    <p className="text-sm font-medium text-foreground">
                      {format(compareStartDate, 'MMM d, yyyy')} – {format(compareEndDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
