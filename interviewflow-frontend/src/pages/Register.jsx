import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import { TRANSITIONS } from '@/lib/constants'
import { useAuth } from '@/lib/AuthContext'
import { API_BASE_URL } from '@/lib/utils'

export function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [step, setStep] = useState(1) // 1: Email/OTP, 2: Verify OTP and complete registration
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingOTP, setIsSendingOTP] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)

  // Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [otpTimer])

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setIsSendingOTP(true)
    setError('')
    setSuccess('')

    // Validate email
    if (!email || !email.trim()) {
      setError('Email is required')
      setIsSendingOTP(false)
      return
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setIsSendingOTP(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle rate limiting (429 status)
        if (response.status === 429) {
          const retryAfter = data.retryAfter || 30
          throw new Error(`${data.message || 'Email service is temporarily rate limited. Please wait'} (Retry after ${retryAfter} seconds)`)
        }
        
        // Handle bad credentials (401 status) - Gmail App Password issue
        if (response.status === 401 && data.errorType === 'bad_credentials') {
          throw new Error(data.message || 'Gmail authentication failed. Please configure an App Password in your .env file.')
        }
        
        throw new Error(data.message || 'Failed to send OTP')
      }

      setOtpSent(true)
      setSuccess('OTP sent successfully! Check your email.')
      setOtpTimer(600) // 10 minutes
      setStep(2)
      
      // If OTP is provided in dev mode, show it
      if (data.otp && process.env.NODE_ENV === 'development') {
        console.log('🔑 Dev Mode OTP:', data.otp)
        setSuccess(`OTP sent! (Dev Mode: ${data.otp})`)
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsSendingOTP(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // Validate all fields
    if (!name || !name.trim()) {
      setError('Name is required')
      setIsLoading(false)
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, name, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed')
      }

      // Store token and user data
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify({
          _id: data._id,
          name: data.name,
          email: data.email
        }))
      }

      setSuccess('Email verified! Account created successfully.')
      setTimeout(() => {
        navigate('/setup')
      }, 1000)
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsSendingOTP(true)
    setError('')
    setSuccess('')
    setOtpTimer(0)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP')
      }

      setSuccess('New OTP sent! Check your email.')
      setOtpTimer(600) // 10 minutes
      setOtp('') // Clear previous OTP
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setIsSendingOTP(false)
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-text-primary mb-1">
            Create your account
          </h1>
          <p className="text-text-secondary text-sm">
            Start mastering your interview skills
          </p>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 p-3 rounded-lg bg-semantic-successMuted/50 border border-semantic-success/30 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-semantic-success mt-0.5 flex-shrink-0" />
              <p className="text-sm text-semantic-success">{success}</p>
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

        {/* Step 1: Email and Send OTP */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary" htmlFor="email">
                Email Address
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
                  disabled={isSendingOTP}
                />
              </div>
              <p className="text-xs text-text-muted">
                We'll send a verification code to this email
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSendingOTP}
            >
              {isSendingOTP ? (
                <motion.div
                  className="w-5 h-5 border-2 border-text-inverse/30 border-t-text-inverse rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  Send Verification Code
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Step 2: Verify OTP and Complete Registration */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            {/* Email confirmation */}
            <div className="p-3 rounded-lg bg-accent-primaryMuted/50 border border-accent-primary/30 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-accent-primary flex-shrink-0" />
              <p className="text-sm text-accent-primary">
                Verification code sent to <strong>{email}</strong>
              </p>
            </div>

            {/* OTP Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary" htmlFor="otp">
                Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-widest font-mono"
                required
                maxLength={6}
                disabled={isLoading}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">
                  {otpTimer > 0 ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Code expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <span className="text-semantic-warning">Code expired</span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-xs text-accent-primary hover:underline"
                  disabled={isSendingOTP || otpTimer > 0}
                >
                  Resend Code
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-text-muted">
                Must be at least 6 characters
              </p>
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
                  Verify & Create Account
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep(1)
                setOtp('')
                setOtpSent(false)
                setOtpTimer(0)
              }}
              className="text-sm text-text-secondary hover:text-text-primary text-center w-full"
            >
              ← Change email address
            </button>
          </form>
        )}

        {/* Legacy form (hidden) */}
        {false && (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

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
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={8}
              />
            </div>
            <p className="text-xs text-text-muted">
              Must be at least 8 characters
            </p>
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
                Create Account
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </form>
        )}

        {/* Terms */}
        <p className="mt-4 text-xs text-text-muted text-center">
          By signing up, you agree to our{' '}
          <a href="#" className="text-accent-primary hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-accent-primary hover:underline">
            Privacy Policy
          </a>
        </p>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface-elevated px-2 text-text-muted">
              or sign up with
            </span>
          </div>
        </div>

        {/* Social Login */}
        <Button 
          variant="secondary" 
          className="w-full"
          onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google`}
          type="button"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </Button>

        {/* Sign in link */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </motion.div>
  )
}

export default Register
