import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * SectionCard - Clean, professional card container
 * Replaces the glass morphism approach with subtle, refined styling
 *
 * @param {object} props
 * @param {string} props.variant - 'default' | 'elevated' | 'outlined' | 'muted'
 * @param {string} props.padding - 'none' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} props.hover - Enable hover animation
 * @param {boolean} props.animate - Enable entrance animation
 */
export function GlassCard({
  children,
  variant = 'default',
  padding = 'lg',
  hover = false,
  animate = true,
  glow = false,
  as = 'div',
  className = '',
  ...props
}) {
  const Component = animate ? motion[as] || motion.div : as

  const variants = {
    default: 'bg-surface-elevated border border-border shadow-card',
    elevated: 'bg-surface-elevated border border-border shadow-lg',
    outlined: 'bg-transparent border border-border',
    muted: 'bg-surface-muted border border-transparent',
    bordered: 'bg-surface-elevated border-2 border-accent-primary/20 shadow-card',
    subtle: 'bg-surface-muted/50 border border-border/50',
    solid: 'bg-surface-elevated border border-border shadow-card',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  }

  const hoverStyles = hover
    ? 'transition-all duration-250 hover:shadow-card-hover hover:border-border-strong cursor-pointer'
    : 'transition-all duration-250'

  const glowStyles = glow ? 'shadow-accent' : ''

  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
      }
    : {}

  return (
    <Component
      className={cn(
        'rounded-xl glass-card',
        variants[variant],
        paddings[padding],
        hoverStyles,
        glowStyles,
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  )
}

/**
 * SectionPanel - Full-width section container
 */
export function GlassPanel({ children, className = '', ...props }) {
  return (
    <GlassCard
      variant="muted"
      padding="none"
      className={cn('rounded-none md:rounded-xl', className)}
      {...props}
    >
      {children}
    </GlassCard>
  )
}

/**
 * InteractiveCard - Card with press feedback
 */
export function GlassButton({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <motion.button
      className={cn(
        'bg-surface-elevated border border-border rounded-lg',
        'font-medium text-text-primary',
        'transition-all duration-200',
        'hover:bg-surface-muted hover:border-border-strong',
        'active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:ring-offset-2',
        sizes[size],
        className
      )}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Alias for backwards compatibility
export const SectionCard = GlassCard
export const SectionPanel = GlassPanel
export const InteractiveCard = GlassButton

export default GlassCard
