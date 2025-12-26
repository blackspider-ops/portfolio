'use client';

import Link from 'next/link';
import type { BlogPost } from '@/types/database';
import { getProxiedImageUrl } from '@/lib/image-proxy';

interface RecentBlogSectionProps {
  posts: BlogPost[];
}

function BlogCard({ post }: { post: BlogPost }) {
  const coverUrl = getProxiedImageUrl(post.cover_url);
  
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative bg-surface border border-muted/20 rounded-xl overflow-hidden 
        transition-all duration-300 hover:border-blue/50 hover:shadow-lg hover:shadow-blue/5
        focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 focus:ring-offset-bg"
    >
      {coverUrl && (
        <div className="relative h-40 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
        </div>
      )}
      
      <div className={`p-5 ${!coverUrl ? 'pt-6' : ''}`}>
        <h3 className="font-heading text-lg text-text mb-2 group-hover:text-blue transition-colors">
          {post.title}
        </h3>
        
        {post.summary && (
          <p className="text-muted text-sm line-clamp-2 mb-4">{post.summary}</p>
        )}
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 bg-muted/10 text-muted text-xs font-mono uppercase rounded">
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs text-muted font-mono">+{post.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <svg className="w-5 h-5 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </Link>
  );
}

export function RecentBlogSection({ posts }: RecentBlogSectionProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted">RECENT TRANSMISSIONS</h2>
        <span className="text-xs text-muted font-mono">{posts.length} POSTS</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-muted/20 rounded-md text-text text-sm font-mono uppercase tracking-wide hover:bg-muted/10 hover:border-muted/40 transition-all"
        >
          VIEW_ALL_POSTS
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
