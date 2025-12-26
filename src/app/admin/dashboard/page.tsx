import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch counts and last update times for dashboard
  const [
    publishedProjectsResult,
    publishedPostsResult,
    draftProjectsResult,
    draftPostsResult,
    lastProjectUpdate,
    lastPostUpdate,
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft'),
    supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft'),
    supabase
      .from('projects')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('blog_posts')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const publishedProjects = publishedProjectsResult.count ?? 0;
  const publishedPosts = publishedPostsResult.count ?? 0;
  const draftProjects = draftProjectsResult.count ?? 0;
  const draftPosts = draftPostsResult.count ?? 0;
  const totalDrafts = draftProjects + draftPosts;
  const totalPublished = publishedProjects + publishedPosts;

  // Determine the most recent update time
  const projectUpdateTime = lastProjectUpdate.data?.updated_at;
  const postUpdateTime = lastPostUpdate.data?.updated_at;
  
  let lastUpdateTime: string | null = null;
  if (projectUpdateTime && postUpdateTime) {
    lastUpdateTime = new Date(projectUpdateTime) > new Date(postUpdateTime) 
      ? projectUpdateTime 
      : postUpdateTime;
  } else {
    lastUpdateTime = projectUpdateTime || postUpdateTime || null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Dashboard</h1>
        {lastUpdateTime && (
          <div className="text-sm text-[var(--muted)]">
            Last updated: <LastUpdateTime timestamp={lastUpdateTime} />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Published Projects"
          value={publishedProjects}
          href="/admin/projects"
          icon={<ProjectIcon />}
        />
        <StatCard
          title="Published Posts"
          value={publishedPosts}
          href="/admin/blog"
          icon={<BlogIcon />}
        />
        <StatCard
          title="Total Drafts"
          value={totalDrafts}
          href="/admin/blog?status=draft"
          icon={<DraftIcon />}
          subtitle={`${draftProjects} projects, ${draftPosts} posts`}
        />
        <StatCard
          title="Total Published"
          value={totalPublished}
          href="/admin/projects"
          icon={<PublishedIcon />}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <QuickActionButton href="/admin/projects/new" icon={<PlusIcon />}>
            New Project
          </QuickActionButton>
          <QuickActionButton href="/admin/blog/new" icon={<PlusIcon />}>
            New Blog Post
          </QuickActionButton>
          <QuickActionButton href="/admin/assets" icon={<ImageIcon />}>
            Manage Assets
          </QuickActionButton>
          <QuickActionButton href="/admin/settings" icon={<SettingsIcon />}>
            Settings
          </QuickActionButton>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
  icon,
  subtitle,
}: {
  title: string;
  value: number;
  href: string;
  icon?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <a
      href={href}
      className="block bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)] hover:border-[var(--blue)]/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-[var(--muted)]">{title}</p>
        {icon && <span className="text-[var(--muted)]">{icon}</span>}
      </div>
      <p className="text-3xl font-bold text-[var(--text)] font-mono">{value}</p>
      {subtitle && (
        <p className="text-xs text-[var(--muted)] mt-1">{subtitle}</p>
      )}
    </a>
  );
}

function QuickActionButton({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--bg)]/80 transition-colors border border-[var(--surface)] hover:border-[var(--blue)]/50"
    >
      {icon && <span className="text-[var(--muted)]">{icon}</span>}
      {children}
    </a>
  );
}

function LastUpdateTime({ timestamp }: { timestamp: string }) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let relativeTime: string;
  if (diffMins < 1) {
    relativeTime = 'just now';
  } else if (diffMins < 60) {
    relativeTime = `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    relativeTime = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    relativeTime = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    relativeTime = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  return (
    <time dateTime={timestamp} title={date.toLocaleString()}>
      {relativeTime}
    </time>
  );
}

// Icons
function ProjectIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
}

function BlogIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function DraftIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function PublishedIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
