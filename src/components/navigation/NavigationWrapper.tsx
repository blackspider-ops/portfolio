'use client';

import { useState, useCallback } from 'react';
import { Navigation } from './Navigation';
import { ThemeSwitcher } from '@/components/providers';
import { useCommandPaletteContext } from '@/components/command-palette';
import { useTerminal } from '@/components/terminal';

/**
 * Client-side wrapper for Navigation that handles interactive features
 * - Command Palette toggle (⌘K)
 * - Terminal toggle (~)
 * - Theme switcher
 * - Settings (future)
 * Requirements: 3.3, 25.5
 */
export function NavigationWrapper() {
  const [isThemeSwitcherOpen, setIsThemeSwitcherOpen] = useState(false);
  const { open: openCommandPalette } = useCommandPaletteContext();
  const { open: openTerminal } = useTerminal();

  const handleThemeToggle = useCallback(() => {
    setIsThemeSwitcherOpen((prev) => !prev);
  }, []);

  const handleCloseThemeSwitcher = useCallback(() => {
    setIsThemeSwitcherOpen(false);
  }, []);

  return (
    <>
      <Navigation
        onCommandPalette={openCommandPalette}
        onTerminal={openTerminal}
        onThemeToggle={handleThemeToggle}
        onSettings={() => {}}
      />
      <ThemeSwitcher
        isOpen={isThemeSwitcherOpen}
        onClose={handleCloseThemeSwitcher}
      />
    </>
  );
}
