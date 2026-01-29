import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/setup', label: 'Practice' },
  { path: '/history', label: 'History' },
  { path: '/resume-ats', label: 'Resume ATS' },
  { path: '/report', label: 'Reports' },
]

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setProfileMenuOpen(false)
    setMobileMenuOpen(false)
    navigate('/')
  }

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="mx-4 sm:mx-6 mt-4">
        <nav
          className={cn(
            'mx-auto max-w-5xl rounded-xl px-4 sm:px-6 py-3',
            'bg-surface-elevated/95 backdrop-blur-sm',
            'border border-border',
            'shadow-sm'
          )}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-primary text-text-inverse">
                <svg
                  className="w-4 h-4"
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
              <span className="text-base font-semibold text-text-primary tracking-tight">
                InterviewFlow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link key={item.path} to={item.path}>
                    <div
                      className={cn(
                        'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-surface-muted text-text-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted/50'
                      )}
                    >
                      {item.label}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Auth Section - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                /* Profile Dropdown */
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors',
                      'hover:bg-surface-muted',
                      profileMenuOpen && 'bg-surface-muted'
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-accent-primary text-text-inverse flex items-center justify-center text-sm font-medium">
                      {getInitials(user?.name)}
                    </div>
                    <span className="text-sm font-medium text-text-primary max-w-24 truncate">
                      {user?.name}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-text-muted transition-transform',
                        profileMenuOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-elevated border border-border shadow-lg py-2"
                      >
                        {/* User Info */}
                        <div className="px-4 py-2 border-b border-border">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {user?.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setProfileMenuOpen(false)
                              navigate('/settings')
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </button>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-border pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-semantic-error hover:bg-semantic-errorMuted transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Log out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Login/Signup Buttons */
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/register">Sign up</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-surface-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-text-primary" />
              ) : (
                <Menu className="w-5 h-5 text-text-primary" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                className="md:hidden mt-4 pt-4 border-t border-border"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-surface-muted text-text-primary'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                        )}
                      >
                        {item.label}
                      </Link>
                    )
                  })}

                  <div className="pt-2 mt-2 border-t border-border">
                    {isAuthenticated ? (
                      /* Mobile Profile Section */
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 px-3 py-2">
                          <div className="w-10 h-10 rounded-full bg-accent-primary text-text-inverse flex items-center justify-center font-medium">
                            {getInitials(user?.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {user?.name}
                            </p>
                            <p className="text-xs text-text-muted">{user?.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          className="w-full justify-start"
                          onClick={() => {
                            setMobileMenuOpen(false)
                            navigate('/settings')
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                        <Button
                          variant="secondary"
                          className="w-full justify-start"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Log out
                        </Button>
                      </div>
                    ) : (
                      /* Mobile Login/Signup */
                      <div className="flex flex-col gap-2">
                        <Button variant="secondary" className="w-full" asChild>
                          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                            Log in
                          </Link>
                        </Button>
                        <Button className="w-full" asChild>
                          <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                            Sign up
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </motion.header>
  )
}

export default Header
