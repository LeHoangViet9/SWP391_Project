/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#bfa15f',
          light: '#cda152',
          dark: '#a88a4a',
        },
        royal: {
          DEFAULT: '#1a2332',
          dark: '#0f1419',
        },
      },
      fontFamily: {
        display: ['"Segoe UI"', '"Noto Sans"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        body: ['"Segoe UI"', '"Noto Sans"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
