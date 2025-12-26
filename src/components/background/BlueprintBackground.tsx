'use client';

import { useEffect, useState } from 'react';

interface BlueprintBackgroundProps {
  showScanLine?: boolean;
}

/**
 * Blueprint Background Component
 * Creates a subtle grid pattern with optional scan line animation
 */
export function BlueprintBackground({ showScanLine = true }: BlueprintBackgroundProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const shouldShowScanLine = showScanLine && !prefersReducedMotion;

  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
        data-testid="blueprint-background"
        data-reduced-motion={prefersReducedMotion}
      >
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--muted) 1px, transparent 1px),
              linear-gradient(to bottom, var(--muted) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Smaller Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--muted) 1px, transparent 1px),
              linear-gradient(to bottom, var(--muted) 1px, transparent 1px)
            `,
            backgroundSize: '10px 10px',
          }}
        />

        {/* Scan Line */}
        {shouldShowScanLine && (
          <div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue/20 to-transparent animate-scan-line"
            data-testid="scan-line"
          />
        )}
      </div>

      {/* Scanline overlay */}
      <div className="scanline-overlay" aria-hidden="true" />
    </>
  );
}
