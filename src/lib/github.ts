// GitHub API utilities for fetching recent activity

export interface GitHubEvent {
  id: string;
  type: string;
  repo: {
    name: string;
    url: string;
  };
  created_at: string;
  payload: {
    commits?: Array<{
      sha: string;
      message: string;
    }>;
    ref?: string;
    ref_type?: string;
    action?: string;
  };
}

export interface GitHubActivity {
  id: string;
  type: 'push' | 'create' | 'star' | 'fork' | 'pr' | 'issue';
  title: string;
  repo: string;
  repoUrl: string;
  timestamp: string;
}

const GITHUB_API = 'https://api.github.com';

export async function fetchGitHubActivity(
  username: string,
  limit: number = 5
): Promise<GitHubActivity[]> {
  try {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    // Use token if available for higher rate limits
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${GITHUB_API}/users/${username}/events/public?per_page=100`,
      {
        headers,
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      console.error('GitHub API error:', response.status);
      return [];
    }

    const events: GitHubEvent[] = await response.json();

    // Group by repo and get unique repos with latest activity
    const repoMap = new Map<string, GitHubActivity>();

    for (const event of events) {
      const repoName = event.repo.name.split('/')[1] || event.repo.name;
      
      // Skip if we already have this repo
      if (repoMap.has(repoName)) continue;
      
      const repoUrl = `https://github.com/${event.repo.name}`;
      
      repoMap.set(repoName, {
        id: event.id,
        type: 'push',
        title: `Working on ${repoName}`,
        repo: repoName,
        repoUrl,
        timestamp: event.created_at,
      });

      if (repoMap.size >= limit) break;
    }

    return Array.from(repoMap.values());
  } catch (error) {
    console.error('Failed to fetch GitHub activity:', error);
    return [];
  }
}

function transformEvent(event: GitHubEvent): GitHubActivity | null {
  const repoName = event.repo.name.split('/')[1] || event.repo.name;
  const repoUrl = `https://github.com/${event.repo.name}`;

  switch (event.type) {
    case 'PushEvent': {
      const commits = event.payload.commits || [];
      const commitCount = commits.length;
      const message = commits[0]?.message?.split('\n')[0] || 'commits';
      return {
        id: event.id,
        type: 'push',
        title: commitCount > 1 
          ? `Pushed ${commitCount} commits to ${repoName}`
          : `${message.slice(0, 50)}${message.length > 50 ? '...' : ''}`,
        repo: repoName,
        repoUrl,
        timestamp: event.created_at,
      };
    }

    case 'CreateEvent': {
      const refType = event.payload.ref_type;
      if (refType === 'repository') {
        return {
          id: event.id,
          type: 'create',
          title: `Created repository ${repoName}`,
          repo: repoName,
          repoUrl,
          timestamp: event.created_at,
        };
      }
      if (refType === 'branch') {
        return {
          id: event.id,
          type: 'create',
          title: `Created branch in ${repoName}`,
          repo: repoName,
          repoUrl,
          timestamp: event.created_at,
        };
      }
      return null;
    }

    case 'WatchEvent':
      return {
        id: event.id,
        type: 'star',
        title: `Starred ${event.repo.name}`,
        repo: repoName,
        repoUrl,
        timestamp: event.created_at,
      };

    case 'ForkEvent':
      return {
        id: event.id,
        type: 'fork',
        title: `Forked ${event.repo.name}`,
        repo: repoName,
        repoUrl,
        timestamp: event.created_at,
      };

    case 'PullRequestEvent':
      return {
        id: event.id,
        type: 'pr',
        title: `${event.payload.action} PR in ${repoName}`,
        repo: repoName,
        repoUrl,
        timestamp: event.created_at,
      };

    case 'IssuesEvent':
      return {
        id: event.id,
        type: 'issue',
        title: `${event.payload.action} issue in ${repoName}`,
        repo: repoName,
        repoUrl,
        timestamp: event.created_at,
      };

    default:
      return null;
  }
}
