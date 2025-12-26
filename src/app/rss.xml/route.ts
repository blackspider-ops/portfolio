import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { BlogPost, Database } from '@/types/database';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://portfolio.dev';

// Create a simple Supabase client without cookies for RSS (public data only)
function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateRssItem(post: BlogPost): string {
  const pubDate = post.published_at
    ? new Date(post.published_at).toUTCString()
    : new Date(post.created_at).toUTCString();

  const description = post.summary || post.body_md.slice(0, 200) + '...';

  return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      ${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`;
}

function generateRssFeed(posts: BlogPost[], siteName: string, siteDescription: string): string {
  const lastBuildDate = posts.length > 0
    ? new Date(posts[0].published_at || posts[0].created_at).toUTCString()
    : new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    ${posts.map(generateRssItem).join('\n')}
  </channel>
</rss>`;
}

export async function GET() {
  try {
    const supabase = createClient();
    
    if (!supabase) {
      // Return empty feed if no Supabase connection
      const emptyFeed = generateRssFeed([], 'Portfolio', 'A developer portfolio');
      return new Response(emptyFeed, {
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }
    
    // Fetch site settings and posts in parallel
    const [settingsResult, postsResult] = await Promise.all([
      supabase.from('site_settings').select('site_name, hero_subhead').single(),
      supabase.from('blog_posts').select('*').eq('status', 'published').order('published_at', { ascending: false }),
    ]);

    if (postsResult.error) {
      console.error('Error fetching blog posts for RSS:', postsResult.error);
      return new Response('Error generating RSS feed', { status: 500 });
    }

    const siteName = settingsResult.data?.site_name || 'Portfolio';
    const siteDescription = settingsResult.data?.hero_subhead || 'Technical writing, tutorials, and thoughts on building software.';

    const feed = generateRssFeed(postsResult.data || [], siteName, siteDescription);

    return new Response(feed, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}

// Revalidate every 60 seconds
export const revalidate = 60;
