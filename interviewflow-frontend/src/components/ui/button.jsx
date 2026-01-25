import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base styles - clean and professional
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Primary - Deep teal, solid and confident
        default:
          'bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-primaryHover active:scale-[0.98] shadow-sm hover:shadow-md',
        // Secondary - Subtle, outlined
        secondary:
          'bg-surface-elevated text-text-primary border border-border rounded-lg hover:bg-surface-muted hover:border-border-strong active:scale-[0.98] shadow-sm',
        // Ghost - Minimal, text only
        ghost:
          'text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-lg',
        // Outline - Accent border
        outline:
          'border border-accent-primary/30 text-accent-primary bg-transparent rounded-lg hover:bg-accent-primaryMuted/50 active:scale-[0.98]',
        // Destructive - Error state
        destructive:
          'bg-semantic-error text-text-inverse rounded-lg hover:bg-semantic-error/90 active:scale-[0.98] shadow-sm',
        // Link - Underlined text
        link:
          'text-accent-primary underline-offset-4 hover:underline p-0 h-auto',
        // Soft - Muted background with accent
        soft:
          'bg-accent-primaryMuted/50 text-accent-primary rounded-lg hover:bg-accent-primaryMuted active:scale-[0.98]',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        default: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-base',
        xl: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
