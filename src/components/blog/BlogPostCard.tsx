'use client';

import Link from 'next/link';
import type { BlogPost } from '@/types/database';
import { getProxiedImageUrl } from '@/lib/image-proxy';

interface BlogPostCardProps {
  post: BlogPost;
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const coverUrl = getProxiedImageUrl(post.cover_url);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-[var(--surface)] rounded-xl border border-[var(--muted)]/20 
                 overflow-hidden transition-all duration-300
                 hover:border-[var(--blue)]/50 hover:shadow-lg hover:shadow-[var(--blue)]/10
                 focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
    >
      {/* Cover Image */}
      {coverUrl && (
        <div className="relative h-48 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] to-transparent" />
        </div>
      )}
      
      {/* Content */}
      <div className={`p-5 ${!coverUrl ? 'pt-6' : ''}`}>
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-[var(--blue)]/10 text-[var(--blue)] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-heading text-xl text-[var(--text)] mb-2 group-hover:text-[var(--blue)] transition-colors line-clamp-2">
          {post.title}
        </h3>
        
        {post.summary && (
          <p className="text-[var(--muted)] text-sm line-clamp-2 mb-4">
            {post.summary}
          </p>
        )}
        
        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
          {formattedDate && (
            <span>{formattedDate}</span>
          )}
          {post.reading_time_minutes && (
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              {post.reading_time_minutes} min read
            </span>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-5 h-5 text-[var(--blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </Link>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
