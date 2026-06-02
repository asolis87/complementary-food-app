import type { Config } from 'tailwindcss'

/**
 * Tailwind CSS v4 configuration — Pakulab "Nurture & Growth" design system.
 *
 * Source: designs/dashboard_redesign/DESIGN.md
 * Scope: Dashboard module + Sidebar layout. Non-dashboard pages keep
 *        apps/web/src/shared/styles/tokens.css (MD3 design tokens).
 */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette (forest green)
        primary: {
          DEFAULT: '#0F5238',
          container: '#2D6A4F',
          fixed: '#B1F0CE',
        },
        'on-primary': '#FFFFFF',
        'on-primary-container': '#A8E7C5',

        // Secondary palette (warm brown/orange)
        secondary: {
          DEFAULT: '#895100',
          container: '#FD9D1A',
        },
        'on-secondary': '#FFFFFF',
        'on-secondary-container': '#663B00',
        'secondary-fixed': '#FFDCBC',

        // Tertiary
        tertiary: {
          DEFAULT: '#653F00',
          container: '#845501',
        },

        // Surface hierarchy
        background: '#F8F9FA',
        surface: '#FFFFFF',
        'surface-dim': '#D9DADB',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F3F4F5',
        'surface-container': '#EDEEEF',
        'surface-container-high': '#E7E8E9',
        'surface-container-highest': '#E1E3E4',
        'surface-variant': '#E1E3E4',

        'on-surface': '#191C1D',
        'on-surface-variant': '#404943',
        'on-background': '#191C1D',

        outline: '#707973',
        'outline-variant': '#BFC9C1',

        error: {
          DEFAULT: '#BA1A1A',
          container: '#FFDAD6',
        },
        'on-error': '#FFFFFF',
        'on-error-container': '#93000A',

        // Food category progress colors
        'cat-fruit': { bar: '#EF4444', bg: '#FEF2F2' },
        'cat-veg': { bar: '#22C55E', bg: '#F0FDF4' },
        'cat-prot': { bar: '#F97316', bg: '#FFF7ED' },
        'cat-cereal': { bar: '#F59E0B', bg: '#FFFBEB' },
        'cat-fat': { bar: '#EAB308', bg: '#FEFCE8' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': [
          '48px',
          { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' },
        ],
        'headline-lg': [
          '32px',
          { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' },
        ],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'title-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md': [
          '14px',
          { lineHeight: '20px', letterSpacing: '0.05em', fontWeight: '600' },
        ],
        caption: ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      spacing: {
        gutter: '24px',
        'margin-mobile': '16px',
        'margin-desktop': '40px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px',
        'container-max': '1200px',
      },
      boxShadow: {
        ambient:
          '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        card: '0 4px 16px -4px rgba(44, 47, 48, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config
