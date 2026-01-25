import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { GlassCard } from '@/components/shared'

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const provider = searchParams.get('provider')
  const error = searchParams.get('error')

  useEffect(() => {
    if (error) {
      // Error from OAuth
      setTimeout(() => {
        navigate('/login', { state: { error } })
      }, 3000)
      return
    }

    if (token) {
      // Store token
      localStorage.setItem('token', token)
      
      // Fetch user data
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch user data')
          }
          return res.json()
        })
        .then(userData => {
          const userInfo = {
            _id: userData._id,
            name: userData.name,
            email: userData.email,
            token: token
          }
          localStorage.setItem('interviewflow_user', JSON.stringify(userInfo))
          
          // Reload page to update AuthContext
          window.location.href = '/setup'
        })
        .catch(err => {
          console.error('Failed to fetch user data:', err)
          setTimeout(() => {
            navigate('/login', { state: { error: 'Failed to complete authentication' } })
          }, 2000)
        })
    } else {
      // No token, redirect to login
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    }
  }, [token, error, navigate])

  if (error) {
    return (
      <motion.div
        className="w-full max-w-sm mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlassCard variant="elevated" className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-semantic-error mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold text-text-primary mb-2">
            Authentication Failed
          </h2>
          <p className="text-text-secondary text-sm mb-4">
            {error}
          </p>
          <p className="text-text-muted text-xs">
            Redirecting to login...
          </p>
        </GlassCard>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard variant="elevated" className="p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-semantic-success mx-auto mb-4" />
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-2">
          {provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : ''} Authentication Successful!
        </h2>
        <p className="text-text-secondary text-sm mb-4">
          Setting up your account...
        </p>
        <motion.div
          className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full mx-auto"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </GlassCard>
    </motion.div>
  )
}

export default AuthCallback
