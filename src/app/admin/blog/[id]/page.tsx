'use client';

import { useEffect, useState, useCallback, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { BlogPost } from '@/types/database';
import { useAutosave, AutosaveIndicator } from '@/lib/hooks/useAutosave';
import { PublishWorkflow, RevisionHistory, ImageUpload } from '@/components/admin';
import { saveRevision } from '@/lib/revisions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogEditorProps {
  params: Promise<{ id: string }>;
}

export default function BlogEditorPage({ params }: BlogEditorProps) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [bodyMd, setBodyMd] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [status, setStatus] = useState<BlogPost['status']>('draft');

  // Track original slug for redirect creation
  const [originalSlug, setOriginalSlug] = useState('');

  // Calculate reading time (average 200 words per minute)
  const calculateReadingTime = (text: string): number => {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const readingTime = calculateReadingTime(bodyMd);

  const fetchPost = useCallback(async () => {
    if (isNew) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      setError('Blog post not found');
      setIsLoading(false);
      return;
    }

    setTitle(data.title);
    setSlug(data.slug);
    setOriginalSlug(data.slug);
    setSummary(data.summary || '');
    setBodyMd(data.body_md);
    setTags(data.tags || []);
    setCoverUrl(data.cover_url || '');
    setStatus(data.status);
    setIsLoading(false);
    setHasInitialized(true);
  }, [id, isNew, supabase]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Autosave data object
  const autosaveData = useMemo(() => ({
    title,
    slug,
    summary: summary || null,
    body_md: bodyMd,
    tags,
    cover_url: coverUrl || null,
    reading_time_minutes: readingTime,
    status,
  }), [title, slug, summary, bodyMd, tags, coverUrl, readingTime, status]);

  // Autosave handler
  const handleAutosave = useCallback(async (data: typeof autosaveData) => {
    if (isNew || !hasInitialized || !data.title || !data.slug || !data.body_md) return;

    // Get current user for revision tracking
    const { data: userData } = await supabase.auth.getUser();

    // Get current content to save as revision before updating
    const { data: currentContent } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (currentContent) {
      // Save revision before updating
      await saveRevision({
        contentType: 'blog_post',
        contentId: id,
        data: currentContent,
        userId: userData.user?.id,
      });
    }

    // Check if slug changed and create redirect
    if (originalSlug && data.slug !== originalSlug) {
      await supabase.from('redirects').insert({
        from_path: `/blog/${originalSlug}`,
        to_path: `/blog/${data.slug}`,
      });
      setOriginalSlug(data.slug);
    }

    await supabase
      .from('blog_posts')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }, [id, isNew, hasInitialized, originalSlug, supabase]);

  const { status: autosaveStatus, lastSaved } = useAutosave({
    data: autosaveData,
    onSave: handleAutosave,
    interval: 5000,
    enabled: !isNew && hasInitialized && !!title && !!slug && !!bodyMd,
  });

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (isNew || !originalSlug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async () => {
    if (!title || !slug || !bodyMd) {
      setError('Title, slug, and content are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    const postData = {
      title,
      slug,
      summary: summary || null,
      body_md: bodyMd,
      tags,
      cover_url: coverUrl || null,
      reading_time_minutes: readingTime,
      status,
      updated_at: new Date().toISOString(),
    };

    try {
      // Get current user for revision tracking
      const { data: userData } = await supabase.auth.getUser();

      if (isNew) {
        const { data, error: insertError } = await supabase
          .from('blog_posts')
          .insert(postData)
          .select()
          .single();

        if (insertError) throw insertError;

        router.push(`/admin/blog/${data.id}`);
      } else {
        // Get current content to save as revision before updating
        const { data: currentContent } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', id)
          .single();

        if (currentContent) {
          // Save revision before updating
          await saveRevision({
            contentType: 'blog_post',
            contentId: id,
            data: currentContent,
            userId: userData.user?.id,
          });
        }

        // Check if slug changed and create redirect
        if (originalSlug && slug !== originalSlug) {
          await supabase.from('redirects').insert({
            from_path: `/blog/${originalSlug}`,
            to_path: `/blog/${slug}`,
          });
          setOriginalSlug(slug);
        }

        const { error: updateError } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', id);

        if (updateError) throw updateError;
      }
    } catch (err) {
      console.error('Error saving blog post:', err);
      setError('Failed to save blog post');
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !isNew && !title) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
          <a
            href="/admin/blog"
            className="inline-block mt-4 text-[var(--blue)] hover:underline"
          >
            ← Back to blog posts
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <a
            href="/admin/blog"
            className="text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            ← Back
          </a>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            {isNew ? 'New Blog Post' : 'Edit Blog Post'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <AutosaveIndicator status={autosaveStatus} lastSaved={lastSaved} />
          )}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              showPreview
                ? 'bg-[var(--blue)] text-white'
                : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                  placeholder="Post title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  Slug *
                </label>
                <div className="flex items-center">
                  <span className="text-[var(--muted)] text-sm mr-2">/blog/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                    placeholder="post-slug"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  Summary
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)] resize-none"
                  placeholder="Brief summary for previews and SEO"
                />
              </div>
            </div>
          </section>

          {/* Content Editor / Preview */}
          <section className="bg-[var(--surface)] rounded-lg border border-[var(--surface)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--bg)]">
              <span className="text-sm font-medium text-[var(--text)]">
                {showPreview ? 'Preview' : 'Content (Markdown)'}
              </span>
              <span className="text-xs text-[var(--muted)]">
                {readingTime} min read
              </span>
            </div>
            {showPreview ? (
              <div className="p-6 prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {bodyMd || '*No content yet*'}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={bodyMd}
                onChange={(e) => setBodyMd(e.target.value)}
                rows={20}
                className="w-full px-4 py-4 bg-[var(--bg)] text-[var(--text)] font-mono text-sm focus:outline-none resize-none"
                placeholder="Write your post content in Markdown..."
              />
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status (for new posts) or Publish Workflow (for existing) */}
          {isNew ? (
            <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
              <h2 className="text-sm font-semibold text-[var(--text)] mb-4">
                Status
              </h2>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BlogPost['status'])}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </section>
          ) : (
            <PublishWorkflow
              contentId={id}
              contentType="blog_post"
              currentStatus={status}
              slug={slug}
              onStatusChange={setStatus}
            />
          )}

          {/* Tags */}
          <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-4">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--bg)] text-[var(--text)] text-xs rounded"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-[var(--muted)] hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="Add tag"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-[var(--bg)] text-[var(--text)] text-sm rounded-lg hover:bg-[var(--bg)]/80 transition-colors border border-[var(--surface)]"
              >
                Add
              </button>
            </div>
          </section>

          {/* Cover Image */}
          <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
            <ImageUpload
              value={coverUrl}
              onChange={setCoverUrl}
              bucket="covers"
              label="Cover Image"
              aspectRatio="video"
            />
          </section>

          {/* Reading Time */}
          <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-2">
              Reading Time
            </h2>
            <p className="text-2xl font-mono text-[var(--blue)]">
              {readingTime} min
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Auto-calculated from content
            </p>
          </section>

          {/* Revision History (for existing posts) */}
          {!isNew && (
            <RevisionHistory
              contentId={id}
              contentType="blog_post"
              onRestore={fetchPost}
            />
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Post'}
            </button>
            <a
              href="/admin/blog"
              className="w-full px-4 py-2 bg-[var(--surface)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--surface)]/80 transition-colors text-center"
            >
              Cancel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
