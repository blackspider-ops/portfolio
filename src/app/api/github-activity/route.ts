import { NextRequest, NextResponse } from 'next/server';
import { fetchGitHubActivity } from '@/lib/github';

// Cache for 5 minutes
const CACHE_DURATION = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || 'blackspider-ops';
  const limit = parseInt(searchParams.get('limit') || '5', 10);

  try {
    const activities = await fetchGitHubActivity(username, limit);

    return NextResponse.json(
      { activities },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      }
    );
  } catch (error) {
    console.error('GitHub activity fetch error:', error);
    
    return NextResponse.json(
      { activities: [], error: 'Failed to fetch GitHub activity' },
      { status: 500 }
    );
  }
}
