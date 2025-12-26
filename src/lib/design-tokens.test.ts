/**
 * Property-Based Tests for Design Token Consistency
 * Feature: tejas-portfolio-v3, Property 3: Design Token Consistency
 * Validates: Requirements 2.1-2.11
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  designTokens,
  themeVariants,
  isValidHexColor,
  validateDesignTokens,
  validateThemeVariants,
  getColorCssVar,
  getFontCssVar,
  type ColorToken,
  type FontToken,
} from './design-tokens';

describe('Feature: tejas-portfolio-v3', () => {
  /**
   * Property 3: Design Token Consistency
   * For any design token (color, font, spacing) used in the application,
   * it should reference a CSS custom property defined in the global stylesheet
   * with the correct value.
   */
  describe('Property 3: Design Token Consistency', () => {
    it('all color tokens should be valid hex colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...(Object.keys(designTokens.colors) as ColorToken[])),
          (colorToken) => {
            const colorValue = designTokens.colors[colorToken];
            return isValidHexColor(colorValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all theme variants should have consistent color tokens', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...(Object.keys(themeVariants) as (keyof typeof themeVariants)[])),
          fc.constantFrom(...(Object.keys(designTokens.colors) as ColorToken[])),
          (themeName, colorToken) => {
            const themeColors = themeVariants[themeName];
            // Theme should have the color token
            const hasToken = colorToken in themeColors;
            // If it has the token, it should be a valid hex color
            const isValid = hasToken ? isValidHexColor(themeColors[colorToken]) : false;
            return hasToken && isValid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all font tokens should be non-empty strings', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...(Object.keys(designTokens.fonts) as FontToken[])),
          (fontToken) => {
            const fontValue = designTokens.fonts[fontToken];
            return typeof fontValue === 'string' && fontValue.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('color CSS variable names should follow naming convention', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...(Object.keys(designTokens.colors) as ColorToken[])),
          (colorToken) => {
            const cssVar = getColorCssVar(colorToken);
            // Should start with -- and contain the token name
            return cssVar.startsWith('--') && cssVar.includes(colorToken);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('font CSS variable names should follow naming convention', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...(Object.keys(designTokens.fonts) as FontToken[])),
          (fontToken) => {
            const cssVar = getFontCssVar(fontToken);
            // Should start with --font- and contain the token name
            return cssVar.startsWith('--font-') && cssVar.includes(fontToken);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific requirements
  describe('Design Token Requirements', () => {
    it('should have correct background color (Requirement 2.1)', () => {
      expect(designTokens.colors.bg).toBe('#0A0D11');
    });

    it('should have correct surface color (Requirement 2.2)', () => {
      expect(designTokens.colors.surface).toBe('#0E1319');
    });

    it('should have correct text color (Requirement 2.3)', () => {
      expect(designTokens.colors.text).toBe('#E8EDF2');
    });

    it('should have correct muted color (Requirement 2.4)', () => {
      expect(designTokens.colors.muted).toBe('#A1ACB7');
    });

    it('should have correct blue accent (Requirement 2.5)', () => {
      expect(designTokens.colors.blue).toBe('#5B9CFF');
    });

    it('should have correct violet accent (Requirement 2.6)', () => {
      expect(designTokens.colors.violet).toBe('#A78BFA');
    });

    it('should have correct green accent (Requirement 2.7)', () => {
      expect(designTokens.colors.green).toBe('#28F07B');
    });

    it('should use Fraunces for headings (Requirement 2.8)', () => {
      expect(designTokens.fonts.heading).toBe('Fraunces');
    });

    it('should use Inter for body text (Requirement 2.9)', () => {
      expect(designTokens.fonts.body).toBe('Inter');
    });

    it('should use JetBrains Mono for terminal (Requirement 2.10)', () => {
      expect(designTokens.fonts.mono).toBe('JetBrains Mono');
    });
  });

  describe('Validation Functions', () => {
    it('validateDesignTokens should return valid for correct tokens', () => {
      const result = validateDesignTokens();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validateThemeVariants should return valid for all themes', () => {
      const result = validateThemeVariants();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('isValidHexColor should validate hex colors correctly', () => {
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#0A0D11')).toBe(true);
      expect(isValidHexColor('000000')).toBe(false);
      expect(isValidHexColor('#00000')).toBe(false);
      expect(isValidHexColor('#GGGGGG')).toBe(false);
    });
  });
});
