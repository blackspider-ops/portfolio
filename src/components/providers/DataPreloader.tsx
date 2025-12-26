'use client';

import { useEffect } from 'react';
import { mutate } from 'swr';
import { prefetchProjects, prefetchBlogPosts, prefetchSiteSettings } from '@/lib/hooks/useData';
import { createClient } from '@/lib/supabase/client';

// Fetch resume URL
async function fetchResumeUrl(): Promise<string | null> {
  const supabase = createClient();
  const { data: assetData } = await supabase
    .from('assets')
    .select('original_url')
    .eq('bucket', 'resume')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (assetData?.original_url) return assetData.original_url;
  
  const { data: storageData } = await supabase
    .storage
    .from('resume')
    .list('', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
  
  if (storageData && storageData.length > 0) {
    const { data: urlData } = supabase.storage.from('resume').getPublicUrl(storageData[0].name);
    return urlData?.publicUrl || null;
  }
  return null;
}

export function DataPreloader() {
  useEffect(() => {
    // Preload all data immediately when app loads
    prefetchProjects();
    prefetchBlogPosts();
    prefetchSiteSettings();
    
    // Preload resume URL
    fetchResumeUrl().then(url => {
      mutate('resume-url', url, false);
    });
  }, []);

  return null;
}
