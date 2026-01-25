import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/shared/ErrorBoundary'
import './styles/globals.css'
import './styles/animations.css'

// Debug logging
console.log('🚀 App starting...')
console.log('📍 API_BASE_URL:', import.meta.env.VITE_API_URL || '(not set - using relative paths)')

const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('❌ Root element not found!')
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    )
    console.log('✅ React app rendered')
  } catch (error) {
    console.error('❌ Failed to render React app:', error)
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1>Failed to load application</h1>
        <p>Error: ${error.message}</p>
        <pre>${error.stack}</pre>
      </div>
    `
  }
}
