import type { Config } from 'tailwindcss';

// Sable design tokens — exposed via Tailwind utility classes.
// All colors map to CSS custom properties so they re-bind when the
// theme attribute on <body> flips, and per-Space accent overrides
// just work without component edits.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',

        surface: {
          1: 'rgb(var(--surface-1) / <alpha-value>)',
          2: 'rgb(var(--surface-2) / <alpha-value>)',
          3: 'rgb(var(--surface-3) / <alpha-value>)',
          4: 'rgb(var(--surface-4) / <alpha-value>)',
        },

        line: {
          DEFAULT: 'rgb(var(--line))',
          strong: 'rgb(var(--line-strong))',
        },

        ink: {
          0: 'rgb(var(--ink-0) / <alpha-value>)',
          1: 'rgb(var(--ink-1) / <alpha-value>)',
          2: 'rgb(var(--ink-2) / <alpha-value>)',
          3: 'rgb(var(--ink-3) / <alpha-value>)',
          4: 'rgb(var(--ink-4) / <alpha-value>)',
          inv: 'rgb(var(--ink-inv) / <alpha-value>)',
        },

        // Pastel palette
        p: {
          coral: 'rgb(var(--p-coral) / <alpha-value>)',
          peach: 'rgb(var(--p-peach) / <alpha-value>)',
          butter: 'rgb(var(--p-butter) / <alpha-value>)',
          mint: 'rgb(var(--p-mint) / <alpha-value>)',
          sky: 'rgb(var(--p-sky) / <alpha-value>)',
          lavender: 'rgb(var(--p-lavender) / <alpha-value>)',
          rose: 'rgb(var(--p-rose) / <alpha-value>)',
        },

        // Active-Space accent (re-mapped via [data-space=…])
        acc: {
          DEFAULT: 'rgb(var(--acc) / <alpha-value>)',
          ink: 'rgb(var(--acc-ink) / <alpha-value>)',
          soft: 'rgb(var(--acc-soft) / <alpha-value>)',
          glow: 'rgb(var(--acc-glow))',
        },

        ok: 'rgb(var(--ok) / <alpha-value>)',
        bad: 'rgb(var(--bad) / <alpha-value>)',

        // Back-compat aliases for legacy class names that still exist in the
        // codebase. Map to nearest new tokens. Will be cleaned up as
        // components are restyled.
        'bg-2': 'rgb(var(--surface-1) / <alpha-value>)',
        'bg-3': 'rgb(var(--surface-3) / <alpha-value>)',
        'bg-4': 'rgb(var(--surface-4) / <alpha-value>)',
        'fg': 'rgb(var(--ink-0) / <alpha-value>)',
        'fg-mute': 'rgb(var(--ink-2) / <alpha-value>)',
        'fg-dim': 'rgb(var(--ink-3) / <alpha-value>)',
        'border': {
          DEFAULT: 'rgb(var(--line))',
          strong: 'rgb(var(--line-strong))',
        },
        'accent': 'rgb(var(--acc) / <alpha-value>)',
        'accent-fg': 'rgb(var(--acc-ink) / <alpha-value>)',
      },

      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          '"Segoe UI"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"IBM Plex Mono"',
          'ui-monospace',
          'monospace',
        ],
      },

      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['11px', '15px'],
        sm: ['12px', '16px'],
        base: ['13px', '18px'],
        md: ['14px', '20px'],
      },

      boxShadow: {
        '1': 'var(--shadow-1)',
        '2': 'var(--shadow-2)',
        '3': 'var(--shadow-3)',
      },

      borderRadius: {
        DEFAULT: '6px',
        md: '7px',
        lg: '10px',
        xl: '12px',
        '2xl': '14px',
      },

      animation: {
        'pulse-slow': 'pulse 1.2s ease-in-out infinite',
        'blink-caret': 'blink-caret 1s steps(2) infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
