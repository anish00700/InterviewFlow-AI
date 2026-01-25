import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * MeshBackground - Ambient gradient background
 * Provides subtle visual interest without being distracting
 */
export function MeshBackground({
  variant = 'default',
  className = '',
  children,
}) {
  const variants = {
    // Default - subtle warm gradient with dots
    default: (
      <>
        {/* Base warm gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-surface-base to-surface-muted" />
        {/* Subtle top accent */}
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-accent-primaryMuted/20 to-transparent opacity-60" />
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 bg-dots opacity-40" />
      </>
    ),
    // Auth pages - centered mesh gradient with floating orbs
    auth: (
      <>
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        {/* Mesh gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-400/20 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-400/15 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-teal-400/10 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-30" />
      </>
    ),
    // Interview - focused, minimal distractions
    interview: (
      <>
        <div className="absolute inset-0 bg-surface-base" />
        {/* Very subtle top accent */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-surface-muted to-transparent" />
      </>
    ),
    // Clean - pure minimal
    clean: (
      <>
        <div className="absolute inset-0 bg-surface-base" />
      </>
    ),
  }

  return (
    <div
      className={cn('fixed inset-0 -z-10 overflow-hidden', className)}
      aria-hidden="true"
    >
      {variants[variant]}
      {/* Content overlay */}
      {children}
    </div>
  )
}

// Also export as default for compatibility
export default MeshBackground
