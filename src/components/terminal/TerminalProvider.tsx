'use client';

/**
 * Terminal Provider
 * Provides terminal functionality throughout the app
 * Requirements: 6.1 - Toggle on tilde (~) key
 */

import { createContext, useContext, useCallback, useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSiteSettings } from '@/lib/hooks/useData';
import type { ProjectInfo, BlogPostInfo, SiteSettingsInfo } from './types';
import type { ThemeName } from '@/lib/design-tokens';

// Lazy load heavy components
const Terminal = lazy(() => import('./Terminal').then(mod => ({ default: mod.Terminal })));
const MatrixRain = lazy(() => import('@/components/easter-eggs').then(mod => ({ default: mod.MatrixRain })));

interface TerminalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  devNotesVisible: boolean;
  matrixActive: boolean;
  toggleMatrix: () => void;
}

const TerminalContext = createContext<TerminalContextValue | undefined>(undefined);

interface TerminalProviderProps {
  children: React.ReactNode;
  projects?: ProjectInfo[];
  blogPosts?: BlogPostInfo[];
}

export function TerminalProvider({
  children,
  projects = [],
  blogPosts = [],
}: TerminalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [devNotesVisible, setDevNotesVisible] = useState(false);
  const [matrixActive, setMatrixActive] = useState(false);
  const { setTheme } = useTheme();
  const router = useRouter();
  const { data: siteSettingsData } = useSiteSettings();

  // Transform site settings for terminal context
  const siteSettings: SiteSettingsInfo | undefined = siteSettingsData ? {
    owner_name: siteSettingsData.owner_name,
    hero_subhead: siteSettingsData.hero_subhead,
    social_links: siteSettingsData.social_links as SiteSettingsInfo['social_links'],
  } : undefined;

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const toggleMatrix = useCallback(() => {
    setMatrixActive((prev) => !prev);
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  // Handle theme change
  const handleSetTheme = useCallback((theme: string) => {
    if (['dark', 'cyber', 'dracula', 'solarized'].includes(theme)) {
      setTheme(theme as ThemeName);
    }
  }, [setTheme]);

  // Handle dev notes toggle
  const handleToggleDevNotes = useCallback(() => {
    setDevNotesVisible((prev) => !prev);
  }, []);

  // Global keyboard shortcut listener - Requirement 6.1
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on tilde (~) key - Requirement 6.1
      // Check for both ` (backtick) and ~ (tilde) since they're on the same key
      if (e.key === '`' || e.key === '~') {
        // Don't trigger if user is typing in an input/textarea
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return (
    <TerminalContext.Provider value={{ isOpen, open, close, toggle, devNotesVisible, matrixActive, toggleMatrix }}>
      {children}
      {isOpen && (
        <Suspense fallback={null}>
          <Terminal
            isOpen={isOpen}
            onClose={close}
            projects={projects}
            blogPosts={blogPosts}
            siteSettings={siteSettings}
            onNavigate={handleNavigate}
            onSetTheme={handleSetTheme}
            onToggleDevNotes={handleToggleDevNotes}
            onToggleMatrix={toggleMatrix}
          />
        </Suspense>
      )}
      {matrixActive && (
        <Suspense fallback={null}>
          <MatrixRain isActive={matrixActive} onClose={() => setMatrixActive(false)} />
        </Suspense>
      )}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (context === undefined) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
}
