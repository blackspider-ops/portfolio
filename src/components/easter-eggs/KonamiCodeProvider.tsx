'use client';

/**
 * Konami Code Provider
 * Listens for the Konami code sequence and navigates to /play
 * Requirements: 9.1 - WHEN a user enters the Konami code (↑↑↓↓←→←→BA Enter), navigate to /play
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Konami code sequence: ↑↑↓↓←→←→BA Enter
const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
  'Enter',
];

interface KonamiCodeContextValue {
  isActivated: boolean;
  resetSequence: () => void;
}

const KonamiCodeContext = createContext<KonamiCodeContextValue | undefined>(undefined);

interface KonamiCodeProviderProps {
  children: React.ReactNode;
}

export function KonamiCodeProvider({ children }: KonamiCodeProviderProps) {
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [isActivated, setIsActivated] = useState(false);
  const router = useRouter();

  const resetSequence = useCallback(() => {
    setSequenceIndex(0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Get the key code to match
      const keyCode = e.code || e.key;
      const expectedKey = KONAMI_SEQUENCE[sequenceIndex];

      // Check if the pressed key matches the expected key in the sequence
      if (keyCode === expectedKey || e.key === expectedKey) {
        const newIndex = sequenceIndex + 1;
        
        if (newIndex === KONAMI_SEQUENCE.length) {
          // Konami code completed!
          setIsActivated(true);
          setSequenceIndex(0);
          router.push('/play');
        } else {
          setSequenceIndex(newIndex);
        }
      } else {
        // Wrong key, reset sequence
        // But check if it's the start of a new sequence
        if (keyCode === KONAMI_SEQUENCE[0] || e.key === KONAMI_SEQUENCE[0]) {
          setSequenceIndex(1);
        } else {
          setSequenceIndex(0);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sequenceIndex, router]);

  return (
    <KonamiCodeContext.Provider value={{ isActivated, resetSequence }}>
      {children}
    </KonamiCodeContext.Provider>
  );
}

export function useKonamiCode() {
  const context = useContext(KonamiCodeContext);
  if (context === undefined) {
    throw new Error('useKonamiCode must be used within a KonamiCodeProvider');
  }
  return context;
}

/**
 * Utility function to check if a key sequence matches the Konami code
 * Useful for testing
 */
export function isKonamiSequence(keys: string[]): boolean {
  if (keys.length !== KONAMI_SEQUENCE.length) return false;
  return keys.every((key, index) => key === KONAMI_SEQUENCE[index]);
}

export { KONAMI_SEQUENCE };
