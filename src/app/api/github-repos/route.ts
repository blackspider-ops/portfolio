import { NextRequest, NextResponse } from 'next/server';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
}

export interface TransformedRepo {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  lastPushed: string;
  isFork: boolean;
  isArchived: boolean;
}

const CACHE_DURATION = 300; // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || 'blackspider-ops';

  try {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed&direction=desc`,
      {
        headers,
        next: { revalidate: CACHE_DURATION },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos: GitHubRepo[] = await response.json();

    // Transform and filter repos
    const transformedRepos: TransformedRepo[] = repos
      .filter(repo => !repo.fork) // Exclude forks by default
      .map(repo => ({
        id: repo.id,
        name: repo.name,
        slug: repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: repo.description,
        url: repo.html_url,
        homepage: repo.homepage,
        language: repo.language,
        topics: repo.topics || [],
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        lastPushed: repo.pushed_at,
        isFork: repo.fork,
        isArchived: repo.archived,
      }));

    return NextResponse.json(
      { repos: transformedRepos },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      }
    );
  } catch (error) {
    console.error('GitHub repos fetch error:', error);
    return NextResponse.json(
      { repos: [], error: 'Failed to fetch GitHub repos' },
      { status: 500 }
    );
  }
}
