/**
 * Converts a Supabase storage URL to a proxied URL that hides the project ID
 * 
 * Input: https://xplifhqnkmofhmrwkejf.supabase.co/storage/v1/object/public/covers/image.png
 * Output: /api/image/covers/image.png
 */
export function getProxiedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Check if it's a Supabase storage URL
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    // Extract the path after 'public/'
    const match = url.match(/\/storage\/v1\/object\/public\/(.+)$/);
    if (match) {
      return `/api/image/${match[1]}`;
    }
  }
  
  // Return original URL if not a Supabase storage URL
  return url;
}
