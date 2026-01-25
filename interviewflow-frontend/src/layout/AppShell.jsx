import { Outlet } from 'react-router-dom'
import { MeshBackground } from '@/components/shared'
import { Header } from './Header'

/**
 * AppShell - Main application layout wrapper
 * Provides consistent layout structure across all pages
 */
export function AppShell({ variant = 'default' }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Subtle background */}
      <MeshBackground variant={variant} />

      {/* Fixed header with navigation */}
      <Header />

      {/* Main content area with proper spacing for fixed header */}
      <main className="flex-1 pt-24 pb-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-border/50">
        <p className="text-sm text-text-muted">
          InterviewFlow AI
        </p>
      </footer>
    </div>
  )
}

/**
 * AuthShell - Minimal layout for authentication pages
 */
export function AuthShell() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <MeshBackground variant="auth" />
      <Outlet />
    </div>
  )
}

/**
 * InterviewShell - Full-screen layout for interview sessions
 */
export function InterviewShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <MeshBackground variant="interview" />
      <Outlet />
    </div>
  )
}

export default AppShell
