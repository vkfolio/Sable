import type { Config } from 'tailwindcss';

// Sable design tokens:
// flat, dense, neutral grays + a single saturated accent. Theme tokens are
// expressed as CSS variables so we can swap accent per-Space later.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          2: 'rgb(var(--bg-2) / <alpha-value>)',
          3: 'rgb(var(--bg-3) / <alpha-value>)',
          4: 'rgb(var(--bg-4) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'rgb(var(--fg) / <alpha-value>)',
          mute: 'rgb(var(--fg-mute) / <alpha-value>)',
          dim: 'rgb(var(--fg-dim) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          strong: 'rgb(var(--border-strong) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          fg: 'rgb(var(--accent-fg) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'Segoe UI',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'JetBrains Mono',
          'monospace',
        ],
      },
      fontSize: {
        // Tighter ramp than Tailwind defaults — UI text lives at 11-13px.
        '2xs': ['10px', '14px'],
        xs: ['11px', '15px'],
        sm: ['12px', '16px'],
        base: ['13px', '18px'],
      },
      animation: {
        pulse: 'pulse 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
