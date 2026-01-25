import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const Progress = React.forwardRef(
  ({ className, value = 0, max = 100, showLabel = false, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const variants = {
      default: 'bg-accent-primary',
      success: 'bg-semantic-success',
      warning: 'bg-semantic-warning',
      error: 'bg-semantic-error',
      info: 'bg-semantic-info',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full',
          'bg-surface-muted',
          className
        )}
        {...props}
      >
        <motion.div
          className={cn('h-full rounded-full', variants[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
        {showLabel && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-text-primary">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress }
