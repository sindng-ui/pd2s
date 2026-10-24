/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        diablo: {
          bg: '#0c0b0e',
          panel: '#151319',
          card: '#1d1a23',
          border: '#322b3d',
          gold: '#d4af37',
          goldLight: '#f3d573',
          rune: '#ff9800',
          blood: '#9e1b1b',
          unique: '#c7b377',
          corrupt: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}
