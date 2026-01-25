import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/lib/AuthContext'
import { ProtectedRoute } from '@/components/shared'
import { AppShell, AuthShell, InterviewShell } from '@/layout'
import { Home, Login, Register, Setup, Interview, Report, ForgotPassword, ResetPassword, Settings } from '@/pages'
import { AuthCallback } from '@/pages/AuthCallback'

function App() {
  try {
    console.log('📱 App component rendering...')
    return (
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth routes - minimal layout (public) */}
            <Route element={<AuthShell />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Route>

            {/* Interview route - full-screen layout (protected) */}
            <Route element={<InterviewShell />}>
              <Route
                path="/interview"
                element={
                  <ProtectedRoute>
                    <Interview />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Main app routes - standard layout */}
            <Route element={<AppShell />}>
              {/* Home is public */}
              <Route path="/" element={<Home />} />
              {/* Setup and Report are protected */}
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <Setup />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <ProtectedRoute>
                    <Report />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    )
  } catch (error) {
    console.error('❌ App component error:', error)
    // Return a simple fallback UI
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Application Error</h1>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    )
  }
}

export default App
