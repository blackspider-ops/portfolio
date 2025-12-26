import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Phantom Protocol - Obsidian Stealth
        'bg-void': 'var(--bg-void)',
        'bg-panel': 'var(--bg-panel)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        'surface-hover': 'var(--surface-hover)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-glow': 'var(--accent-glow)',
        'accent-border': 'var(--accent-border)',
        redacted: 'var(--redacted)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        // Legacy color mappings
        blue: 'var(--blue)',
        violet: 'var(--violet)',
        green: 'var(--green)',
      },
      fontFamily: {
        heading: ['var(--font-fraunces)', 'Playfair Display', 'serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      letterSpacing: {
        tight: '-0.02em',
        wide: '0.05em',
        wider: '0.1em',
      },
      lineHeight: {
        tight: '0.95',
      },
      backdropBlur: {
        phantom: '16px',
      },
      boxShadow: {
        'phantom-glow': '0 0 20px var(--accent-glow)',
        'phantom-lg': '0 10px 40px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        phantom: '12px',
      },
      animation: {
        'phantom-scan': 'phantom-scan 10s linear infinite',
        'phantom-pulse': 'phantom-pulse 2s ease-in-out infinite',
        'phantom-glow': 'phantom-glow 3s ease-in-out infinite',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};

export default config;
