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
          DEFAULT: '#7c3aed', // violet-600
          hover: '#6d28d9', // violet-700
          soft: '#ede9fe', // violet-100
          softer: '#f5f3ff', // violet-50
          ring: '#c4b5fd', // violet-300
          ink: '#5b21b6', // violet-800
        },
        rose: {
          DEFAULT: '#ec4899', // pink-500
          soft: '#fce7f3', // pink-100
          softer: '#fdf2f8', // pink-50
          ink: '#9d174d', // pink-800
        },
        mint: {
          DEFAULT: '#10b981', // emerald-500
          soft: '#d1fae5', // emerald-100
          softer: '#ecfdf5', // emerald-50
          ink: '#065f46', // emerald-800
        },
        sky: {
          DEFAULT: '#0ea5e9', // sky-500
          soft: '#e0f2fe', // sky-100
          softer: '#f0f9ff', // sky-50
          ink: '#075985', // sky-800
        },
        sun: {
          DEFAULT: '#f59e0b', // amber-500
          soft: '#fef3c7', // amber-100
          softer: '#fffbeb', // amber-50
          ink: '#92400e', // amber-800
        },
        priority: {
          high: '#ec4899', // pink-500
          'high-soft': '#fce7f3',
          'high-ink': '#9d174d',
          med: '#7c3aed', // violet-600
          'med-soft': '#ede9fe',
          'med-ink': '#5b21b6',
          low: '#10b981', // emerald-500
          'low-soft': '#d1fae5',
          'low-ink': '#065f46',
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
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(3deg)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(-5deg)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        pop: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '60%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 160ms ease-out',
        float: 'float 6s ease-in-out infinite',
        floatSlow: 'floatSlow 9s ease-in-out infinite',
        wiggle: 'wiggle 3s ease-in-out infinite',
        pop: 'pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
    },
  },
  plugins: [],
};
