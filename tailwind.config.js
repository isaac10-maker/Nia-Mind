/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        nia: {
          orange: 'rgb(var(--nia-orange-rgb) / <alpha-value>)',
          'orange-deep': 'rgb(var(--nia-orange-deep-rgb) / <alpha-value>)',
          bordeaux: 'rgb(var(--nia-bordeaux-rgb) / <alpha-value>)',
          'bordeaux-dark': 'rgb(var(--nia-bordeaux-dark-rgb) / <alpha-value>)',
          'gray-dark': 'rgb(var(--nia-text-primary-rgb) / <alpha-value>)',
          'gray-mid': 'rgb(var(--nia-text-secondary-rgb) / <alpha-value>)',
          'gray-light': 'rgb(var(--nia-border-light-rgb) / <alpha-value>)',
          'bg-light': 'rgb(var(--nia-bg-light-rgb) / <alpha-value>)',
          white: 'rgb(var(--nia-card-rgb) / <alpha-value>)',
          'bg-dark': 'rgb(var(--nia-bg-dark-rgb) / <alpha-value>)',
          'surface-dark': 'rgb(var(--nia-surface-dark-rgb) / <alpha-value>)',
          'border-dark': 'rgb(var(--nia-border-dark-rgb) / <alpha-value>)',
          'text-dark': 'rgb(var(--nia-text-dark-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'nia-soft': '0 10px 30px -10px rgb(var(--nia-bordeaux-rgb) / 0.08), 0 4px 12px -2px rgb(var(--nia-orange-rgb) / 0.06)',
        'nia-glow': '0 0 28px -4px rgb(var(--nia-orange-rgb) / 0.35)',
        'nia-bordeaux': '0 10px 25px -5px rgb(var(--nia-bordeaux-rgb) / 0.25)',
      },
    },
  },
  plugins: [],
};
