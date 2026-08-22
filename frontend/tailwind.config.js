/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'da-primary': '#b3c34c',
        'da-primary-hover': '#9eb038',
        'da-dark': '#1e293b',
        'da-dark-hover': '#0f172a',
        'da-glass-dark': 'rgba(43, 51, 64, 0.784)',
        'da-glass-light': 'rgba(255, 255, 255, 0.92)',
      },
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '40px',
      },
      boxShadow: {
        'glass': '0 15px 35px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
        'dropdown': '0 25px 60px rgba(0, 0, 0, 0.2), inset 0 1px 1.5px rgba(255, 255, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
