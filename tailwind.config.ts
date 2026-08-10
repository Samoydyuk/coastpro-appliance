import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand taupe — the mocha tone from the CoastPro creatives.
        // Mapped onto `primary` so every existing primary-* class re-tones.
        primary: {
          50: '#faf8f6',
          100: '#f2efe9',
          200: '#e3ddd3',
          300: '#cec5b7',
          400: '#b0a394',
          500: '#8b7b6e',
          600: '#786a5e',
          700: '#63574e',
          800: '#4e4640',
          900: '#3a3430',
          950: '#241f1c',
        },
        // Deep espresso — used for dark surfaces and secondary emphasis.
        accent: {
          50: '#f7f4f1',
          100: '#ece5de',
          200: '#d8cabc',
          300: '#bfaa96',
          400: '#a68b72',
          500: '#8d7159',
          600: '#755c48',
          700: '#5c483a',
          800: '#43352b',
          900: '#2b221c',
        },
        // Warm neutral ramp replacing Tailwind's cool gray everywhere.
        gray: {
          50: '#faf9f7',
          100: '#f2f0eb',
          200: '#e6e2da',
          300: '#d3cdc2',
          400: '#a9a196',
          500: '#807870',
          600: '#635c56',
          700: '#4a4540',
          800: '#332f2c',
          900: '#1c1a18',
          950: '#111010',
        },
        cream: {
          DEFAULT: '#f2f0eb',
          light: '#f8f7f4',
          dark: '#e8e5dd',
        },
        ink: {
          DEFAULT: '#111111',
          soft: '#3a3430',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-archivo)', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        brand: '0.22em',
        label: '0.14em',
      },
      borderRadius: {
        card: '2px',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
}
export default config
