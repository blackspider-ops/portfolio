'use client';

import { ReactElement, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TerminalSquare, Search, Palette } from 'lucide-react';
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
  LinkIcon,
  GitHubIcon,
  TwitterIcon,
  LinkedInIcon,
} from './icons';
import { prefetchProjects, prefetchBlogPosts, prefetchSiteSettings } from '@/lib/hooks/useData';

const iconMap: Record<string, (props: { size: number }) => ReactElement> = {
  home: HomeIcon,
  about: AboutIcon,
  projects: ProjectsIcon,
  blog: BlogIcon,
  resume: ResumeIcon,
  contact: ContactIcon,
  arcade: ArcadeIcon,
  link: LinkIcon,
  github: GitHubIcon,
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
};

// Prefetch data for each route
const prefetchMap: Record<string, () => Promise<void>> = {
  '/projects': async () => { await prefetchProjects(); },
  '/blog': async () => { await prefetchBlogPosts(); },
  '/': async () => { await prefetchSiteSettings(); },
};

interface LeftRailProps {
  onCommandPalette?: () => void;
  onTerminal?: () => void;
  onThemeToggle?: () => void;
}

export function LeftRail({ onCommandPalette, onTerminal, onThemeToggle }: LeftRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { navItems, ownerInitials, isLoading } = useNavigationItems();
  const featureToggles = useFeatureToggles();
  
  // Track which item was clicked for instant visual feedback
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const isActive = (href: string) => {
    // If we have a pending click, use that for the indicator
    if (pendingHref !== null) {
      return href === pendingHref;
    }
    // Otherwise use the actual pathname
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Clear pending state when pathname changes (navigation complete)
  if (pendingHref !== null && (pendingHref === pathname || pathname.startsWith(pendingHref))) {
    setPendingHref(null);
  }

  // Filter nav items based on feature toggles
  const filteredNavItems = navItems.filter(item => {
    // Hide arcade if games feature is disabled
    if (item.icon === 'arcade' && !featureToggles.games) return false;
    return true;
  });

  const getIcon = (iconName: string, size: number) => {
    const IconComponent = iconMap[iconName] || HomeIcon;
    return <IconComponent size={size} />;
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    // Instantly move the indicator
    setPendingHref(href);
    // Navigate immediately
    router.push(href);
  };

  // Prefetch on hover for faster navigation
  const handleMouseEnter = useCallback((href: string) => {
    // Prefetch the Next.js page
    router.prefetch(href);
    // Prefetch the data for that page
    const prefetchFn = prefetchMap[href];
    if (prefetchFn) {
      prefetchFn().catch(() => {}); // Silently fail
    }
  }, [router]);

  // Prevent backspace from navigating back when focused on sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent backspace from navigating back unless in an input/textarea
      if (e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Don't render nav items until loaded to prevent flash
  if (isLoading) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-[92px] flex-col items-center py-6 bg-[var(--bg)] border-r border-[var(--muted)]/10 z-40 hidden lg:flex">
        {/* Monogram placeholder */}
        <div className="w-11 h-11 border border-[var(--muted)]/30 flex items-center justify-center mb-8">
          <span className="font-heading font-bold text-xl tracking-tighter text-[var(--text)]">{ownerInitials}</span>
        </div>
        {/* Empty nav area while loading */}
        <nav className="flex flex-col items-center gap-1 flex-1" />
        {/* Utilities still show */}
        <div className="flex flex-col items-center gap-1 mt-auto">
          <button 
            className="relative flex items-center justify-center w-12 h-12 text-[var(--muted)] hover:text-[var(--text)] transition-colors duration-150 bg-transparent border-none cursor-pointer group"
            aria-label="Search" 
            onClick={onCommandPalette}
          >
            <Search size={18} />
          </button>
          {featureToggles.terminal && (
            <button 
              className="relative flex items-center justify-center w-12 h-12 text-[var(--muted)] hover:text-[var(--text)] transition-colors duration-150 bg-transparent border-none cursor-pointer group"
              aria-label="Terminal" 
              onClick={onTerminal}
            >
              <TerminalSquare size={18} />
            </button>
          )}
          <button 
            className="relative flex items-center justify-center w-12 h-12 text-[var(--muted)] hover:text-[var(--text)] transition-colors duration-150 bg-transparent border-none cursor-pointer group"
            aria-label="Theme" 
            onClick={onThemeToggle}
          >
            <Palette size={18} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[92px] flex-col items-center py-6 bg-[var(--bg)] border-r border-[var(--muted)]/10 z-40 hidden lg:flex">
      {/* Monogram */}
      <div className="w-11 h-11 border border-[var(--muted)]/30 flex items-center justify-center mb-8">
        <span className="font-heading font-bold text-xl tracking-tighter text-[var(--text)]">{ownerInitials}</span>
      </div>

      {/* Main Nav */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {filteredNavItems.map((item) => {
          const active = isActive(item.href);
          const isExternal = item.href.startsWith('http');

          // External links use <a> tag
          if (isExternal) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center justify-center w-12 h-12 transition-colors duration-150 group text-[var(--muted)] hover:text-[var(--text)]"
              >
                <div className="relative flex items-center justify-center">
                  {getIcon(item.icon, 20)}
                </div>
                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--surface)] text-[var(--text)] text-sm whitespace-nowrap rounded-md border border-[var(--muted)]/20 opacity-0 -translate-x-2 pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 flex items-center gap-1">
                  {item.label}
                  <span className="text-[var(--muted)]">↗</span>
                </span>
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={(e) => handleNavClick(e, item.href)}
              onMouseEnter={() => handleMouseEnter(item.href)}
              className={`relative flex items-center justify-center w-12 h-12 transition-colors duration-150 group ${
                active ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {getIcon(item.icon, 20)}
                {active && (
                  <motion.div
                    layoutId="rail-highlight"
                    className="absolute -left-5 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[var(--text)] rounded-r"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </div>
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--surface)] text-[var(--text)] text-sm whitespace-nowrap rounded-md border border-[var(--muted)]/20 opacity-0 -translate-x-2 pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Utilities */}
      <div className="flex flex-col items-center gap-1 mt-auto">
        <button 
          className="relative flex items-center justify-center w-12 h-12 text-[var(--muted)] hover:text-[var(--text)] transition-colors duration-150 bg-transparent border-none cursor-pointer group"
          aria-label="Search" 
          onClick={onCommandPalette}
        >
          <Search size={18} />
          <span className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--surface)] text-[var(--text)] text-sm whitespace-nowrap rounded-md border border-[var(--muted)]/20 opacity-0 -translate-x-2 pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0">
            Command Palette
          </span>
        </button>
        {featureToggles.terminal && (
          <button 
            className="relative flex items-center justify-center w-12 h-12 text-[var(--muted)] hover:text-[var(--text)] transition-colors duration-150 bg-transparent border-none cursor-pointer group"
            aria-label="Terminal" 
            onClick={onTerminal}
          >
            <TerminalSquare size={18} />
            <span className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--surface)] text-[var(--text)] text-sm whitespace-nowrap rounded-md border border-[var(--muted)]/20 opacity-0 -translate-x-2 pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0">
              Terminal
            </span>
          </button>
        )}
        <button 
          className="relative flex items-center justify-center w-12 h-12 text-[var(--muted)] hover:text-[var(--text)] transition-colors duration-150 bg-transparent border-none cursor-pointer group"
          aria-label="Theme" 
          onClick={onThemeToggle}
        >
          <Palette size={18} />
          <span className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--surface)] text-[var(--text)] text-sm whitespace-nowrap rounded-md border border-[var(--muted)]/20 opacity-0 -translate-x-2 pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0">
            Theme
          </span>
        </button>
      </div>
    </aside>
  );
}
