/**
 * Focus Trap Hook
 * Requirements: 15.5 - Focus traps in Terminal, Workbench, and Command Palette
 * 
 * This hook manages focus trapping within a container element,
 * ensuring keyboard users cannot tab outside of modal dialogs.
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  isActive: boolean;
  /** Callback when escape is pressed */
  onEscape?: () => void;
  /** Whether to restore focus when deactivated */
  restoreFocus?: boolean;
  /** Initial element to focus (selector or ref) */
  initialFocus?: string | React.RefObject<HTMLElement>;
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isActive,
  onEscape,
  restoreFocus = true,
  initialFocus,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    const elements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    return Array.from(elements).filter(
      (el) => el.offsetParent !== null && !el.hasAttribute('aria-hidden')
    );
  }, []);

  // Focus the first focusable element or initial focus target
  const focusFirstElement = useCallback(() => {
    if (!containerRef.current) return;

    // Try initial focus first
    if (initialFocus) {
      if (typeof initialFocus === 'string') {
        const element = containerRef.current.querySelector<HTMLElement>(initialFocus);
        if (element) {
          element.focus();
          return;
        }
      } else if (initialFocus.current) {
        initialFocus.current.focus();
        return;
      }
    }

    // Fall back to first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      // If no focusable elements, focus the container itself
      containerRef.current.focus();
    }
  }, [getFocusableElements, initialFocus]);

  // Handle keyboard events for focus trapping
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive || !containerRef.current) return;

      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
        return;
      }

      // Handle Tab key for focus trapping
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        // Shift+Tab from first element -> focus last element
        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
          return;
        }

        // Tab from last element -> focus first element
        if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
          return;
        }

        // If focus is outside the container, bring it back
        if (!containerRef.current.contains(activeElement)) {
          event.preventDefault();
          if (event.shiftKey) {
            lastElement.focus();
          } else {
            firstElement.focus();
          }
        }
      }
    },
    [isActive, onEscape, getFocusableElements]
  );

  // Activate/deactivate focus trap
  useEffect(() => {
    if (isActive) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the first element after a short delay to ensure the container is rendered
      const timeoutId = setTimeout(() => {
        focusFirstElement();
      }, 10);

      // Add keyboard event listener
      document.addEventListener('keydown', handleKeyDown, true);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    } else {
      // Restore focus when deactivated
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [isActive, focusFirstElement, handleKeyDown, restoreFocus]);

  // Prevent focus from leaving the container via click
  useEffect(() => {
    if (!isActive) return;

    const handleFocusIn = (event: FocusEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        event.preventDefault();
        focusFirstElement();
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [isActive, focusFirstElement]);

  return {
    containerRef,
    getFocusableElements,
    focusFirstElement,
  };
}

export default useFocusTrap;
