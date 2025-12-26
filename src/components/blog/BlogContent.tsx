'use client';

import { useBlogPosts } from '@/lib/hooks/useData';
import { BlogPostCard } from './BlogPostCard';

export function BlogContent() {
  const { data: posts } = useBlogPosts();

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--muted)] text-lg">
          No blog posts published yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
