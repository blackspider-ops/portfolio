'use client';

import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactNode;
  position?: 'right' | 'top';
}

export function Tooltip({ content, shortcut, children, position = 'right' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 200);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const shouldShow = isVisible || isFocused;

  const positionClasses = position === 'right'
    ? 'left-full ml-3 top-1/2 -translate-y-1/2'
    : 'bottom-full mb-3 left-1/2 -translate-x-1/2';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {children}
      {shouldShow && (
        <div
          role="tooltip"
          className={`absolute z-50 px-3 py-1.5 text-sm font-medium whitespace-nowrap
            bg-surface text-text rounded-md shadow-lg border border-muted/20
            pointer-events-none ${positionClasses}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-bg rounded font-mono text-muted">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}
