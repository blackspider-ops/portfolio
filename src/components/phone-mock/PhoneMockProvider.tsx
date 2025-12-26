'use client';

/**
 * Phone Mock Provider
 * Provides phone mock functionality throughout the app
 * Requirements: 8.1 - Toggleable from Home or Workbench
 * Requirements: 14.3 - Lazy-load interactive components
 */

import { createContext, useContext, useCallback, useState, lazy, Suspense } from 'react';
import type { PhoneMockContextValue, PhoneAppId } from './types';

// Lazy load the PhoneMock component for performance - Requirement 14.3
const PhoneMock = lazy(() => import('./PhoneMock').then(mod => ({ default: mod.PhoneMock })));

const PhoneMockContext = createContext<PhoneMockContextValue | undefined>(undefined);

interface PhoneMockProviderProps {
  children: React.ReactNode;
}

// Loading fallback for phone mock
function PhoneMockLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="text-[var(--muted)] font-mono text-sm animate-pulse">
        Loading...
      </div>
    </div>
  );
}

export function PhoneMockProvider({ children }: PhoneMockProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialApp, setInitialApp] = useState<PhoneAppId>('projects');

  const open = useCallback((app: PhoneAppId = 'projects') => {
    setInitialApp(app);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <PhoneMockContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      {/* Only render PhoneMock when open to avoid loading until needed */}
      {isOpen && (
        <Suspense fallback={<PhoneMockLoadingFallback />}>
          <PhoneMock isOpen={isOpen} onClose={close} initialApp={initialApp} />
        </Suspense>
      )}
    </PhoneMockContext.Provider>
  );
}

export function usePhoneMock() {
  const context = useContext(PhoneMockContext);
  if (context === undefined) {
    throw new Error('usePhoneMock must be used within a PhoneMockProvider');
  }
  return context;
}
