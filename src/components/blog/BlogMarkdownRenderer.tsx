'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { CodeBlock } from './CodeBlock';

interface BlogMarkdownRendererProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="font-heading text-3xl md:text-4xl text-[var(--text)] mb-6 mt-10 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-heading text-2xl md:text-3xl text-[var(--text)] mb-4 mt-10">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-heading text-xl md:text-2xl text-[var(--text)] mb-3 mt-8">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-heading text-lg md:text-xl text-[var(--text)] mb-2 mt-6">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-[var(--text)] leading-relaxed mb-6 text-lg">
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
    <ul className="list-disc list-outside ml-6 mb-6 space-y-2 text-[var(--text)] text-lg">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-6 mb-6 space-y-2 text-[var(--text)] text-lg">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[var(--text)] leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[var(--blue)] pl-6 my-6 italic text-[var(--muted)] text-lg">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const match = /language-(\w+)/.exec(className || '');
    const isCodeBlock = match !== null;
    
    if (isCodeBlock) {
      const language = match[1];
      const code = String(children).replace(/\n$/, '');
      return <CodeBlock code={code} language={language} className="mb-6" />;
    }
    
    // Inline code
    return (
      <code className="bg-[var(--surface)] text-[var(--violet)] px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => {
    // If children is a code block with language, CodeBlock handles it
    // Otherwise, render as plain pre
    return <>{children}</>;
  },
  hr: () => (
    <hr className="border-[var(--muted)]/20 my-10" />
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full border border-[var(--muted)]/20 rounded-lg">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[var(--surface)]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-[var(--text)] font-semibold border-b border-[var(--muted)]/20">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-[var(--text)] border-b border-[var(--muted)]/20">
      {children}
    </td>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--text)]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),
  img: ({ src, alt }) => (
    <figure className="my-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={src} 
        alt={alt || ''} 
        className="rounded-lg w-full"
        loading="lazy"
        decoding="async"
      />
      {alt && (
        <figcaption className="text-center text-sm text-[var(--muted)] mt-3">
          {alt}
        </figcaption>
      )}
    </figure>
  ),
};

export function BlogMarkdownRenderer({ content, className = '' }: BlogMarkdownRendererProps) {
  return (
    <article className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
