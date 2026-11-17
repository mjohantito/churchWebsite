/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        accent: 'var(--accent)',
        stone: {
          100: 'var(--gray-100)',
          200: 'var(--gray-200)',
          300: 'var(--gray-300)',
          500: 'var(--gray-500)',
          600: 'var(--gray-600)',
          700: 'var(--gray-700)',
        },
      },
      fontFamily: {
        script: ['Yellowtail', 'Brush Script MT', 'cursive'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      maxWidth: { page: '84rem' },
    },
  },
  // Type utilities (font-display, font-label) live in src/index.css under
  // @layer utilities so they are always re-read with the CSS (no stale config).
  plugins: [],
};
