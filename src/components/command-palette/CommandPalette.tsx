'use client';

/**
 * Command Palette Component - Phantom Protocol Style
 * A stealthy, dark command interface
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { useFeatureToggles } from '@/lib/hooks/useFeatureToggles';
import type { CommandItem, CommandPaletteProps, SearchableContent } from './types';
import { searchCommands, searchContent } from './search';

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);

const ProjectIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const BlogIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const ResumeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
);

const ContactIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ThemeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
  </svg>
);

const TerminalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="4,17 10,11 4,5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="16,3 21,3 21,8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21,16 21,21 16,21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
    <path d="M11 8v6M8 11h6" />
  </svg>
);

export function CommandPalette({
  isOpen,
  onClose,
  projects = [],
  blogPosts = [],
  onNavigate,
  onCopyEmail,
  onDownloadResume,
  onToggleTheme,
  onOpenTerminal,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const featureToggles = useFeatureToggles();

  const { containerRef } = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    restoreFocus: true,
    initialFocus: 'input[aria-label="Search commands"]',
  });

  const navigate = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
    onClose();
  }, [onNavigate, router, onClose]);

  const routeCommands: CommandItem[] = useMemo(() => [
    { id: 'route-home', type: 'route', title: 'Home', description: 'Navigate to home', icon: <HomeIcon />, action: () => navigate('/'), keywords: ['home', 'main'] },
    { id: 'route-projects', type: 'route', title: 'Projects', description: 'View all projects', icon: <ProjectIcon />, action: () => navigate('/projects'), keywords: ['projects', 'work'] },
    { id: 'route-blog', type: 'route', title: 'Blog', description: 'Read blog posts', icon: <BlogIcon />, action: () => navigate('/blog'), keywords: ['blog', 'posts'] },
    { id: 'route-resume', type: 'route', title: 'Resume', description: 'View resume', icon: <ResumeIcon />, action: () => navigate('/resume'), keywords: ['resume', 'cv'] },
    { id: 'route-contact', type: 'route', title: 'Contact', description: 'Get in touch', icon: <ContactIcon />, action: () => navigate('/contact'), keywords: ['contact', 'email'] },
  ], [navigate]);

  const actionCommands: CommandItem[] = useMemo(() => {
    const actions: CommandItem[] = [];
    if (onCopyEmail) {
      actions.push({ id: 'action-copy-email', type: 'action', title: 'Copy Email', description: 'Copy email to clipboard', icon: <CopyIcon />, action: () => { onCopyEmail(); onClose(); }, keywords: ['copy', 'email'] });
    }
    if (onDownloadResume) {
      actions.push({ id: 'action-download-resume', type: 'action', title: 'Download Resume', description: 'Download resume PDF', icon: <DownloadIcon />, action: () => { onDownloadResume(); onClose(); }, keywords: ['download', 'resume'] });
    }
    if (onToggleTheme) {
      actions.push({ id: 'action-toggle-theme', type: 'action', title: 'Toggle Theme', description: 'Switch themes', icon: <ThemeIcon />, action: () => { onToggleTheme(); onClose(); }, keywords: ['theme', 'dark'] });
    }
    // Only show terminal command if feature is enabled
    if (onOpenTerminal && featureToggles.terminal) {
      actions.push({ id: 'action-open-terminal', type: 'action', title: 'Open Terminal', description: 'Open terminal', icon: <TerminalIcon />, shortcut: '~', action: () => { onOpenTerminal(); onClose(); }, keywords: ['terminal', 'cli'] });
    }
    if (projects.length > 0) {
      actions.push({ id: 'action-random-project', type: 'action', title: 'Random Project', description: 'Navigate to random project', icon: <ShuffleIcon />, action: () => { const p = projects[Math.floor(Math.random() * projects.length)]; navigate(`/projects/${p.slug}`); }, keywords: ['random'] });
    }
    return actions;
  }, [onCopyEmail, onDownloadResume, onToggleTheme, onOpenTerminal, projects, navigate, onClose, featureToggles.terminal]);

  const projectCommands: CommandItem[] = useMemo(() => 
    projects.map((project) => ({ id: `project-${project.id}`, type: 'project' as const, title: project.title, description: project.description, icon: <ProjectIcon />, action: () => navigate(`/projects/${project.slug}`), keywords: project.keywords })),
  [projects, navigate]);

  const blogCommands: CommandItem[] = useMemo(() => 
    blogPosts.map((post) => ({ id: `blog-${post.id}`, type: 'blog' as const, title: post.title, description: post.description, icon: <BlogIcon />, action: () => navigate(`/blog/${post.slug}`), keywords: post.keywords })),
  [blogPosts, navigate]);

  const allCommands = useMemo(() => [...routeCommands, ...actionCommands, ...projectCommands, ...blogCommands], [routeCommands, actionCommands, projectCommands, blogCommands]);

  const filteredResults = useMemo(() => searchCommands(query, allCommands), [query, allCommands]);

  // Add Google search option when there's a query
  const searchGoogle = useCallback(() => {
    if (query.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query.trim())}`, '_blank');
      onClose();
    }
  }, [query, onClose]);

  // Results with Google search fallback
  const resultsWithFallback = useMemo(() => {
    if (!query.trim()) return filteredResults;
    
    const googleSearchItem: CommandItem = {
      id: 'search-google',
      type: 'action',
      title: `Search Google for "${query}"`,
      description: 'Open Google search in new tab',
      icon: <GoogleIcon />,
      action: searchGoogle,
      keywords: [],
    };
    
    // Add Google search as last option
    return [...filteredResults, googleSearchItem];
  }, [filteredResults, query, searchGoogle]);

  useEffect(() => { setSelectedIndex(0); }, [resultsWithFallback]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => { inputRef.current?.focus(); }, 10);
    }
  }, [isOpen]);

  useEffect(() => {
    if (listRef.current && resultsWithFallback.length > 0) {
      const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, resultsWithFallback.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSelectedIndex((p) => p < resultsWithFallback.length - 1 ? p + 1 : p); break;
      case 'ArrowUp': e.preventDefault(); setSelectedIndex((p) => p > 0 ? p - 1 : p); break;
      case 'Enter': e.preventDefault(); if (resultsWithFallback[selectedIndex]) resultsWithFallback[selectedIndex].action(); break;
    }
  }, [resultsWithFallback, selectedIndex]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-md"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        ref={containerRef}
        className="w-full max-w-xl rounded-xl overflow-hidden shadow-2xl focus-trap-container border border-white/10 bg-[var(--bg-void)]/70 backdrop-blur-xl"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
          <span className="text-[var(--muted)]"><SearchIcon /></span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, projects, posts..."
            className="flex-1 bg-transparent text-[var(--text)] placeholder:text-[var(--muted)] outline-none font-mono text-sm"
            aria-label="Search commands"
            autoComplete="off"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-[var(--muted)] bg-white/5 rounded border border-white/10 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2 bg-transparent" role="listbox" aria-label="Search results">
          {resultsWithFallback.length === 0 ? (
            <div className="px-4 py-8 text-center text-[var(--muted)] font-mono text-sm">
              // Type something to search
            </div>
          ) : (
            resultsWithFallback.map((item, index) => (
              <button
                key={item.id}
                data-index={index}
                onClick={() => item.action()}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors font-mono text-sm ${
                  index === selectedIndex
                    ? 'bg-white/10 text-[var(--text)] border-l-2 border-[var(--accent)]'
                    : 'text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)] border-l-2 border-transparent'
                }`}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <span className="flex-shrink-0 text-[var(--muted)]">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate">{item.title}</div>
                  {item.description && <div className="text-xs text-[var(--muted)] truncate opacity-60">{item.description}</div>}
                </div>
                {item.shortcut && (
                  <kbd className="flex-shrink-0 px-2 py-1 text-xs text-[var(--muted)] bg-white/5 rounded border border-white/10">
                    {item.shortcut}
                  </kbd>
                )}
                <span className="flex-shrink-0 text-xs text-[var(--muted)]/40 uppercase">{item.type}</span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-[var(--muted)] bg-white/5 font-mono">
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↵</kbd>
              <span>select</span>
            </span>
          </div>
          <span className="flex items-center gap-1 ml-auto">
            <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">ESC</kbd>
            <span>close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
