/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Editorial Precision" - Warm neutrals with deep teal accent
        surface: {
          base: '#FAFAF9',        // Warm off-white
          elevated: '#FFFFFF',    // Pure white for cards
          muted: '#F5F5F4',       // Stone-50 for subtle backgrounds
          warm: '#FEF7ED',        // Warm cream accent
        },
        border: {
          DEFAULT: '#E7E5E4',     // Stone-200
          muted: '#F5F5F4',       // Stone-100
          strong: '#D6D3D1',      // Stone-300
        },
        accent: {
          primary: '#0D9488',     // Deep teal
          primaryHover: '#0F766E', // Darker teal
          primaryMuted: '#CCFBF1', // Teal-100 for backgrounds
          secondary: '#1C1917',   // Stone-900 for secondary buttons
        },
        semantic: {
          success: '#059669',     // Emerald-600
          successMuted: '#D1FAE5', // Emerald-100
          warning: '#D97706',     // Amber-600
          warningMuted: '#FEF3C7', // Amber-100
          error: '#DC2626',       // Red-600
          errorMuted: '#FEE2E2',  // Red-100
          info: '#0891B2',        // Cyan-600
          infoMuted: '#CFFAFE',   // Cyan-100
        },
        text: {
          primary: '#1C1917',     // Stone-900
          secondary: '#57534E',   // Stone-600
          muted: '#A8A29E',       // Stone-400
          inverse: '#FAFAF9',     // Stone-50
        }
      },
      fontFamily: {
        // Serif display for headlines - elegant and authoritative
        serif: [
          'Source Serif 4',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'serif'
        ],
        // Clean geometric sans for body and UI
        sans: [
          'DM Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'SF Mono',
          'Menlo',
          'Monaco',
          'monospace'
        ],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.05' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        // Clean, subtle shadows
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'DEFAULT': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'md': '0 6px 10px -2px rgb(0 0 0 / 0.06), 0 3px 6px -3px rgb(0 0 0 / 0.06)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
        // Elevated card shadow
        'card': '0 1px 3px rgb(0 0 0 / 0.04), 0 4px 12px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px rgb(0 0 0 / 0.08), 0 8px 24px rgb(0 0 0 / 0.06)',
        // Accent glow (subtle)
        'accent': '0 0 0 1px rgb(13 148 136 / 0.1), 0 4px 12px rgb(13 148 136 / 0.1)',
        // Inner shadow for inputs
        'inner': 'inset 0 1px 2px rgb(0 0 0 / 0.04)',
        // Glass card shadow
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.12)',
        // Focus glow for inputs
        'glow': '0 0 0 3px rgba(13, 148, 136, 0.15)',
        'glow-lg': '0 0 20px rgba(13, 148, 136, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-up': 'fadeUp 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
