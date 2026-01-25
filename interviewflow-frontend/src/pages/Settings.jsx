import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle, Save } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import { TRANSITIONS } from '@/lib/constants'
import { useAuth } from '@/lib/AuthContext'
import { API_BASE_URL } from '@/lib/utils'

export function Settings() {
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')


  // Password update state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)


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
      const response = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
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

            {/* Email Display (Read-only) */}
            <GlassCard variant="elevated" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-5 h-5 text-accent-primary" />
                <div>
                  <h2 className="font-serif text-xl font-semibold text-text-primary">
                    Email Address
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Your account email
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-surface-muted"
                />
                <p className="text-xs text-text-muted">
                  Email cannot be changed. {isOAuthUser && `Your email is managed by ${user.provider === 'google' ? 'Google' : 'GitHub'}.`}
                </p>
              </div>
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
