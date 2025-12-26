'use client';

import useSWR, { mutate } from 'swr';
import { createClient } from '@/lib/supabase/client';
import type { Project, BlogPost, SiteSettings } from '@/types/database';
import type { GitHubActivity } from '@/lib/github';

const supabase = createClient();

// Fetchers
async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true });
  
  if (error) throw new Error(error.message || 'Failed to fetch projects');
  return data || [];
}

async function fetchBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  
  if (error) throw new Error(error.message || 'Failed to fetch blog posts');
  return data || [];
}

async function fetchSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .single();
  
  if (error) return null;
  return data;
}

async function fetchGitHubActivity(username: string): Promise<GitHubActivity[]> {
  if (!username) return [];
  try {
    const response = await fetch(`/api/github-activity?username=${username}&limit=5`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.activities || [];
  } catch {
    return [];
  }
}

// SWR config for caching
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1 minute
  keepPreviousData: true,
};

// Hooks with caching
export function useProjects() {
  return useSWR('projects', fetchProjects, swrConfig);
}

export function useBlogPosts() {
  return useSWR('blog-posts', fetchBlogPosts, swrConfig);
}

export function useSiteSettings() {
  return useSWR('site-settings', fetchSiteSettings, swrConfig);
}

export function useGitHubActivity(username: string) {
  return useSWR(
    username ? `github-activity-${username}` : null,
    () => fetchGitHubActivity(username),
    {
      ...swrConfig,
      dedupingInterval: 300000, // 5 minutes for GitHub
    }
  );
}

// Prefetch functions - call these to warm the cache
export async function prefetchProjects() {
  const data = await fetchProjects();
  mutate('projects', data, false);
  return data;
}

export async function prefetchBlogPosts() {
  const data = await fetchBlogPosts();
  mutate('blog-posts', data, false);
  return data;
}

export async function prefetchSiteSettings() {
  const data = await fetchSiteSettings();
  mutate('site-settings', data, false);
  return data;
}

// Export mutate for manual cache updates
export { mutate };
