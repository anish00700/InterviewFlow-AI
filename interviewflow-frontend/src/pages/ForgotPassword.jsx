import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import { TRANSITIONS } from '@/lib/constants'

export function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email')
      }

      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-primary text-text-inverse mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-text-primary mb-1">
            Forgot Password?
          </h1>
          <p className="text-text-secondary text-sm">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 p-4 rounded-lg bg-semantic-successMuted/50 border border-semantic-success/30 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-semantic-success mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-semantic-success mb-1">
                  Reset link sent!
                </p>
                <p className="text-xs text-semantic-success/80">
                  If an account exists with this email, a password reset link has been sent. Please check your inbox and follow the instructions.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 p-3 rounded-lg bg-semantic-errorMuted/50 border border-semantic-error/30 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-semantic-error mt-0.5 flex-shrink-0" />
              <p className="text-sm text-semantic-error">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div
                  className="w-5 h-5 border-2 border-text-inverse/30 border-t-text-inverse rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Back to login */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          Remember your password?{' '}
          <Link to="/login" className="text-accent-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </motion.div>
  )
}

export default ForgotPassword
