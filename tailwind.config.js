/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: { leaf: '#58cc02', forest: '#163a32', moss: '#245447', parchment: '#f7f2e8', ink: '#26322f' },
      boxShadow: { float: '0 12px 30px rgba(22,58,50,.12)' },
      fontFamily: { display: ['Georgia', 'serif'] },
    },
  },
  plugins: [],
}
