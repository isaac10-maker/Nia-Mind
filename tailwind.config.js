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
          orange: '#F97316',
          'orange-deep': '#EA580C',
          bordeaux: '#7F1D3F',
          'bordeaux-dark': '#57152D',
          'gray-dark': '#374151',
          'gray-mid': '#6B7280',
          'gray-light': '#E5E7EB',
          'bg-light': '#FFF9F5',
          white: '#FFFFFF',
          'bg-dark': '#111318',
          'surface-dark': '#1B1D24',
          'border-dark': '#343741',
          'text-dark': '#F5F5F5',
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
        'nia-soft': '0 10px 30px -10px rgba(127, 29, 63, 0.08), 0 4px 12px -2px rgba(249, 115, 22, 0.06)',
        'nia-glow': '0 0 28px -4px rgba(249, 115, 22, 0.35)',
        'nia-bordeaux': '0 10px 25px -5px rgba(127, 29, 63, 0.25)',
      },
    },
  },
  plugins: [],
};
