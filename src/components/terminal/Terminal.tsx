'use client';

/**
 * Terminal Component - Phantom Protocol Style
 * A stealthy, dark terminal interface
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { useTerminalCommands } from '@/lib/hooks/useTerminalCommands';
import type { TerminalProps, TerminalHistoryEntry, TerminalOutput, TerminalContext } from './types';
import { executeCommand } from './commands';

const PROMPT = 'phantom@protocol:~$ ';
const HISTORY_STORAGE_KEY = 'terminal-command-history';
const MAX_HISTORY_SIZE = 5;

export function Terminal({
  isOpen,
  onClose,
  projects = [],
  blogPosts = [],
  siteSettings,
  onNavigate,
  onSetTheme,
  onToggleDevNotes,
  onToggleMatrix,
}: TerminalProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalHistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  
  // Fetch custom commands from database
  const { commands: customCommands } = useTerminalCommands();

  const { containerRef } = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    restoreFocus: true,
    initialFocus: 'input[aria-label="Terminal input"]',
  });

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCommandHistory(parsed.slice(-MAX_HISTORY_SIZE));
        }
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  const saveCommandHistory = useCallback((newHistory: string[]) => {
    const trimmed = newHistory.slice(-MAX_HISTORY_SIZE);
    setCommandHistory(trimmed);
    try {
      sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  const createContext = useCallback((): TerminalContext => ({
    navigate: (path: string) => {
      onNavigate?.(path);
      onClose();
    },
    setTheme: (theme: string) => {
      onSetTheme?.(theme);
    },
    toggleDevNotes: () => {
      onToggleDevNotes?.();
    },
    toggleMatrix: () => {
      onToggleMatrix?.();
      onClose();
    },
    projects,
    blogPosts,
    siteSettings,
  }), [onNavigate, onSetTheme, onToggleDevNotes, onToggleMatrix, onClose, projects, blogPosts, siteSettings]);

  const handleExecute = useCallback(async () => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      setInput('');
      return;
    }

    saveCommandHistory([...commandHistory, trimmedInput]);
    setHistoryIndex(-1);

    const context = createContext();
    const output = await executeCommand(trimmedInput, context, customCommands);

    if (output.content === '__CLEAR__') {
      setHistory([]);
      setInput('');
      return;
    }

    setHistory((prev) => [
      ...prev,
      {
        command: trimmedInput,
        output,
        timestamp: Date.now(),
      },
    ]);

    setInput('');
  }, [input, commandHistory, saveCommandHistory, createContext, customCommands]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleExecute();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (commandHistory.length > 0) {
          const newIndex = historyIndex < commandHistory.length - 1 
            ? historyIndex + 1 
            : historyIndex;
          setHistoryIndex(newIndex);
          setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setInput('');
        }
        break;
      case 'l':
        if (e.ctrlKey) {
          e.preventDefault();
          setHistory([]);
        }
        break;
    }
  }, [handleExecute, commandHistory, historyIndex]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Focus input when clicking anywhere in the terminal
  const handleTerminalClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const renderOutput = (output: TerminalOutput) => {
    switch (output.type) {
      case 'error':
        return <span className="text-[var(--error)]">{output.content}</span>;
      case 'success':
        return <span className="text-[var(--success)]">{output.content}</span>;
      case 'ascii':
        return <pre className="text-[var(--text-secondary)] font-mono text-xs leading-tight">{output.content}</pre>;
      case 'list':
        return (
          <div>
            <div className="text-[var(--text)]">{output.content}</div>
            {output.items && (
              <div className="mt-1 text-[var(--muted)]">
                {output.items.map((item, i) => (
                  <div key={i} className="font-mono">{item}</div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return <span className="text-[var(--text)] whitespace-pre-wrap">{output.content}</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Terminal"
    >
      <div
        ref={containerRef}
        className="w-full max-w-3xl mx-4 rounded-xl overflow-hidden shadow-2xl focus-trap-container border border-white/10 bg-[var(--bg-void)]/70 backdrop-blur-xl cursor-text"
        onKeyDown={handleKeyDown}
        onClick={handleTerminalClick}
        tabIndex={-1}
      >
        {/* Terminal header - Phantom Style */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <button
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[var(--error)]/80 hover:bg-[var(--error)] transition-colors"
                aria-label="Close terminal"
              />
              <div className="w-3 h-3 rounded-full bg-[var(--warning)]/80" />
              <div className="w-3 h-3 rounded-full bg-[var(--success)]/80" />
            </div>
            <span className="text-sm text-[var(--muted)] font-mono">phantom@protocol</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-mono">
            <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">ESC</kbd>
            <span>close</span>
          </div>
        </div>

        {/* Terminal output area */}
        <div
          ref={outputRef}
          className="h-[400px] overflow-y-auto p-4 font-mono text-sm bg-transparent"
        >
          {/* Welcome message */}
          <div className="text-[var(--muted)] mb-4">
            <span className="text-[var(--success)]">[SYSTEM]</span> Phantom Protocol Terminal v1.0
            <br />
            <span className="text-[var(--muted)]">// Type &apos;help&apos; for available commands</span>
          </div>

          {/* Command history */}
          {history.map((entry, index) => (
            <div key={index} className="mb-3">
              <div className="flex">
                <span className="text-[var(--success)]">{PROMPT}</span>
                <span className="text-[var(--text)]">{entry.command}</span>
              </div>
              <div className="mt-1 ml-0">
                {renderOutput(entry.output)}
              </div>
            </div>
          ))}

          {/* Current input line */}
          <div className="flex items-center">
            <span className="text-[var(--success)]">{PROMPT}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent text-[var(--text)] outline-none font-mono caret-[var(--success)]"
              aria-label="Terminal input"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <span className="w-2 h-4 bg-[var(--text)] animate-cursor-blink" />
          </div>
        </div>

        {/* Terminal footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-[var(--muted)] bg-white/5 font-mono">
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↓</kbd>
              <span>history</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">Tab</kbd>
              <span>autocomplete</span>
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
