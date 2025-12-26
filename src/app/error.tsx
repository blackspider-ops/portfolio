'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="phantom-panel p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h2 className="text-xl font-heading text-[var(--text)] mb-2">
          Something went wrong
        </h2>
        
        <p className="text-[var(--muted)] mb-6">
          An unexpected error occurred. Don&apos;t worry, these things happen.
        </p>

        {error.digest && (
          <p className="text-xs text-[var(--muted)] mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-[var(--blue)] text-[var(--bg)] rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-[var(--accent-border)] text-[var(--text)] rounded-lg font-medium hover:bg-[var(--surface)] transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
