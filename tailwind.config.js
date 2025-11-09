/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        a1: '#8b5cf6',
        a2: '#00e5a8',
        bg: '#071022',
      },
      fontFamily: {
        rubik: ['Rubik', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 10px 30px rgba(2,6,23,0.6)',
      },
    },
  },
  plugins: [],
};
