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
        sans:    ['var(--font-quicksand)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-quicksand)', 'serif'],
      },
      colors: {
        // Plume brand palette — derived from the Charte graphique JPEG
        brand: {
          navy:   '#1a1a2e',  // Primary surface (headers, dark cards)
          ink:    '#0f0f1d',  // Active state, focus rings
          coral:  '#FF7A59',  // Primary accent (CTAs, highlights)
          peach:  '#FFB8A4',  // Soft accent surfaces
          cream:  '#FAF6F0',  // Page background warm
          stone:  '#E9E4DC',  // Borders, dividers (warm)
        },
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      boxShadow: {
        soft:  '0 1px 2px 0 rgb(15 15 29 / 0.04), 0 1px 3px 0 rgb(15 15 29 / 0.06)',
        plume: '0 8px 24px -6px rgb(255 122 89 / 0.25)',
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
