/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#faf6ef',
          dark: '#1a1d19',
        },
        ink: {
          DEFAULT: '#232a24',
          muted: '#5a6659',
          dark: '#e7ebe4',
        },
        sage: {
          50: '#f3f6f1',
          100: '#e3ebdf',
          200: '#c7d7bf',
          300: '#a5bd98',
          400: '#81a070',
          500: '#638555',
          600: '#4d6b42',
          700: '#3e5636',
          800: '#34462d',
          900: '#2c3a27',
        },
        amber: {
          50: '#fdf6e6',
          100: '#fae7bf',
          200: '#f5cf80',
          300: '#edb449',
          400: '#d79a25',
          500: '#b87d18',
          600: '#966115',
          700: '#764b16',
        },
      },
      fontFamily: {
        display: ['"Fraunces Variable"', 'Fraunces', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(44, 58, 39, 0.18), 0 2px 6px -2px rgba(44, 58, 39, 0.08)',
        card: '0 2px 12px -4px rgba(44, 58, 39, 0.12)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.13 0 0 0 0 0.17 0 0 0 0 0.14 0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
