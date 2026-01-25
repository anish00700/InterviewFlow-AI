import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from './utils'

const AuthContext = createContext(null)

/**
 * AuthProvider - Manages authentication state across the app
 * Persists token in localStorage and validates via API on load
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Safety timeout - ensure loading state doesn't block forever (reduced to 2 seconds)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Auth check timeout - setting isLoading to false')
        setIsLoading(false)
      }
    }, 2000) // 2 second timeout - don't block rendering
    
    return () => clearTimeout(timeout)
  }, [isLoading])

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          // Token invalid or expired
          localStorage.removeItem('token')
          localStorage.removeItem('interviewflow_user')
        }
      } catch (error) {
        // Silently fail - don't block app rendering if API is unavailable
        console.error('Auth verification failed:', error)
        // Clear invalid token
        localStorage.removeItem('token')
        localStorage.removeItem('interviewflow_user')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json().catch(() => ({ message: 'Network error. Please try again.' }))

    if (!response.ok) {
      throw new Error(data.message || 'Login failed')
    }

    // Success
    localStorage.setItem('token', data.token)
    localStorage.setItem('interviewflow_user', JSON.stringify(data)) // For redundant quick access if needed
    setUser(data)

    return data
  }

  const register = async (name, email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })

    const data = await response.json().catch(() => ({ message: 'Network error. Please try again.' }))

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed')
    }

    // Success - Auto login
    localStorage.setItem('token', data.token)
    localStorage.setItem('interviewflow_user', JSON.stringify(data))
    setUser(data)

    return data
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('interviewflow_user')
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
