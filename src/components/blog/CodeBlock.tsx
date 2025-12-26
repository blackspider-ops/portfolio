'use client';

import { useState, useEffect } from 'react';
import { codeToHtml } from 'shiki';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = 'text', className = '' }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function highlight() {
      try {
        const highlighted = await codeToHtml(code, {
          lang: language,
          theme: 'github-dark',
        });
        setHtml(highlighted);
      } catch {
        // Fallback to plain text if language not supported
        setHtml(`<pre><code>${escapeHtml(code)}</code></pre>`);
      }
    }
    highlight();
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg bg-[var(--bg)]/80 text-[var(--muted)] 
                   hover:text-[var(--text)] hover:bg-[var(--bg)] transition-all
                   opacity-0 group-hover:opacity-100 focus:opacity-100
                   focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
        aria-label={copied ? 'Copied!' : 'Copy code'}
      >
        {copied ? (
          <CheckIcon className="w-4 h-4 text-[var(--green)]" />
        ) : (
          <CopyIcon className="w-4 h-4" />
        )}
      </button>

      {/* Language badge */}
      {language && language !== 'text' && (
        <span className="absolute top-3 left-3 px-2 py-0.5 text-xs bg-[var(--bg)]/80 text-[var(--muted)] rounded">
          {language}
        </span>
      )}

      {/* Code content */}
      {html ? (
        <div 
          className="rounded-lg overflow-x-auto [&_pre]:p-4 [&_pre]:pt-10 [&_pre]:bg-[var(--surface)] [&_pre]:border [&_pre]:border-[var(--muted)]/20 [&_code]:font-mono [&_code]:text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="p-4 pt-10 bg-[var(--surface)] rounded-lg border border-[var(--muted)]/20 overflow-x-auto">
          <code className="font-mono text-sm text-[var(--text)]">{code}</code>
        </pre>
      )}
    </div>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
