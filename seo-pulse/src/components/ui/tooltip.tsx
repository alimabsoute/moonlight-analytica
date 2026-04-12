import type { ReactNode, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  content: string
  children: ReactNode
  side?: 'top' | 'bottom'
}

function Tooltip({ content, children, side = 'top', className, ...props }: TooltipProps) {
  return (
    <div className={cn('group relative inline-flex', className)} {...props}>
      {children}
      <div
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md border border-border',
          'opacity-0 transition-opacity duration-150 group-hover:opacity-100',
          side === 'top' && 'bottom-full mb-2',
          side === 'bottom' && 'top-full mt-2'
        )}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  )
}

export { Tooltip }
export type { TooltipProps }
