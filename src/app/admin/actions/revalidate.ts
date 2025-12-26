'use server';

import { revalidatePath } from 'next/cache';

type ContentType = 'project' | 'blog_post' | 'page';

/**
 * Revalidates the cache for content routes after publish/unpublish actions.
 * This ensures content changes appear on the live site immediately.
 * 
 * Requirements: 23.2 - Cache revalidation via server actions
 */
export async function revalidateContent(
  contentType: ContentType,
  slug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Always revalidate the home page (shows recent content)
    revalidatePath('/');

    switch (contentType) {
      case 'project':
        // Revalidate projects list and individual project page
        revalidatePath('/projects');
        revalidatePath(`/projects/${slug}`);
        break;

      case 'blog_post':
        // Revalidate blog list, individual post, and RSS feed
        revalidatePath('/blog');
        revalidatePath(`/blog/${slug}`);
        revalidatePath('/rss.xml');
        break;

      case 'page':
        // Revalidate the specific page (about, etc.)
        revalidatePath(`/${slug}`);
        break;
    }

    return { success: true };
  } catch (error) {
    console.error('Error revalidating content:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Revalidates all content routes. Useful for bulk operations or settings changes.
 */
export async function revalidateAllContent(): Promise<{ success: boolean; error?: string }> {
  try {
    // Revalidate all main content routes
    revalidatePath('/');
    revalidatePath('/projects');
    revalidatePath('/blog');
    revalidatePath('/about');
    revalidatePath('/resume');
    revalidatePath('/contact');
    revalidatePath('/rss.xml');

    return { success: true };
  } catch (error) {
    console.error('Error revalidating all content:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
