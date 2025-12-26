import { createClient } from '@/lib/supabase/client';
import type { ContentRevision, Json } from '@/types/database';

export type ContentType = 'project' | 'blog_post' | 'page';

export interface RevisionData {
  contentType: ContentType;
  contentId: string;
  data: Record<string, unknown>;
  userId?: string;
}

/**
 * Save a revision snapshot of content before updating.
 * This creates a full snapshot of the content for undo/restore functionality.
 * Note: This is a best-effort operation - failures won't block the main save.
 */
export async function saveRevision({
  contentType,
  contentId,
  data,
  userId,
}: RevisionData): Promise<{ success: boolean; revisionNumber?: number; error?: string }> {
  const supabase = createClient();

  try {
    // Check if user is authenticated
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      // Silently skip revision saving if not authenticated
      return { success: true, revisionNumber: 0 };
    }

    // Get the next revision number
    const { count, error: countError } = await supabase
      .from('content_revisions')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    if (countError) {
      // Don't block on revision errors
      console.warn('Revision count error (non-blocking):', countError.message);
      return { success: true, revisionNumber: 0 };
    }

    const revisionNumber = (count || 0) + 1;

    // Insert the revision
    const { error: insertError } = await supabase
      .from('content_revisions')
      .insert({
        content_type: contentType,
        content_id: contentId,
        revision_number: revisionNumber,
        data: data as Json,
        created_by: userId || authData.user.id,
      });

    if (insertError) {
      // Don't block on revision errors
      console.warn('Revision save error (non-blocking):', insertError.message);
      return { success: true, revisionNumber: 0 };
    }

    return { success: true, revisionNumber };
  } catch (error) {
    // Don't block on revision errors
    console.warn('Revision error (non-blocking):', error);
    return { success: true, revisionNumber: 0 };
  }
}

/**
 * Get all revisions for a piece of content, ordered by revision number descending.
 */
export async function getRevisions(
  contentType: ContentType,
  contentId: string
): Promise<{ revisions: ContentRevision[]; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('content_revisions')
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('revision_number', { ascending: false });

    if (error) {
      console.error('Error fetching revisions:', error);
      return { revisions: [], error: error.message };
    }

    return { revisions: data || [] };
  } catch (error) {
    console.error('Error in getRevisions:', error);
    return { revisions: [], error: 'Failed to fetch revisions' };
  }
}

/**
 * Get a specific revision by ID.
 */
export async function getRevisionById(
  revisionId: string
): Promise<{ revision: ContentRevision | null; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('content_revisions')
      .select('*')
      .eq('id', revisionId)
      .single();

    if (error) {
      console.error('Error fetching revision:', error);
      return { revision: null, error: error.message };
    }

    return { revision: data };
  } catch (error) {
    console.error('Error in getRevisionById:', error);
    return { revision: null, error: 'Failed to fetch revision' };
  }
}

/**
 * Restore content to a previous revision.
 * This updates the content with the revision data and creates a new revision
 * to track the restore action.
 */
export async function restoreRevision(
  revisionId: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Get the revision to restore
    const { data: revision, error: fetchError } = await supabase
      .from('content_revisions')
      .select('*')
      .eq('id', revisionId)
      .single();

    if (fetchError || !revision) {
      return { success: false, error: 'Revision not found' };
    }

    const { content_type, content_id, data: revisionData } = revision;

    // Get the table name based on content type
    const tableName = getTableName(content_type as ContentType);

    // Get current content to save as a revision before restoring
    const { data: currentContent, error: currentError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', content_id)
      .single();

    if (currentError) {
      return { success: false, error: 'Failed to fetch current content' };
    }

    // Save current state as a revision before restoring
    await saveRevision({
      contentType: content_type as ContentType,
      contentId: content_id,
      data: currentContent,
      userId,
    });

    // Restore the content (exclude id, created_at from the update)
    const updateData = { ...(revisionData as Record<string, unknown>) };
    delete updateData.id;
    delete updateData.created_at;
    updateData.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', content_id);

    if (updateError) {
      console.error('Error restoring revision:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in restoreRevision:', error);
    return { success: false, error: 'Failed to restore revision' };
  }
}

/**
 * Get the table name for a content type.
 */
function getTableName(contentType: ContentType): 'projects' | 'blog_posts' | 'pages' {
  switch (contentType) {
    case 'project':
      return 'projects';
    case 'blog_post':
      return 'blog_posts';
    case 'page':
      return 'pages';
  }
}

/**
 * Format a revision for display.
 */
export function formatRevisionDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
}
