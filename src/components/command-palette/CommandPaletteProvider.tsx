'use client';

/**
 * Command Palette Provider
 * Provides command palette functionality throughout the app
 * Requirements: 5.1-5.7
 */

import { createContext, useContext, useCallback, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useCommandPalette } from './useCommandPalette';
import { useTheme } from '@/components/providers/ThemeProvider';
import type { SearchableContent } from './types';
import type { ThemeName } from '@/lib/design-tokens';

// Lazy load the command palette
const CommandPalette = lazy(() => import('./CommandPalette').then(mod => ({ default: mod.CommandPalette })));

interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | undefined>(undefined);

interface CommandPaletteProviderProps {
  children: React.ReactNode;
  projects?: SearchableContent[];
  blogPosts?: SearchableContent[];
  email?: string;
  resumeUrl?: string;
  onOpenTerminal?: () => void;
}

// Theme cycle order
const THEME_CYCLE: ThemeName[] = ['dark', 'cyber', 'dracula', 'solarized'];

export function CommandPaletteProvider({
  children,
  projects = [],
  blogPosts = [],
  email,
  resumeUrl = '/resume',
  onOpenTerminal,
}: CommandPaletteProviderProps) {
  const { isOpen, open, close, toggle } = useCommandPalette();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Copy email action - Requirement 5.3
  const handleCopyEmail = useCallback(async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  }, [email]);

  // Download resume action - Requirement 5.3
  const handleDownloadResume = useCallback(() => {
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.download = 'resume.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [resumeUrl]);

  // Toggle theme action - Requirement 5.3
  const handleToggleTheme = useCallback(() => {
    const currentIndex = THEME_CYCLE.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    setTheme(THEME_CYCLE[nextIndex]);
  }, [theme, setTheme]);

  // Navigate handler
  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      {isOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={isOpen}
            onClose={close}
            projects={projects}
            blogPosts={blogPosts}
            onNavigate={handleNavigate}
            onCopyEmail={handleCopyEmail}
            onDownloadResume={handleDownloadResume}
            onToggleTheme={handleToggleTheme}
            onOpenTerminal={onOpenTerminal}
          />
        </Suspense>
      )}
      {/* Copy feedback toast */}
      {copyFeedback && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-green text-bg rounded-lg shadow-lg animate-fade-in">
          Email copied to clipboard!
        </div>
      )}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPaletteContext() {
  const context = useContext(CommandPaletteContext);
  if (context === undefined) {
    throw new Error('useCommandPaletteContext must be used within a CommandPaletteProvider');
  }
  return context;
}
