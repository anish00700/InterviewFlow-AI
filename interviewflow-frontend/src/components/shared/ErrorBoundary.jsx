import React from 'react'
// Note: Using inline styles instead of components to avoid dependency issues

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI that doesn't depend on other components
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#FAFAF9'
        }}>
          <div style={{ 
            maxWidth: '500px', 
            padding: '32px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: '#1C1917' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#57534E', marginBottom: '24px', fontSize: '14px' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.error?.stack && (
              <details style={{ marginBottom: '24px', textAlign: 'left', fontSize: '12px', color: '#A8A29E' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Error details</summary>
                <pre style={{ 
                  overflow: 'auto', 
                  padding: '12px', 
                  backgroundColor: '#F5F5F4',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#0D9488',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
