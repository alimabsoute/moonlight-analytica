import { useState } from 'react'
import type { ImgHTMLAttributes } from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-14 w-14 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

interface AvatarProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'>,
    VariantProps<typeof avatarVariants> {
  fallback?: string
}

function Avatar({ src, alt, fallback, size, className, ...props }: AvatarProps) {
  const [hasError, setHasError] = useState(false)
  const showImage = src && !hasError

  const initials = fallback
    ?? (alt
      ? alt
          .split(' ')
          .map(w => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : '?')

  return (
    <div className={cn(avatarVariants({ size }), className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt ?? ''}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
          {...props}
        />
      ) : (
        <span className="font-medium text-muted-foreground">{initials}</span>
      )}
    </div>
  )
}

export { Avatar, avatarVariants }
export type { AvatarProps }
