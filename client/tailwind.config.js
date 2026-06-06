/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'rgb(var(--b-50)  / <alpha-value>)',
          100: 'rgb(var(--b-100) / <alpha-value>)',
          200: 'rgb(var(--b-200) / <alpha-value>)',
          300: 'rgb(var(--b-300) / <alpha-value>)',
          400: 'rgb(var(--b-400) / <alpha-value>)',
          500: 'rgb(var(--b-500) / <alpha-value>)',
          600: 'rgb(var(--b-600) / <alpha-value>)',
          700: 'rgb(var(--b-700) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
