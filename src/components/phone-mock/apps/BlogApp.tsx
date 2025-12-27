'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { BlogPost } from '@/types/database';
import { getProxiedImageUrl } from '@/lib/image-proxy';

interface BlogAppProps {
  onClose: () => void;
}

export function BlogApp({ onClose }: BlogAppProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(10);
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <button onClick={onClose} className="text-blue-400 text-sm">
          ← Back
        </button>
        <h1 className="text-white font-semibold">Blog</h1>
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedPost(post)}
                className="bg-white/5 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform flex gap-4"
              >
                {post.cover_url && (
                  <div 
                    className="w-20 h-20 rounded-xl bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${getProxiedImageUrl(post.cover_url)})` }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold line-clamp-2 mb-1">{post.title}</h3>
                  <p className="text-white/50 text-xs mb-2">
                    {formatDate(post.published_at || post.created_at)}
                  </p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {posts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/50">No posts yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post detail modal */}
      <AnimatePresence>
        {selectedPost && (
          <PostDetail 
            post={selectedPost} 
            onClose={() => setSelectedPost(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PostDetail({ post, onClose }: { post: BlogPost; onClose: () => void }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="absolute inset-0 bg-[#0a0a0f] z-50 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 mt-12">
        <button onClick={onClose} className="text-blue-400 text-sm">
          ← Back
        </button>
        <h1 className="text-white font-semibold">Article</h1>
        <button className="text-blue-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {post.cover_url && (
          <div 
            className="h-48 bg-cover bg-center"
            style={{ backgroundImage: `url(${getProxiedImageUrl(post.cover_url)})` }}
          />
        )}
        
        <div className="p-4 space-y-4">
          <div>
            <p className="text-white/50 text-sm mb-2">
              {formatDate(post.published_at || post.created_at)}
            </p>
            <h2 className="text-xl text-white font-bold">{post.title}</h2>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="text-white/70 text-sm leading-relaxed">
            {post.summary || 'Read the full article on the website...'}
          </div>

          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-green-500 rounded-xl text-white text-center text-sm font-medium mt-6"
          >
            Read Full Article
          </a>
        </div>
      </div>
    </motion.div>
  );
}
