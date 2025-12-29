'use client';

import { ReactElement, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal, Search, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigationItems } from './useNavigationItems';
import { useFeatureToggles } from '@/lib/hooks/useFeatureToggles';
import {
  HomeIcon,
  AboutIcon,
  ProjectsIcon,
  BlogIcon,
  ResumeIcon,
  ContactIcon,
  ArcadeIcon,
  TerminalIcon,
  GitHubIcon,
  TwitterIcon,
  LinkedInIcon,
} from './icons';

interface BottomBarProps {
  onTerminal?: () => void;
  onCommandPalette?: () => void;
  onThemeToggle?: () => void;
}

const iconMap: Record<string, (props: { size: number }) => ReactElement> = {
  home: HomeIcon,
  about: AboutIcon,
  projects: ProjectsIcon,
  blog: BlogIcon,
  resume: ResumeIcon,
  contact: ContactIcon,
  arcade: ArcadeIcon,
  github: GitHubIcon,
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
};

export function BottomBar({ onTerminal, onCommandPalette, onThemeToggle }: BottomBarProps) {
  const pathname = usePathname();
  const { navItems } = useNavigationItems();
  const featureToggles = useFeatureToggles();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const getIcon = (iconName: string, size: number) => {
    const IconComponent = iconMap[iconName] || HomeIcon;
    return <IconComponent size={size} />;
  };

  // Filter out external links and arcade for mobile nav - only show main internal pages
  const internalNavItems = navItems.filter(item => !item.href.startsWith('http') && item.icon !== 'arcade');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleMenuAction = (action: () => void | undefined) => {
    setMenuOpen(false);
    action?.();
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-bg border-t border-muted/20 z-40 safe-area-pb"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-full px-1 relative">
        {/* All internal nav items */}
        {internalNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center min-w-[44px] h-full px-1 transition-colors duration-150 ${
                active ? 'text-text' : 'text-muted'
              }`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {getIcon(item.icon, 18)}
              {active && (
                <motion.span
                  layoutId="mobile-nav-indicator"
                  className="absolute bottom-1 h-[2px] w-5 bg-text rounded"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}

        {/* More menu button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`relative flex flex-col items-center justify-center min-w-[44px] h-full px-1 transition-colors duration-150 ${
              menuOpen ? 'text-text' : 'text-muted'
            }`}
            aria-label="More options"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={18} />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface border border-muted/20 rounded-lg shadow-xl overflow-hidden">
              {featureToggles.games && (
                <>
                  <Link
                    href="/play"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-text hover:bg-muted/10 transition-colors"
                  >
                    <ArcadeIcon size={18} className="text-muted" />
                    <span className="text-sm">Arcade</span>
                  </Link>
                  <div className="h-px bg-muted/20" />
                </>
              )}
              <button
                onClick={() => handleMenuAction(onCommandPalette!)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-text hover:bg-muted/10 transition-colors"
              >
                <Search size={18} className="text-muted" />
                <span className="text-sm">Command Palette</span>
              </button>
              {featureToggles.terminal && (
                <button
                  onClick={() => handleMenuAction(onTerminal!)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-text hover:bg-muted/10 transition-colors"
                >
                  <TerminalIcon size={18} className="text-muted" />
                  <span className="text-sm">Terminal</span>
                </button>
              )}
              <button
                onClick={() => handleMenuAction(onThemeToggle!)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-text hover:bg-muted/10 transition-colors"
              >
                <Palette size={18} className="text-muted" />
                <span className="text-sm">Change Theme</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
