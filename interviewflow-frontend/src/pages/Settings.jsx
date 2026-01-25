import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle, Save, Clock, ArrowRight } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import { TRANSITIONS } from '@/lib/constants'
import { useAuth } from '@/lib/AuthContext'

export function Settings() {
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Email update state
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailStep, setEmailStep] = useState(1) // 1: enter email, 2: verify OTP
  const [otp, setOtp] = useState('')
  const [isSendingOTP, setIsSendingOTP] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Load user data
  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      setNewEmail(user.email || '')
    }
  }, [user])

  // OTP Timer
  useEffect(() => {
    let interval = null
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1)
      }, 1000)
    } else if (otpTimer === 0 && otpSent) {
      // Timer expired
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [otpTimer, otpSent])

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setIsSendingOTP(true)
    setError('')
    setSuccess('')

    if (!newEmail || newEmail === email) {
      setError('Please enter a new email address')
      setIsSendingOTP(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/send-email-update-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code')
      }

      setOtpSent(true)
      setEmailStep(2)
      setOtpTimer(600) // 10 minutes
      setSuccess('Verification code sent to your new email address')
    } catch (err) {
      setError(err.message || 'Failed to send verification code')
    } finally {
      setIsSendingOTP(false)
    }
  }

  const handleResendOTP = async () => {
    setIsSendingOTP(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/send-email-update-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification code')
      }

      setOtpTimer(600) // Reset timer
      setSuccess('Verification code resent successfully')
    } catch (err) {
      setError(err.message || 'Failed to resend verification code')
    } finally {
      setIsSendingOTP(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      setIsLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/update-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail, otp })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update email')
      }

      setSuccess('Email updated successfully! Please sign in again with your new email.')
      setEmail(newEmail)
      setEmailStep(1)
      setOtp('')
      setOtpSent(false)
      setOtpTimer(0)
      
      // Logout and redirect to login after 2 seconds
      setTimeout(() => {
        logout()
        window.location.href = '/login'
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to update email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (!currentPassword) {
      setError('Please enter your current password')
      setIsLoading(false)
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password')
      }

      setSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user is OAuth-only
  const isOAuthUser = user?.provider && user.provider !== 'local'

  return (
    <div className="min-h-screen bg-surface-base py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={TRANSITIONS.slow}
        >
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-semibold text-text-primary mb-2">
              Settings
            </h1>
            <p className="text-text-secondary">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 p-4 rounded-lg bg-semantic-successMuted/50 border border-semantic-success/30 flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-semantic-success mt-0.5 flex-shrink-0" />
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
                className="mb-6 p-4 rounded-lg bg-semantic-errorMuted/50 border border-semantic-error/30 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-semantic-error mt-0.5 flex-shrink-0" />
                <p className="text-sm text-semantic-error">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-6">
            {/* Profile Information */}
            <GlassCard variant="elevated" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-accent-primary text-text-inverse flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-text-primary">
                    Profile Information
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Your account details
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-primary mb-1 block">
                    Name
                  </label>
                  <Input
                    value={user?.name || ''}
                    disabled
                    className="bg-surface-muted"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Name cannot be changed
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-primary mb-1 block">
                    Account Type
                  </label>
                  <Input
                    value={user?.provider === 'google' ? 'Google Account' : user?.provider === 'github' ? 'GitHub Account' : 'Email Account'}
                    disabled
                    className="bg-surface-muted"
                  />
                </div>
              </div>
            </GlassCard>

            {/* Email Update */}
            <GlassCard variant="elevated" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-5 h-5 text-accent-primary" />
                <div>
                  <h2 className="font-serif text-xl font-semibold text-text-primary">
                    Email Address
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Update your email address
                  </p>
                </div>
              </div>

              {isOAuthUser ? (
                <div className="p-4 rounded-lg bg-surface-muted border border-border">
                  <p className="text-sm text-text-secondary">
                    Your email is managed by {user.provider === 'google' ? 'Google' : 'GitHub'}. 
                    To change your email, please update it in your {user.provider === 'google' ? 'Google' : 'GitHub'} account settings.
                  </p>
                </div>
              ) : (
                <>
                  {/* Step 1: Enter New Email */}
                  {emailStep === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text-primary" htmlFor="currentEmail">
                          Current Email
                        </label>
                        <Input
                          id="currentEmail"
                          type="email"
                          value={email}
                          disabled
                          className="bg-surface-muted"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text-primary" htmlFor="newEmail">
                          New Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <Input
                            id="newEmail"
                            type="email"
                            placeholder="Enter new email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="pl-10"
                            required
                            disabled={isSendingOTP}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSendingOTP || newEmail === email}
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
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}

                  {/* Step 2: Verify OTP */}
                  {emailStep === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                      {/* Email confirmation */}
                      <div className="p-3 rounded-lg bg-accent-primaryMuted/50 border border-accent-primary/30 flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-4 h-4 text-accent-primary flex-shrink-0" />
                        <p className="text-sm text-accent-primary">
                          Verification code sent to <strong>{newEmail}</strong>
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

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => {
                            setEmailStep(1)
                            setOtp('')
                            setOtpSent(false)
                            setOtpTimer(0)
                            setError('')
                            setSuccess('')
                          }}
                          disabled={isLoading}
                        >
                          Change Email
                        </Button>
                        <Button
                          type="submit"
                          size="lg"
                          className="flex-1"
                          disabled={isLoading || otp.length !== 6}
                        >
                          {isLoading ? (
                            <motion.div
                              className="w-5 h-5 border-2 border-text-inverse/30 border-t-text-inverse rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Verify & Update
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </GlassCard>

            {/* Password Update */}
            <GlassCard variant="elevated" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-accent-primary" />
                <div>
                  <h2 className="font-serif text-xl font-semibold text-text-primary">
                    Password
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Change your password
                  </p>
                </div>
              </div>

              {isOAuthUser ? (
                <div className="p-4 rounded-lg bg-surface-muted border border-border">
                  <p className="text-sm text-text-secondary">
                    Your account is managed by {user.provider === 'google' ? 'Google' : 'GitHub'}. 
                    To change your password, please update it in your {user.provider === 'google' ? 'Google' : 'GitHub'} account settings.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-primary" htmlFor="currentPassword">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-primary" htmlFor="newPassword">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-text-muted">
                      Must be at least 6 characters
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-primary" htmlFor="confirmPassword">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
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
                        <Save className="w-4 h-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>
              )}
            </GlassCard>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Settings
