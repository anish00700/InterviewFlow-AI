import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  // Base styles - refined and minimal
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Default - subtle teal
        default:
          'bg-accent-primaryMuted/60 text-accent-primary border border-accent-primary/10',
        // Secondary - neutral
        secondary:
          'bg-surface-muted text-text-secondary border border-border',
        // Success
        success:
          'bg-semantic-successMuted text-semantic-success border border-semantic-success/10',
        // Warning
        warning:
          'bg-semantic-warningMuted text-semantic-warning border border-semantic-warning/10',
        // Error
        error:
          'bg-semantic-errorMuted text-semantic-error border border-semantic-error/10',
        // Info
        info:
          'bg-semantic-infoMuted text-semantic-info border border-semantic-info/10',
        // Outline - minimal
        outline:
          'text-text-primary border border-border bg-transparent',
        // Dark - inverted
        dark:
          'bg-text-primary text-text-inverse border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
