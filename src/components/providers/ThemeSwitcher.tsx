'use client';

import { useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import type { ThemeName } from '@/lib/design-tokens';

interface ThemeSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

const themes: { name: ThemeName; label: string; description: string }[] = [
  { name: 'dark', label: 'Phantom', description: 'Obsidian Stealth' },
  { name: 'cyber', label: 'Cyber', description: 'Matrix-inspired' },
  { name: 'dracula', label: 'Dracula', description: 'Popular dark theme' },
  { name: 'solarized', label: 'Solarized', description: 'Easy on the eyes' },
];

export function ThemeSwitcher({ isOpen, onClose }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstButton = menuRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleThemeSelect = (themeName: ThemeName) => {
    setTheme(themeName);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % themes.length;
      const buttons = menuRef.current?.querySelectorAll('button');
      (buttons?.[nextIndex] as HTMLButtonElement)?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + themes.length) % themes.length;
      const buttons = menuRef.current?.querySelectorAll('button');
      (buttons?.[prevIndex] as HTMLButtonElement)?.focus();
    }
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Theme selection"
      className="fixed z-50 bg-surface border border-muted/20 rounded-lg shadow-xl py-2 min-w-[200px] left-[100px] bottom-6"
    >
      <div className="px-3 py-2 text-xs text-muted uppercase tracking-wider border-b border-muted/20 mb-1">
        Select Theme
      </div>
      {themes.map((t, index) => (
        <button
          key={t.name}
          role="menuitem"
          onClick={() => handleThemeSelect(t.name)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={`w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-muted/10 focus:bg-muted/10 focus:outline-none transition-colors ${
            theme === t.name ? 'text-blue' : 'text-text'
          }`}
        >
          <span
            className="w-4 h-4 rounded-full border-2"
            style={{
              borderColor: theme === t.name ? 'var(--blue)' : 'var(--muted)',
              backgroundColor: theme === t.name ? 'var(--blue)' : 'transparent',
            }}
          />
          <div>
            <div className="font-medium">{t.label}</div>
            <div className="text-xs text-muted">{t.description}</div>
          </div>
          {theme === t.name && (
            <span className="ml-auto text-xs text-blue">Active</span>
          )}
        </button>
      ))}
    </div>
  );
}
