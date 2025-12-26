'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="font-heading text-3xl md:text-4xl text-[var(--text)] mb-6 mt-8 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-heading text-2xl md:text-3xl text-[var(--text)] mb-4 mt-8">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-heading text-xl md:text-2xl text-[var(--text)] mb-3 mt-6">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-[var(--text)] leading-relaxed mb-4">
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-[var(--blue)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] rounded"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-4 space-y-2 text-[var(--text)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-4 space-y-2 text-[var(--text)]">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[var(--text)]">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[var(--blue)] pl-4 my-4 italic text-[var(--muted)]">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-[var(--surface)] text-[var(--violet)] px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className={className}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-[var(--surface)] rounded-lg p-4 overflow-x-auto mb-4 border border-[var(--muted)]/20">
      {children}
    </pre>
  ),
  hr: () => (
    <hr className="border-[var(--muted)]/20 my-8" />
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border border-[var(--muted)]/20 rounded-lg">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-[var(--surface)] px-4 py-2 text-left text-[var(--text)] font-semibold border-b border-[var(--muted)]/20">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 text-[var(--text)] border-b border-[var(--muted)]/20">
      {children}
    </td>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--text)]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),
};

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
