'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BlogPost } from '@/types/database';

type StatusFilter = 'all' | 'draft' | 'published' | 'archived';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const supabase = createClient();

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
    } else {
      setPosts(data || []);
    }
    setIsLoading(false);
  }, [supabase, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    const { error } = await supabase.from('blog_posts').delete().eq('id', id);

    if (error) {
      console.error('Error deleting blog post:', error);
      alert('Failed to delete blog post');
    } else {
      setPosts(posts.filter((p) => p.id !== id));
    }
  };

  const getStatusBadgeClass = (status: BlogPost['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Blog Posts</h1>
        <a
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors"
        >
          <PlusIcon />
          New Post
        </a>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'draft', 'published', 'archived'] as StatusFilter[]).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-[var(--blue)] text-white'
                  : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-[var(--surface)] rounded-lg border border-[var(--surface)]">
          <p className="text-[var(--muted)] mb-4">No blog posts found</p>
          <a
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors"
          >
            <PlusIcon />
            Create your first post
          </a>
        </div>
      ) : (
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--surface)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--bg)]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Reading Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bg)]">
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-[var(--bg)]/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <a
                        href={`/admin/blog/${post.id}`}
                        className="text-sm font-medium text-[var(--text)] hover:text-[var(--blue)] transition-colors"
                      >
                        {post.title}
                      </a>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        /{post.slug}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusBadgeClass(
                        post.status
                      )}`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-[var(--bg)] text-[var(--muted)] rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-[var(--muted)]">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">
                    {post.reading_time_minutes
                      ? `${post.reading_time_minutes} min`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">
                    {new Date(post.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/admin/blog/${post.id}`}
                        className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                        title="Edit"
                      >
                        <EditIcon />
                      </a>
                      {post.status === 'published' && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                          title="View"
                        >
                          <ExternalLinkIcon />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-[var(--muted)] hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Icons
function PlusIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}
