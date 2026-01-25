import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import { TRANSITIONS } from '@/lib/constants'

export function ResetPassword() {
  return (
    <motion.div
      className="w-full max-w-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITIONS.slow}
    >
      <GlassCard variant="elevated" className="p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-semantic-warning text-text-inverse mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-text-primary mb-1">
            Reset Password
          </h1>
          <p className="text-text-secondary text-sm">
            Password reset temporarily unavailable
          </p>
        </div>

        {/* Message */}
        <div className="mb-6 p-4 rounded-lg bg-semantic-warningMuted/50 border border-semantic-warning/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-semantic-warning mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-semantic-warning mb-2">
                SMTP Limit Reached
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                We've reached our email service limit, so we've temporarily disabled the forgot password and OTP verification functionality. 
                We apologize for the inconvenience.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-text-secondary text-center">
            If you need to reset your password, please contact support or try again later.
          </p>
        </div>

        {/* Back to login */}
        <div className="mt-6">
          <Link to="/login">
            <Button variant="secondary" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </GlassCard>
    </motion.div>
  )
}

export default ResetPassword
