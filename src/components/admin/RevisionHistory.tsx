'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRevisions, restoreRevision, formatRevisionDate, type ContentType } from '@/lib/revisions';
import type { ContentRevision, Json } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

interface RevisionHistoryProps {
  contentId: string;
  contentType: ContentType;
  onRestore?: () => void;
}

export function RevisionHistory({
  contentId,
  contentType,
  onRestore,
}: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<ContentRevision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<ContentRevision | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const supabase = createClient();

  const fetchRevisions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { revisions: data, error: fetchError } = await getRevisions(contentType, contentId);
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setRevisions(data);
    }
    setIsLoading(false);
  }, [contentType, contentId]);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  const handleRestore = async (revision: ContentRevision) => {
    if (!confirm(`Are you sure you want to restore to revision #${revision.revision_number}? This will save the current state as a new revision.`)) {
      return;
    }

    setIsRestoring(true);
    const { data: userData } = await supabase.auth.getUser();
    
    const { success, error: restoreError } = await restoreRevision(
      revision.id,
      userData.user?.id
    );

    if (success) {
      setSelectedRevision(null);
      setShowPreview(false);
      await fetchRevisions();
      onRestore?.();
    } else {
      alert(`Failed to restore: ${restoreError}`);
    }
    setIsRestoring(false);
  };

  const handlePreview = (revision: ContentRevision) => {
    setSelectedRevision(revision);
    setShowPreview(true);
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-4">
          Revision History
        </h2>
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-4">
          Revision History
        </h2>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-4">
          Revision History
        </h2>
        
        {revisions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No revisions yet. Revisions are created when you save changes.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {revisions.map((revision) => (
              <RevisionItem
                key={revision.id}
                revision={revision}
                onPreview={() => handlePreview(revision)}
                onRestore={() => handleRestore(revision)}
                isRestoring={isRestoring}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedRevision && (
        <RevisionPreviewModal
          revision={selectedRevision}
          contentType={contentType}
          onClose={() => {
            setShowPreview(false);
            setSelectedRevision(null);
          }}
          onRestore={() => handleRestore(selectedRevision)}
          isRestoring={isRestoring}
        />
      )}
    </>
  );
}

interface RevisionItemProps {
  revision: ContentRevision;
  onPreview: () => void;
  onRestore: () => void;
  isRestoring: boolean;
}

function RevisionItem({ revision, onPreview, onRestore, isRestoring }: RevisionItemProps) {
  const data = revision.data as Record<string, unknown>;
  const title = (data.title as string) || 'Untitled';

  return (
    <div className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--muted)]">
            #{revision.revision_number}
          </span>
          <span className="text-sm text-[var(--text)] truncate">
            {title}
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          {formatRevisionDate(revision.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onPreview}
          className="px-2 py-1 text-xs text-[var(--blue)] hover:bg-[var(--blue)]/10 rounded transition-colors"
        >
          Preview
        </button>
        <button
          onClick={onRestore}
          disabled={isRestoring}
          className="px-2 py-1 text-xs text-[var(--text)] hover:bg-[var(--surface)] rounded transition-colors disabled:opacity-50"
        >
          Restore
        </button>
      </div>
    </div>
  );
}

interface RevisionPreviewModalProps {
  revision: ContentRevision;
  contentType: ContentType;
  onClose: () => void;
  onRestore: () => void;
  isRestoring: boolean;
}

function RevisionPreviewModal({
  revision,
  contentType,
  onClose,
  onRestore,
  isRestoring,
}: RevisionPreviewModalProps) {
  const data = revision.data as Record<string, unknown>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[var(--surface)] rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col border border-[var(--surface)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--bg)]">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Revision #{revision.revision_number}
            </h3>
            <p className="text-sm text-[var(--muted)]">
              {formatRevisionDate(revision.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <RevisionContent data={data} contentType={contentType} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--bg)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--bg)] rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={onRestore}
            disabled={isRestoring}
            className="px-4 py-2 text-sm bg-[var(--blue)] text-white rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
          >
            {isRestoring ? 'Restoring...' : 'Restore This Version'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface RevisionContentProps {
  data: Record<string, unknown>;
  contentType: ContentType;
}

function RevisionContent({ data, contentType }: RevisionContentProps) {
  const renderField = (label: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return null;

    let displayValue: React.ReactNode;

    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      displayValue = (
        <div className="flex flex-wrap gap-1">
          {value.map((item, i) => (
            <span key={i} className="px-2 py-0.5 bg-[var(--surface)] text-xs rounded">
              {String(item)}
            </span>
          ))}
        </div>
      );
    } else if (typeof value === 'object') {
      displayValue = (
        <pre className="text-xs bg-[var(--surface)] p-2 rounded overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    } else if (typeof value === 'boolean') {
      displayValue = value ? 'Yes' : 'No';
    } else {
      displayValue = String(value);
    }

    return (
      <div key={label} className="mb-3">
        <dt className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">
          {label}
        </dt>
        <dd className="text-sm text-[var(--text)]">{displayValue}</dd>
      </div>
    );
  };

  const getFieldsForContentType = () => {
    switch (contentType) {
      case 'blog_post':
        return [
          { key: 'title', label: 'Title' },
          { key: 'slug', label: 'Slug' },
          { key: 'summary', label: 'Summary' },
          { key: 'body_md', label: 'Content' },
          { key: 'tags', label: 'Tags' },
          { key: 'status', label: 'Status' },
        ];
      case 'project':
        return [
          { key: 'title', label: 'Title' },
          { key: 'slug', label: 'Slug' },
          { key: 'one_liner', label: 'One-liner' },
          { key: 'problem', label: 'Problem' },
          { key: 'approach', label: 'Approach' },
          { key: 'impact', label: 'Impact' },
          { key: 'stack', label: 'Tech Stack' },
          { key: 'build_notes', label: 'Build Notes' },
          { key: 'tradeoffs', label: 'Tradeoffs' },
          { key: 'improvements', label: 'Improvements' },
          { key: 'status', label: 'Status' },
        ];
      case 'page':
        return [
          { key: 'key', label: 'Key' },
          { key: 'body_md', label: 'Content' },
          { key: 'status', label: 'Status' },
        ];
      default:
        return [];
    }
  };

  const fields = getFieldsForContentType();

  return (
    <dl className="space-y-1">
      {fields.map(({ key, label }) => renderField(label, data[key]))}
    </dl>
  );
}
