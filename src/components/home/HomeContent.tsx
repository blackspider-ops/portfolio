'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { KeyboardHints } from './KeyboardHints';
import { usePhoneMock } from '@/components/phone-mock';
import { useTerminal } from '@/components/terminal';
import { useSiteSettings, useProjects, useBlogPosts, useGitHubActivity } from '@/lib/hooks/useData';
import type { SiteSettings } from '@/types/database';

// Lazy load non-critical components
const LiveStatsCard = dynamic(() => import('./LiveStatsCard').then(mod => ({ default: mod.LiveStatsCard })), {
  ssr: false,
  loading: () => <div className="bg-surface border border-muted/20 rounded-lg p-4 h-32 animate-pulse" />,
});
const RecentActivityCard = dynamic(() => import('./RecentActivityCard').then(mod => ({ default: mod.RecentActivityCard })), {
  ssr: false,
  loading: () => <div className="bg-surface border border-muted/20 rounded-lg p-4 h-40 animate-pulse" />,
});
const RecentWorkSection = dynamic(() => import('./RecentWorkSection').then(mod => ({ default: mod.RecentWorkSection })));
const RecentBlogSection = dynamic(() => import('./RecentBlogSection').then(mod => ({ default: mod.RecentBlogSection })));
const NowPanel = dynamic(() => import('./NowPanel').then(mod => ({ default: mod.NowPanel })));
const SignalsRow = dynamic(() => import('./SignalsRow').then(mod => ({ default: mod.SignalsRow })));
const HeroCtaButtons = dynamic(() => import('./HeroCtaButtons'), {
  ssr: false,
});

interface ActivityItem {
  id: string;
  type: 'push' | 'blog' | 'deploy' | 'project';
  title: string;
  href?: string;
  timestamp: string;
}

interface SignalBadge {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
}

interface CtaConfig {
  primary_action?: 'phone_mock' | 'terminal' | 'link';
  primary_link?: string;
  secondary_action?: 'phone_mock' | 'terminal' | 'link';
  secondary_link?: string;
}

interface HomeContentProps {
  initialSettings?: SiteSettings | null;
}

export function HomeContent({ initialSettings }: HomeContentProps) {
  const router = useRouter();
  const { open: openPhoneMock } = usePhoneMock();
  const { toggle: toggleTerminal } = useTerminal();
  
  // Use initial settings from server, with SWR for revalidation
  const { data: siteSettings, isLoading: settingsLoading } = useSiteSettings();
  const settings = siteSettings || initialSettings;
  
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: blogPosts, isLoading: postsLoading } = useBlogPosts();
  
  // Extract GitHub username from social links
  const socialLinks = settings?.social_links as { github?: string } | null;
  const githubUrl = socialLinks?.github || '';
  const githubUsername = githubUrl.split('/').pop() || '';
  
  const { data: githubActivity } = useGitHubActivity(githubUsername);

  // Get featured projects
  const featuredProjects = projects?.filter(p => p.is_featured).slice(0, 3) || [];

  // Get recent blog posts
  const recentPosts = blogPosts?.slice(0, 3) || [];

  // Get project slugs to filter out duplicate GitHub activity
  const projectSlugs = new Set((projects || []).map(p => p.slug.toLowerCase()));

  // Build recent activity from projects, blog posts, and GitHub
  // Filter GitHub activity to exclude repos already shown as projects
  const filteredGithubActivity = (githubActivity || []).filter(
    activity => !projectSlugs.has(activity.repo.toLowerCase())
  );

  const recentActivity: ActivityItem[] = [
    ...(blogPosts || []).slice(0, 3).map((post) => ({
      id: post.id,
      type: 'blog' as const,
      title: post.title,
      href: `/blog/${post.slug}`,
      timestamp: post.published_at || post.created_at,
    })),
    ...(projects || []).slice(0, 2).map((project) => ({
      id: project.id,
      type: 'project' as const,
      title: `Published: ${project.title}`,
      href: `/projects/${project.slug}`,
      timestamp: project.published_at || project.created_at,
    })),
    ...filteredGithubActivity.map((activity) => ({
      id: activity.id,
      type: 'push' as const,
      title: activity.title,
      href: activity.repoUrl,
      timestamp: activity.timestamp,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  // Parse now_panel_items from JSON
  const nowPanelItems = Array.isArray(settings?.now_panel_items) 
    ? settings.now_panel_items as string[]
    : [];

  // Parse signals_badges from JSON
  const signalsBadges = Array.isArray(settings?.signals_badges)
    ? (settings.signals_badges as unknown as SignalBadge[]).filter(s => s.enabled)
    : [];

  // Parse CTA config
  const ctaConfig = (settings as Record<string, unknown> | undefined)?.cta_config as CtaConfig | undefined;

  // CTA action handlers
  const handleCtaAction = (action: 'phone_mock' | 'terminal' | 'link', link?: string) => {
    switch (action) {
      case 'phone_mock':
        openPhoneMock();
        break;
      case 'terminal':
        toggleTerminal();
        break;
      case 'link':
        if (link) {
          if (link.startsWith('http')) {
            window.open(link, '_blank');
          } else {
            router.push(link);
          }
        }
        break;
    }
  };

  // Show loading state for activity if data is still loading
  const isDataLoading = settingsLoading || projectsLoading || postsLoading;

  return (
    <div className="px-6 md:px-8 lg:px-12 pb-6 max-w-7xl -mt-4">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left column - CTA and additional content */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* CTA Buttons - Client-side for interactivity */}
          <HeroCtaButtons
            primaryCtaText={settings?.primary_cta_text}
            secondaryCtaText={settings?.secondary_cta_text}
            ctaConfig={ctaConfig}
          />

          {/* Keyboard hints */}
          <KeyboardHints />

          {/* Signals row */}
          {signalsBadges.length > 0 && (
            <SignalsRow signals={signalsBadges.map(s => ({ id: s.id, label: s.label }))} />
          )}
        </div>

        {/* Right column - Stats and panels */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:-mt-[200px]">
          {/* Live Stats */}
          <LiveStatsCard githubUsername={githubUsername} />

          {/* Recent Activity */}
          <RecentActivityCard activities={recentActivity} />

          {/* Now Panel */}
          {nowPanelItems.length > 0 && (
            <NowPanel items={nowPanelItems} />
          )}
        </div>
      </div>

      {/* Recent Work section */}
      {featuredProjects.length > 0 && (
        <RecentWorkSection projects={featuredProjects} />
      )}

      {/* Recent Blog section */}
      {recentPosts.length > 0 && (
        <RecentBlogSection posts={recentPosts} />
      )}
    </div>
  );
}
