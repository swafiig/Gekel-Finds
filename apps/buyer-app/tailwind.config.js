/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF4EC',
          100: '#FFE5D1',
          200: '#FFC9A3',
          400: '#F47B3A',
          500: '#E8590C',
          600: '#D14A06',
          700: '#B53F05',
        },
        cream: '#F9F7F3',
        ink: { DEFAULT: '#1C1917', soft: '#57534E', mute: '#A8A29E' },
        line: '#E7E2DA',
        success: '#15803D',
        danger: '#DC2626',
      },
    },
  },
  plugins: [],
};
