'use client';

import Link from 'next/link';
import { Tooltip } from './Tooltip';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  isActive?: boolean;
  onClick?: () => void;
  tooltipPosition?: 'right' | 'top';
}

export function NavItem({
  href,
  icon,
  label,
  shortcut,
  isActive = false,
  onClick,
  tooltipPosition = 'right',
}: NavItemProps) {
  // For mobile (tooltipPosition="top"), show indicator at bottom; otherwise on left
  const isMobile = tooltipPosition === 'top';
  
  const content = (
    <span className="relative flex items-center justify-center w-12 h-12 text-muted hover:text-text transition-colors">
      {icon}
      {/* Active indicator - bottom for mobile, left for desktop */}
      {isActive && (
        <span 
          className={`absolute bg-text rounded ${
            isMobile 
              ? 'bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-6' 
              : 'left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-r'
          }`}
          aria-hidden="true" 
        />
      )}
    </span>
  );

  if (onClick) {
    return (
      <Tooltip content={label} shortcut={shortcut} position={tooltipPosition}>
        <button 
          onClick={onClick} 
          className="block focus:outline-none focus-visible:ring-1 focus-visible:ring-muted rounded" 
          aria-label={label} 
          aria-current={isActive ? 'page' : undefined}
        >
          {content}
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={label} shortcut={shortcut} position={tooltipPosition}>
      <Link 
        href={href} 
        className="block focus:outline-none focus-visible:ring-1 focus-visible:ring-muted rounded" 
        aria-label={label} 
        aria-current={isActive ? 'page' : undefined}
      >
        {content}
      </Link>
    </Tooltip>
  );
}
