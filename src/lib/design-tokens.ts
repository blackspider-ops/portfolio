/**
 * Design Tokens for Portfolio
 * Phantom Protocol - Obsidian Stealth Theme
 */

export const designTokens = {
  colors: {
    bg: '#050505',
    surface: '#0F0F0F',
    text: '#FFFFFF',
    muted: '#8A9199',
    blue: '#60A5FA',
    violet: '#A78BFA',
    green: '#2DD4BF',
  },
  fonts: {
    heading: 'Fraunces',
    body: 'Inter',
    mono: 'JetBrains Mono',
  },
} as const;

export const themeVariants = {
  dark: {
    bg: '#050505',
    surface: '#0F0F0F',
    text: '#FFFFFF',
    muted: '#8A9199',
    blue: '#60A5FA',
    violet: '#A78BFA',
    green: '#2DD4BF',
  },
  cyber: {
    bg: '#050505',
    surface: '#0A0A0A',
    text: '#00FF41',
    muted: '#00AA2A',
    blue: '#00FF41',
    violet: '#00D4FF',
    green: '#00FF41',
  },
  dracula: {
    bg: '#282A36',
    surface: '#44475A',
    text: '#F8F8F2',
    muted: '#9CA8C4',
    blue: '#8BE9FD',
    violet: '#BD93F9',
    green: '#50FA7B',
  },
  solarized: {
    bg: '#002B36',
    surface: '#073642',
    text: '#EEE8D5',
    muted: '#93A1A1',
    blue: '#268BD2',
    violet: '#6C71C4',
    green: '#859900',
  },
} as const;

export type ThemeName = keyof typeof themeVariants;
export type ColorToken = keyof typeof designTokens.colors;
export type FontToken = keyof typeof designTokens.fonts;

export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function getColorCssVar(token: ColorToken): string {
  return `--${token}`;
}

export function getFontCssVar(token: FontToken): string {
  return `--font-${token}`;
}

export function validateDesignTokens(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const [name, value] of Object.entries(designTokens.colors)) {
    if (!isValidHexColor(value)) {
      errors.push(`Invalid color token "${name}": ${value}`);
    }
  }
  for (const [name, value] of Object.entries(designTokens.fonts)) {
    if (typeof value !== 'string' || value.length === 0) {
      errors.push(`Invalid font token "${name}": ${value}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateThemeVariants(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const [themeName, colors] of Object.entries(themeVariants)) {
    for (const [colorName, value] of Object.entries(colors)) {
      if (!isValidHexColor(value)) {
        errors.push(`Invalid color in theme "${themeName}", token "${colorName}": ${value}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
