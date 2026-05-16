/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'holy-dark': '#050508',
        'holy-midnight': '#0b0b1a',
        'holy-purple': '#7c3aed',
        'holy-blue': '#6366f1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fadeInUp': 'fadeInUp 0.5s ease-out',
        'pulse-glow': 'pulse-glow 3s infinite ease-in-out',
        'ambientMove': 'ambientMove 20s infinite alternate ease-in-out',
        'drift': 'drift 30s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(168, 85, 247, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' },
        },
        ambientMove: {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(2%, 2%)' },
        },
        drift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};