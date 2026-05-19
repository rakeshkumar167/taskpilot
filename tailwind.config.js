/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        canvas: '#fafaf9',
        surface: '#ffffff',
        ink: {
          900: '#0c0a09',
          700: '#3f3f46',
          500: '#71717a',
          400: '#a1a1aa',
          300: '#d4d4d8',
          200: '#e4e4e7',
          100: '#f4f4f5',
        },
        accent: {
          DEFAULT: '#f59e0b', // amber-500
          hover: '#d97706', // amber-600
          soft: '#fef3c7', // amber-100
          softer: '#fffbeb', // amber-50
          ring: '#fcd34d', // amber-300
          ink: '#92400e', // amber-800
        },
        rose: {
          DEFAULT: '#f43f5e', // rose-500
          soft: '#ffe4e6', // rose-100
          softer: '#fff1f2', // rose-50
          ink: '#9f1239', // rose-800
        },
        priority: {
          high: '#dc2626',
          'high-soft': '#fef2f2',
          'high-ink': '#991b1b',
          med: '#d97706',
          'med-soft': '#fffbeb',
          'med-ink': '#92400e',
          low: '#0891b2',
          'low-soft': '#ecfeff',
          'low-ink': '#155e75',
        },
      },
      borderRadius: {
        xl2: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 15, 15, 0.04)',
        focus: '0 0 0 3px rgba(199, 210, 254, 0.7)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 160ms ease-out',
      },
    },
  },
  plugins: [],
};
