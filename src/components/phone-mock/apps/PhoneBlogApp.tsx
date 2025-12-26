'use client';

/**
 * Phone Blog App
 * Requirements: 8.2
 * - Display blog posts in phone-style cards
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { BlogPost } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { PhoneShareButton } from '../PhoneShareButton';
import { getProxiedImageUrl } from '@/lib/image-proxy';

interface PhoneBlogCardProps {
  post: BlogPost;
}

function PhoneBlogCard({ post }: PhoneBlogCardProps) {
  const coverUrl = getProxiedImageUrl(post.cover_url);
  
  return (
    <div className="bg-[var(--surface)] rounded-xl overflow-hidden border border-[var(--muted)]/20">
      {/* Cover image */}
      {coverUrl && (
        <div className="relative h-32 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading text-base text-[var(--text)] mb-1">
          {post.title}
        </h3>
        {post.summary && (
          <p className="text-[var(--muted)] text-sm line-clamp-2 mb-3">
            {post.summary}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-[var(--muted)] mb-3">
          {post.reading_time_minutes && (
            <span>{post.reading_time_minutes} min read</span>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-1">
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-[var(--bg)] rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/blog/${post.slug}`}
            className="text-xs text-[var(--blue)] hover:underline"
          >
            Read More
          </Link>
          <PhoneShareButton
            title={post.title}
            coverUrl={coverUrl}
            type="blog"
          />
        </div>
      </div>
    </div>
  );
}

export function PhoneBlogApp() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 bg-[var(--surface)] rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="font-heading text-xl text-[var(--text)] mb-4">Blog</h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <PhoneBlogCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <p className="text-[var(--muted)] text-center py-8">
            No blog posts yet
          </p>
        )}
      </div>
    </div>
  );
}
