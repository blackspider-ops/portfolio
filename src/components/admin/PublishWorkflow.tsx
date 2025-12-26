'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { revalidateContent } from '@/app/admin/actions/revalidate';

type ContentStatus = 'draft' | 'published' | 'archived';
type ContentType = 'project' | 'blog_post' | 'page';

interface PublishWorkflowProps {
  contentId: string;
  contentType: ContentType;
  currentStatus: ContentStatus;
  slug: string;
  onStatusChange: (status: ContentStatus) => void;
}

export function PublishWorkflow({
  contentId,
  contentType,
  currentStatus,
  slug,
  onStatusChange,
}: PublishWorkflowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const supabase = createClient();

  const getTableName = () => {
    switch (contentType) {
      case 'project':
        return 'projects';
      case 'blog_post':
        return 'blog_posts';
      case 'page':
        return 'pages';
    }
  };

  const getPublicPath = () => {
    switch (contentType) {
      case 'project':
        return `/projects/${slug}`;
      case 'blog_post':
        return `/blog/${slug}`;
      case 'page':
        return `/${slug}`;
    }
  };

  const handleGeneratePreview = async () => {
    setIsLoading(true);
    try {
      // Generate a preview token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

      const { data: user } = await supabase.auth.getUser();

      await supabase.from('preview_tokens').insert({
        token,
        content_type: contentType,
        content_id: contentId,
        expires_at: expiresAt,
        created_by: user.user?.id,
      });

      const previewPath = `/preview/${contentType}/${slug}?token=${token}`;
      setPreviewUrl(`${window.location.origin}${previewPath}`);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate preview link');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this content?')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from(getTableName())
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (error) throw error;
      
      // Revalidate cache for affected routes (Requirement 23.2)
      await revalidateContent(contentType, slug);
      
      onStatusChange('published');
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Failed to publish content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish this content? It will become a draft.')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from(getTableName())
        .update({
          status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (error) throw error;
      
      // Revalidate cache for affected routes (Requirement 23.2)
      await revalidateContent(contentType, slug);
      
      onStatusChange('draft');
    } catch (error) {
      console.error('Error unpublishing:', error);
      alert('Failed to unpublish content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this content? It will be hidden from the site.')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from(getTableName())
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (error) throw error;
      
      // Revalidate cache for affected routes (Requirement 23.2)
      await revalidateContent(contentType, slug);
      
      onStatusChange('archived');
    } catch (error) {
      console.error('Error archiving:', error);
      alert('Failed to archive content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from(getTableName())
        .update({
          status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (error) throw error;
      
      // Revalidate cache for affected routes (Requirement 23.2)
      await revalidateContent(contentType, slug);
      
      onStatusChange('draft');
    } catch (error) {
      console.error('Error restoring:', error);
      alert('Failed to restore content');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPreviewUrl = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl);
      alert('Preview URL copied to clipboard!');
    }
  };

  return (
    <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
      <h2 className="text-sm font-semibold text-[var(--text)] mb-4">
        Publish Workflow
      </h2>

      {/* Current Status */}
      <div className="mb-4">
        <span className="text-xs text-[var(--muted)] uppercase tracking-wider">
          Current Status
        </span>
        <div className="mt-1">
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      {/* Actions based on status */}
      <div className="space-y-2">
        {currentStatus === 'draft' && (
          <>
            <button
              onClick={handleGeneratePreview}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--bg)]/80 transition-colors border border-[var(--surface)] disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Preview Link'}
            </button>
            <button
              onClick={handlePublish}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Publishing...' : 'Publish'}
            </button>
            <button
              onClick={handleArchive}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[var(--bg)] text-[var(--muted)] text-sm font-medium rounded-lg hover:bg-[var(--bg)]/80 transition-colors border border-[var(--surface)] disabled:opacity-50"
            >
              Archive
            </button>
          </>
        )}

        {currentStatus === 'published' && (
          <>
            <a
              href={getPublicPath()}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors text-center"
            >
              View Live
            </a>
            <button
              onClick={handleUnpublish}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--bg)]/80 transition-colors border border-[var(--surface)] disabled:opacity-50"
            >
              {isLoading ? 'Unpublishing...' : 'Unpublish (Revert to Draft)'}
            </button>
            <button
              onClick={handleArchive}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[var(--bg)] text-[var(--muted)] text-sm font-medium rounded-lg hover:bg-[var(--bg)]/80 transition-colors border border-[var(--surface)] disabled:opacity-50"
            >
              Archive
            </button>
          </>
        )}

        {currentStatus === 'archived' && (
          <button
            onClick={handleRestore}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Restoring...' : 'Restore to Draft'}
          </button>
        )}
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--surface)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--surface)]">
            <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
              Preview Link Generated
            </h3>
            <p className="text-sm text-[var(--muted)] mb-4">
              This link will expire in 1 hour. Share it with reviewers to preview the draft content.
            </p>
            <div className="bg-[var(--bg)] rounded-lg p-3 mb-4 break-all">
              <code className="text-xs text-[var(--text)]">{previewUrl}</code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyPreviewUrl}
                className="flex-1 px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors"
              >
                Copy URL
              </button>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--bg)]/80 transition-colors border border-[var(--surface)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <span
      className={`inline-flex px-3 py-1 text-sm font-medium rounded border ${getStatusStyles()}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
