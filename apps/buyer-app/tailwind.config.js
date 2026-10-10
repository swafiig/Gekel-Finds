/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF1EF',
          100: '#FFDDD8',
          200: '#FFB9AF',
          400: '#F8695D',
          500: '#F44236',
          600: '#DC3228',
          700: '#B82419',
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
