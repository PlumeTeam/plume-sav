import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Quicksand partout — display utilise simplement le même family avec
        // un weight 700, défini via les classes (font-display + font-bold).
        sans:    ['var(--font-quicksand)', 'system-ui', 'sans-serif'],
        display: ['var(--font-quicksand)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        // Brand spec: titres 0.02em, body 0.01em.
        brand:       '0.01em',
        'brand-tight': '0.02em',
      },
      colors: {
        // Plume brand palette — aligned with BRAND_SPEC.md.
        // `gold` is the canonical CTA color; `coral` is kept as an alias to
        // ease migration from the previous palette and is identical to gold.
        brand: {
          navy:   '#0F2430',  // Plume Black — headers, nav
          ink:    '#3A3A3A',  // Body text
          black:  '#010101',  // Strong titles
          gold:   '#C97D18',  // CTA / primary action
          coral:  '#C97D18',  // Alias of gold for legacy classes
          teal:   '#0C4A6E',  // Secondary accent
          cream:  '#f8f8f7',  // Section backgrounds
          stone:  '#E5E5E5',  // Subtle borders / dividers
          silver: '#C5C5C5',  // Stronger borders
        },
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        // Brand spec: cards 14px, buttons 25px (pill).
        card:    '14px',
        pill:    '25px',
      },
      boxShadow: {
        soft:  '0 1px 2px 0 rgb(15 36 48 / 0.04), 0 1px 3px 0 rgb(15 36 48 / 0.06)',
        plume: '0 8px 24px -6px rgb(201 125 24 / 0.25)',
      },
      keyframes: {
        'fade-in':    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up':   {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot':  { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      animation: {
        'fade-in':   'fade-in 200ms ease-out',
        'slide-up':  'slide-up 280ms ease-out',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
