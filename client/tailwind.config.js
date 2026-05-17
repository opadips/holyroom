/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  safelist: [
    'ty-h1', 'ty-h2', 'ty-h3', 'ty-h4',
    'ty-label', 'ty-label--accent',
    'ty-body', 'ty-body--primary', 'ty-body--sm',
    'ty-chat-username', 'ty-chat-message', 'ty-chat-message--system', 'ty-chat-time',
    'ty-sidebar-section', 'ty-sidebar-user', 'ty-sidebar-status',
    'ty-header-title', 'ty-header-sub',
    'ty-meta', 'ty-badge', 'ty-count',
    'ty-input', 'ty-btn', 'ty-btn--sm',
    'ty-notification', 'ty-mono',
    'ty-accent', 'ty-accent--cyan', 'ty-accent--danger', 'ty-accent--ok',
    'ty-truncate', 'ty-clamp-2',
    'glass-divider', 'glass-badge', 'glass-badge--cyan', 'glass-icon-btn',
    'glass-surface', 'glass-tooltip',
    'al-edge-top', 'al-edge-bottom', 'al-edge-left', 'al-edge-right',
    'al-hover-purple', 'al-hover-blue', 'al-hover-cyan',
    'animate-fadeInUp', 'animate-fadeInScale', 'animate-pulse-glow',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        purple: {
          950: '#0f0520',
        },
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(168,85,247,0.3)' },
          '50%':      { boxShadow: '0 0 20px rgba(168,85,247,0.6)' },
        },
        drift: {
          from: { transform: 'translateY(0)' },
          to:   { transform: 'translateY(-2%)' },
        },
      },
      animation: {
        fadeInUp:    'fadeInUp 0.5s ease-out',
        fadeInScale: 'fadeInScale 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        pulseGlow:   'pulseGlow 3s ease-in-out infinite',
        drift:       'drift 30s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        depth:  'cubic-bezier(0.34, 1.10, 0.64, 1)',
        out:    'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};