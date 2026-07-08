/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#F7F5F1', dark: '#0E1416' },
        surface: { DEFAULT: '#FFFFFF', dark: '#161D20' },
        ink: { DEFAULT: '#1C2B2E', dark: '#E8EDEC' },
        clinical: {
          50: '#EAF5F2',
          100: '#CFE8E1',
          200: '#9FD1C3',
          400: '#2E9080',
          500: '#0F6B5C',
          600: '#0C554A',
          700: '#0A443B',
        },
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(196, 67, 43, 0.45)' },
          '70%': { boxShadow: '0 0 0 8px rgba(196, 67, 43, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(196, 67, 43, 0)' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
