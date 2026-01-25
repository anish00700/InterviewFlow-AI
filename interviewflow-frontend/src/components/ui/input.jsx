import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // Base styles - clean and minimal
        'flex h-11 w-full rounded-xl px-4 py-2 text-sm',
        // Background and border - subtle glass effect
        'bg-white/80 backdrop-blur-sm',
        'border border-border/60',
        // Typography
        'text-text-primary placeholder:text-text-muted',
        // Focus states - soft glow ring
        'transition-all duration-300 ease-out',
        'focus:outline-none',
        'focus:border-accent-primary/50',
        'focus:bg-white',
        'focus:shadow-glow',
        // Hover state
        'hover:border-border-strong hover:bg-white/90',
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted',
        // File input
        'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Base styles
        'flex min-h-[120px] w-full rounded-xl px-4 py-3 text-sm',
        // Background and border - subtle glass effect
        'bg-white/80 backdrop-blur-sm',
        'border border-border/60',
        // Typography
        'text-text-primary placeholder:text-text-muted',
        'leading-relaxed',
        // Focus states - soft glow ring
        'transition-all duration-300 ease-out',
        'focus:outline-none',
        'focus:border-accent-primary/50',
        'focus:bg-white',
        'focus:shadow-glow',
        // Hover state
        'hover:border-border-strong hover:bg-white/90',
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted',
        // Resize
        'resize-none',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Input, Textarea }
