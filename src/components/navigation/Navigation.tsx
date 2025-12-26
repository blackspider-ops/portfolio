'use client';

import { LeftRail } from './LeftRail';
import { BottomBar } from './BottomBar';

interface NavigationProps {
  onCommandPalette?: () => void;
  onTerminal?: () => void;
  onThemeToggle?: () => void;
  onSettings?: () => void;
}

/**
 * Responsive navigation component
 * - Desktop (≥1024px): Left Rail (92px fixed sidebar)
 * - Mobile (<1024px): Bottom Bar with floating terminal action
 * Requirements: 1.1, 1.2, 3.1-3.7
 */
export function Navigation({
  onCommandPalette,
  onTerminal,
  onThemeToggle,
}: NavigationProps) {
  return (
    <>
      <LeftRail
        onCommandPalette={onCommandPalette}
        onTerminal={onTerminal}
        onThemeToggle={onThemeToggle}
      />
      <BottomBar 
        onTerminal={onTerminal}
        onCommandPalette={onCommandPalette}
        onThemeToggle={onThemeToggle}
      />
    </>
  );
}
