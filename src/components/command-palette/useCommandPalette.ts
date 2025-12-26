'use client';

/**
 * Hook for managing Command Palette state and keyboard shortcuts
 * Requirements: 5.1 - Open on ⌘K (Mac) / Ctrl+K (Windows/Linux)
 */

import { useState, useEffect, useCallback } from 'react';

interface UseCommandPaletteOptions {
  onOpen?: () => void;
  onClose?: () => void;
}

export function useCommandPalette(options: UseCommandPaletteOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
    options.onOpen?.();
  }, [options]);

  const close = useCallback(() => {
    setIsOpen(false);
    options.onClose?.();
  }, [options]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const newState = !prev;
      if (newState) {
        options.onOpen?.();
      } else {
        options.onClose?.();
      }
      return newState;
    });
  }, [options]);

  // Global keyboard shortcut listener - Requirement 5.1
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
