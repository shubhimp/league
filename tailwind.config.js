/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nerdLime: '#9BE600',
        nerdBlue: '#00308F',
        nerdWhite: '#FFFFFF',
        nerdDark: '#001a4d',
        nerdGray: '#F3F4F6',
        nerdRed: '#FF4444',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        roboto: ['Roboto', 'sans-serif', 'system-ui'],
      },
      boxShadow: {
        'hard': '6px 6px 0px 0px #00308F',
        'hard-lime': '6px 6px 0px 0px #9BE600',
        'hard-sm': '3px 3px 0px 0px #00308F',
        'hard-lime-sm': '3px 3px 0px 0px #9BE600',
      },
    },
  },
  plugins: [],
}
