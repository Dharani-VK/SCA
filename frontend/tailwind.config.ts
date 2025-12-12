import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        accent: {
          100: '#fff7ed',
          400: '#fb923c',
          500: '#f97316',
        },
      },
      boxShadow: {
        elevated: '0 20px 50px -20px rgba(15, 23, 42, 0.5)',
      },
      borderRadius: {
        xl: '1rem',
      },
      fontFamily: {
        heading: ['Inter', 'ui-sans-serif', 'system-ui'],
        body: ['Source Sans Pro', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
      },
    },
  },
  plugins: [forms, typography],
}

export default config
