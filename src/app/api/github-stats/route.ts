import { NextRequest, NextResponse } from 'next/server';

// Cache for 5 minutes (300 seconds)
const CACHE_DURATION = 300;

interface GitHubRepo {
  stargazers_count: number;
  pushed_at: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || 'blackspider-ops';

  try {
    // Fetch user's repos to get total stars - no Next.js cache to avoid stale data on deploy
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
        cache: 'no-store', // Always fetch fresh on server
      }
    );

    if (!reposResponse.ok) {
      throw new Error(`GitHub API error: ${reposResponse.status}`);
    }

    const repos: GitHubRepo[] = await reposResponse.json();
    
    // Calculate total stars
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    
    // Get most recent push
    const lastCommit = repos.length > 0 
      ? repos.reduce((latest, repo) => 
          new Date(repo.pushed_at) > new Date(latest) ? repo.pushed_at : latest,
          repos[0].pushed_at
        )
      : null;

    return NextResponse.json(
      { stars: totalStars, lastCommit },
      {
        headers: {
          // Cache in browser/CDN for 5 minutes
          'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
        },
      }
    );
  } catch (error) {
    console.error('GitHub stats fetch error:', error);
    
    // Return fallback data on error
    return NextResponse.json(
      { stars: 0, lastCommit: null, error: 'Failed to fetch GitHub stats' },
      { status: 500 }
    );
  }
}
