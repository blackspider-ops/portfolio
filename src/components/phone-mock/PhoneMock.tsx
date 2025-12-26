'use client';

/**
 * Phone Mock Component
 * Requirements: 8.1-8.5
 * - Floating phone frame toggleable from Home or Workbench
 * - Navigation between apps via swipe, arrow keys, or tab buttons
 * - Long-press on project cards shows stack chips and key tradeoff
 * - Share to Story generates 1080×1920 PNG
 * - Fully keyboard accessible
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PhoneMockProps, PhoneAppId, PhoneApp } from './types';
import { PhoneProjectsApp } from './apps/PhoneProjectsApp';
import { PhoneBlogApp } from './apps/PhoneBlogApp';
import { PhoneResumeApp } from './apps/PhoneResumeApp';
import { PhoneContactApp } from './apps/PhoneContactApp';

// App definitions with icons
const PHONE_APPS: PhoneApp[] = [
  {
    id: 'projects',
    name: 'Projects',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'blog',
    name: 'Blog',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    id: 'resume',
    name: 'Resume',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'contact',
    name: 'Contact',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export function PhoneMock({ isOpen, onClose, initialApp = 'projects' }: PhoneMockProps) {
  const [activeApp, setActiveApp] = useState<PhoneAppId>(initialApp);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Reset to initial app when opened
  useEffect(() => {
    if (isOpen) {
      setActiveApp(initialApp);
    }
  }, [isOpen, initialApp]);

  // Focus management - Requirement 8.5
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        containerRef.current?.focus();
      }, 10);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Get current app index
  const currentAppIndex = PHONE_APPS.findIndex((app) => app.id === activeApp);

  // Navigate to next/previous app
  const navigateApp = useCallback((direction: 'next' | 'prev') => {
    const newIndex =
      direction === 'next'
        ? (currentAppIndex + 1) % PHONE_APPS.length
        : (currentAppIndex - 1 + PHONE_APPS.length) % PHONE_APPS.length;
    setActiveApp(PHONE_APPS[newIndex].id);
  }, [currentAppIndex]);

  // Handle keyboard navigation - Requirement 8.5
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        navigateApp('prev');
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateApp('next');
        break;
    }
  }, [onClose, navigateApp]);

  // Swipe gesture handling - Requirement 8.2
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      navigateApp('next');
    } else if (isRightSwipe) {
      navigateApp('prev');
    }
  };

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Render active app content
  const renderAppContent = () => {
    switch (activeApp) {
      case 'projects':
        return <PhoneProjectsApp />;
      case 'blog':
        return <PhoneBlogApp />;
      case 'resume':
        return <PhoneResumeApp />;
      case 'contact':
        return <PhoneContactApp />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Phone Mock"
    >
      {/* Phone frame - responsive sizing */}
      <div
        ref={containerRef}
        className="relative w-[90vw] max-w-[375px] h-[80vh] max-h-[812px] bg-black rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border-[10px] sm:border-[14px] border-gray-800"
        onKeyDown={handleKeyDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        tabIndex={-1}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10" />

        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-[var(--surface)] flex items-center justify-between px-8 pt-2 z-[5]">
          <span className="text-xs text-[var(--muted)] font-mono">9:41</span>
          <div className="flex items-center gap-1">
            <SignalIcon className="w-4 h-4 text-[var(--muted)]" />
            <WifiIcon className="w-4 h-4 text-[var(--muted)]" />
            <BatteryIcon className="w-4 h-4 text-[var(--muted)]" />
          </div>
        </div>

        {/* App content area */}
        <div className="absolute top-12 left-0 right-0 bottom-20 bg-[var(--bg)] overflow-y-auto">
          {renderAppContent()}
        </div>

        {/* Tab bar - Requirement 8.2 */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-[var(--surface)] border-t border-[var(--muted)]/20 flex items-center justify-around px-4 pb-4">
          {PHONE_APPS.map((app) => (
            <button
              key={app.id}
              onClick={() => setActiveApp(app.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeApp === app.id
                  ? 'text-[var(--blue)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
              aria-label={app.name}
              aria-current={activeApp === app.id ? 'page' : undefined}
            >
              {app.icon}
              <span className="text-xs">{app.name}</span>
            </button>
          ))}
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-[var(--muted)]/50 rounded-full" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[var(--surface)]/80 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          aria-label="Close phone mock"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Keyboard hints - hidden on mobile */}
      <div className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 items-center gap-4 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-[var(--surface)] rounded border border-[var(--muted)]/30">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-[var(--surface)] rounded border border-[var(--muted)]/30">→</kbd>
          <span>Navigate</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-[var(--surface)] rounded border border-[var(--muted)]/30">ESC</kbd>
          <span>Close</span>
        </span>
      </div>
    </div>
  );
}

// Status bar icons
function SignalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 20h2V10H2v10zm4 0h2V8H6v12zm4 0h2V4h-2v16zm4 0h2V6h-2v14zm4 0h2V2h-2v18z" />
    </svg>
  );
}

function WifiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0-4c2.2 0 4 1.8 4 4h-2c0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.2 1.8-4 4-4zm0-4c3.3 0 6 2.7 6 6h-2c0-2.2-1.8-4-4-4s-4 1.8-4 4H6c0-3.3 2.7-6 6-6zm0-4c4.4 0 8 3.6 8 8h-2c0-3.3-2.7-6-6-6s-6 2.7-6 6H4c0-4.4 3.6-8 8-8z" />
    </svg>
  );
}

function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17 4h-3V2h-4v2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 18H7V6h10v16z" />
    </svg>
  );
}
