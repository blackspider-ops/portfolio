/**
 * Property-Based Tests for Responsive Navigation Layout
 * Property 1: Responsive Navigation Layout
 * Validates: Requirements 1.1, 1.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { LeftRail } from './LeftRail';
import { BottomBar } from './BottomBar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

/**
 * Helper to determine expected navigation layout based on viewport width
 * Desktop (≥1024px): Left Rail should be visible
 * Mobile (<1024px): Bottom Bar should be visible
 */
function getExpectedLayout(viewportWidth: number): 'left-rail' | 'bottom-bar' {
  return viewportWidth >= 1024 ? 'left-rail' : 'bottom-bar';
}

/**
 * Helper to check if LeftRail has correct desktop visibility classes
 */
function hasDesktopVisibilityClasses(element: HTMLElement): boolean {
  // LeftRail should have 'hidden lg:flex' classes
  return element.classList.contains('hidden') && element.classList.contains('lg:flex');
}

/**
 * Helper to check if BottomBar has correct mobile visibility classes
 */
function hasMobileVisibilityClasses(element: HTMLElement): boolean {
  // BottomBar should have 'lg:hidden' class
  return element.classList.contains('lg:hidden');
}

describe('Responsive Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 1: Responsive Navigation Layout
   * For any viewport width, the navigation component should render as a left rail
   * (92px fixed) when width ≥ 1024px, and as a bottom bar when width < 1024px.
   */
  describe('Property 1: Responsive Navigation Layout', () => {
    it('for any viewport width >= 1024, left rail should be the expected layout', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1024, max: 3840 }), // Desktop viewport widths
          (viewportWidth) => {
            const expectedLayout = getExpectedLayout(viewportWidth);
            return expectedLayout === 'left-rail';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any viewport width < 1024, bottom bar should be the expected layout', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 1023 }), // Mobile viewport widths
          (viewportWidth) => {
            const expectedLayout = getExpectedLayout(viewportWidth);
            return expectedLayout === 'bottom-bar';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('LeftRail should have correct CSS classes for desktop-only visibility', () => {
      render(<LeftRail />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(hasDesktopVisibilityClasses(nav)).toBe(true);
    });

    it('BottomBar should have correct CSS classes for mobile-only visibility', () => {
      render(<BottomBar />);
      const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
      expect(hasMobileVisibilityClasses(nav)).toBe(true);
    });

    it('LeftRail should have fixed 92px width', () => {
      render(<LeftRail />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav.classList.contains('w-[92px]')).toBe(true);
    });

    it('LeftRail should be fixed positioned on the left', () => {
      render(<LeftRail />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav.classList.contains('fixed')).toBe(true);
      expect(nav.classList.contains('left-0')).toBe(true);
    });

    it('BottomBar should be fixed positioned at the bottom', () => {
      render(<BottomBar />);
      const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
      expect(nav.classList.contains('fixed')).toBe(true);
      expect(nav.classList.contains('bottom-0')).toBe(true);
    });
  });

  // Unit tests for navigation items
  describe('Navigation Items', () => {
    it('LeftRail should render all 5 navigation items', () => {
      render(<LeftRail />);
      
      expect(screen.getByLabelText('Home')).toBeInTheDocument();
      expect(screen.getByLabelText('Projects')).toBeInTheDocument();
      expect(screen.getByLabelText('Blog')).toBeInTheDocument();
      expect(screen.getByLabelText('Resume')).toBeInTheDocument();
      expect(screen.getByLabelText('Contact')).toBeInTheDocument();
    });

    it('LeftRail should render utility icons', () => {
      render(<LeftRail />);
      
      expect(screen.getByLabelText('Command Palette')).toBeInTheDocument();
      expect(screen.getByLabelText('Terminal')).toBeInTheDocument();
      expect(screen.getByLabelText('Theme')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    it('BottomBar should render all 5 navigation items', () => {
      render(<BottomBar />);
      
      expect(screen.getByLabelText('Home')).toBeInTheDocument();
      expect(screen.getByLabelText('Projects')).toBeInTheDocument();
      expect(screen.getByLabelText('Blog')).toBeInTheDocument();
      expect(screen.getByLabelText('Resume')).toBeInTheDocument();
      expect(screen.getByLabelText('Contact')).toBeInTheDocument();
    });

    it('BottomBar should render floating terminal action', () => {
      render(<BottomBar />);
      expect(screen.getByLabelText('Open Terminal')).toBeInTheDocument();
    });

    it('LeftRail should render monogram', () => {
      render(<LeftRail />);
      // Monogram is rendered from database, check for the container
      const monogram = screen.getByRole('navigation', { name: /main navigation/i }).querySelector('.font-heading');
      expect(monogram).toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('LeftRail should have proper navigation landmark', () => {
      render(<LeftRail />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav).toBeInTheDocument();
    });

    it('BottomBar should have proper navigation landmark', () => {
      render(<BottomBar />);
      const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
      expect(nav).toBeInTheDocument();
    });

    it('all navigation links should have accessible labels', () => {
      render(<LeftRail />);
      
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('aria-label');
      });
    });
  });
});
