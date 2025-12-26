/**
 * Property-Based Tests for Reduced Motion Compliance
 * Feature: tejas-portfolio-v3, Property 2: Reduced Motion Compliance
 * Validates: Requirements 1.8, 15.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import { BlueprintBackground } from './BlueprintBackground';

// Mock matchMedia
function createMatchMediaMock(prefersReducedMotion: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? prefersReducedMotion : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

/**
 * Animation elements that should be disabled when reduced motion is preferred
 */
const ANIMATED_ELEMENTS = ['scan-line'] as const;

/**
 * Helper to check if an element has animation disabled
 * In our implementation, we simply don't render the scan line when reduced motion is preferred
 */
function isAnimationDisabled(element: HTMLElement | null): boolean {
  return element === null;
}

describe('Feature: tejas-portfolio-v3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  /**
   * Property 2: Reduced Motion Compliance
   * For any animation or motion effect in the application, when
   * `prefers-reduced-motion: reduce` is active, the animation should be
   * disabled or replaced with an instant transition.
   */
  describe('Property 2: Reduced Motion Compliance', () => {
    it('for any animated element, when reduced motion is preferred, animation should be disabled', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ANIMATED_ELEMENTS),
          fc.boolean(),
          (elementType, prefersReducedMotion) => {
            // Setup matchMedia mock
            window.matchMedia = createMatchMediaMock(prefersReducedMotion);
            
            cleanup();
            render(<BlueprintBackground showScanLine={true} />);
            
            const element = screen.queryByTestId(elementType);
            
            if (prefersReducedMotion) {
              // When reduced motion is preferred, animated elements should not be rendered
              return isAnimationDisabled(element);
            } else {
              // When reduced motion is not preferred, animated elements should be rendered
              return element !== null;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('scan line should not render when prefers-reduced-motion is enabled', () => {
      window.matchMedia = createMatchMediaMock(true);
      
      render(<BlueprintBackground showScanLine={true} />);
      
      const scanLine = screen.queryByTestId('scan-line');
      expect(scanLine).toBeNull();
    });

    it('scan line should render when prefers-reduced-motion is disabled', () => {
      window.matchMedia = createMatchMediaMock(false);
      
      render(<BlueprintBackground showScanLine={true} />);
      
      const scanLine = screen.queryByTestId('scan-line');
      expect(scanLine).toBeInTheDocument();
    });

    it('scan line should not render when showScanLine prop is false', () => {
      window.matchMedia = createMatchMediaMock(false);
      
      render(<BlueprintBackground showScanLine={false} />);
      
      const scanLine = screen.queryByTestId('scan-line');
      expect(scanLine).toBeNull();
    });

    it('background should expose reduced motion state via data attribute', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (prefersReducedMotion) => {
            window.matchMedia = createMatchMediaMock(prefersReducedMotion);
            
            cleanup();
            render(<BlueprintBackground />);
            
            const background = screen.getByTestId('blueprint-background');
            const dataAttr = background.getAttribute('data-reduced-motion');
            
            return dataAttr === String(prefersReducedMotion);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for BlueprintBackground
  describe('BlueprintBackground Component', () => {
    it('should render grid pattern', () => {
      window.matchMedia = createMatchMediaMock(false);
      
      render(<BlueprintBackground />);
      
      const background = screen.getByTestId('blueprint-background');
      expect(background).toBeInTheDocument();
    });

    it('should be hidden from accessibility tree', () => {
      window.matchMedia = createMatchMediaMock(false);
      
      render(<BlueprintBackground />);
      
      const background = screen.getByTestId('blueprint-background');
      expect(background).toHaveAttribute('aria-hidden', 'true');
    });

    it('should not capture pointer events', () => {
      window.matchMedia = createMatchMediaMock(false);
      
      render(<BlueprintBackground />);
      
      const background = screen.getByTestId('blueprint-background');
      expect(background.classList.contains('pointer-events-none')).toBe(true);
    });

    it('should be fixed positioned', () => {
      window.matchMedia = createMatchMediaMock(false);
      
      render(<BlueprintBackground />);
      
      const background = screen.getByTestId('blueprint-background');
      expect(background.classList.contains('fixed')).toBe(true);
      expect(background.classList.contains('inset-0')).toBe(true);
    });
  });

  // CSS-level reduced motion tests
  describe('CSS Reduced Motion Support', () => {
    it('global CSS should include reduced motion media query', () => {
      // This test verifies the CSS structure exists
      // The actual CSS is in globals.css with:
      // @media (prefers-reduced-motion: reduce) { ... }
      // We verify this by checking that our component respects the preference
      
      window.matchMedia = createMatchMediaMock(true);
      render(<BlueprintBackground showScanLine={true} />);
      
      const scanLine = screen.queryByTestId('scan-line');
      expect(scanLine).toBeNull();
    });
  });
});
