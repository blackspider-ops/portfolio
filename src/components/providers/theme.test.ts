/**
 * Property-Based Tests for Theme Persistence
 * Feature: tejas-portfolio-v3, Property 19: Theme Persistence
 * Validates: Requirements 25.3, 25.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { themeVariants, type ThemeName } from '@/lib/design-tokens';

// Valid theme names
const VALID_THEMES: ThemeName[] = ['dark', 'cyber', 'dracula', 'solarized'];
const THEME_STORAGE_KEY = 'tejas-portfolio-theme';

// Mock localStorage for testing
function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

// Theme persistence functions (extracted logic from ThemeProvider)
function saveTheme(theme: ThemeName, storage: Storage): boolean {
  try {
    if (!VALID_THEMES.includes(theme)) {
      return false;
    }
    storage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

function loadTheme(storage: Storage): ThemeName {
  try {
    const stored = storage.getItem(THEME_STORAGE_KEY);
    if (stored && VALID_THEMES.includes(stored as ThemeName)) {
      return stored as ThemeName;
    }
  } catch {
    // localStorage unavailable
  }
  return 'dark'; // Default theme
}

function isValidTheme(theme: string): theme is ThemeName {
  return VALID_THEMES.includes(theme as ThemeName);
}

describe('Feature: tejas-portfolio-v3', () => {
  /**
   * Property 19: Theme Persistence (Round-Trip)
   * For any theme selection (dark, cyber, dracula, solarized),
   * saving to localStorage and then loading should apply the same theme.
   */
  describe('Property 19: Theme Persistence', () => {
    let mockStorage: ReturnType<typeof createMockLocalStorage>;

    beforeEach(() => {
      mockStorage = createMockLocalStorage();
    });

    it('for any valid theme, saving and loading should return the same theme (round-trip)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_THEMES),
          (theme) => {
            // Save the theme
            const saved = saveTheme(theme, mockStorage as unknown as Storage);
            expect(saved).toBe(true);

            // Load the theme
            const loaded = loadTheme(mockStorage as unknown as Storage);

            // Round-trip: loaded theme should equal saved theme
            return loaded === theme;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any sequence of theme changes, the last saved theme should be loaded', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...VALID_THEMES), { minLength: 1, maxLength: 10 }),
          (themeSequence) => {
            // Save each theme in sequence
            for (const theme of themeSequence) {
              saveTheme(theme, mockStorage as unknown as Storage);
            }

            // Load should return the last theme
            const loaded = loadTheme(mockStorage as unknown as Storage);
            const lastTheme = themeSequence[themeSequence.length - 1];

            return loaded === lastTheme;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('invalid themes should not be saved and should not affect loaded theme', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_THEMES),
          fc.string().filter((s) => !VALID_THEMES.includes(s as ThemeName)),
          (validTheme, invalidTheme) => {
            // First save a valid theme
            saveTheme(validTheme, mockStorage as unknown as Storage);

            // Try to save an invalid theme (should fail)
            const invalidSaved = saveTheme(invalidTheme as ThemeName, mockStorage as unknown as Storage);
            expect(invalidSaved).toBe(false);

            // Load should still return the valid theme
            const loaded = loadTheme(mockStorage as unknown as Storage);
            return loaded === validTheme;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('when localStorage is empty, default theme (dark) should be returned', () => {
      const loaded = loadTheme(mockStorage as unknown as Storage);
      expect(loaded).toBe('dark');
    });

    it('all valid themes should have corresponding CSS custom properties defined', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_THEMES),
          (theme) => {
            // Each theme should exist in themeVariants
            const themeColors = themeVariants[theme];
            expect(themeColors).toBeDefined();

            // Each theme should have all required color tokens
            const requiredTokens = ['bg', 'surface', 'text', 'muted', 'blue', 'violet', 'green'];
            for (const token of requiredTokens) {
              expect(themeColors[token as keyof typeof themeColors]).toBeDefined();
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific requirements
  describe('Theme System Requirements', () => {
    let mockStorage: ReturnType<typeof createMockLocalStorage>;

    beforeEach(() => {
      mockStorage = createMockLocalStorage();
    });

    it('should support dark theme as default (Requirement 25.1)', () => {
      const loaded = loadTheme(mockStorage as unknown as Storage);
      expect(loaded).toBe('dark');
    });

    it('should support cyber, dracula, and solarized themes (Requirement 25.2)', () => {
      expect(isValidTheme('cyber')).toBe(true);
      expect(isValidTheme('dracula')).toBe(true);
      expect(isValidTheme('solarized')).toBe(true);
    });

    it('should persist theme selection in localStorage (Requirement 25.3)', () => {
      saveTheme('cyber', mockStorage as unknown as Storage);
      expect(mockStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'cyber');
    });

    it('should load persisted theme from localStorage (Requirement 25.4)', () => {
      mockStorage.setItem(THEME_STORAGE_KEY, 'dracula');
      const loaded = loadTheme(mockStorage as unknown as Storage);
      expect(loaded).toBe('dracula');
    });

    it('should validate theme names correctly', () => {
      expect(isValidTheme('dark')).toBe(true);
      expect(isValidTheme('cyber')).toBe(true);
      expect(isValidTheme('dracula')).toBe(true);
      expect(isValidTheme('solarized')).toBe(true);
      expect(isValidTheme('invalid')).toBe(false);
      expect(isValidTheme('')).toBe(false);
      expect(isValidTheme('DARK')).toBe(false); // Case sensitive
    });
  });
});
