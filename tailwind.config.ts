import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        score: ['Bebas Neue', 'monospace'],
      },
      colors: {
        pitch: {
          950: '#04080F',
          900: '#080C14',
          800: '#0D1525',
          700: '#111D30',
          600: '#162238',
          500: '#1A2840',
        },
        neon: {
          green: '#22D672',
          'green-dim': '#16A350',
        },
      },
      boxShadow: {
        'glow-green': '0 0 24px rgba(34, 214, 114, 0.18), 0 0 48px rgba(34, 214, 114, 0.06)',
        'glow-green-sm': '0 0 12px rgba(34, 214, 114, 0.25)',
        'glow-red': '0 0 24px rgba(239, 68, 68, 0.2), 0 0 48px rgba(239, 68, 68, 0.08)',
        'glow-amber': '0 0 24px rgba(245, 158, 11, 0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)',
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(34, 214, 114, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(34, 214, 114, 0.7)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'fade-up': 'fade-up 0.4s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'bounce-in': 'bounce-in 0.6s ease-out forwards',
        shake: 'shake 0.4s ease-in-out',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
