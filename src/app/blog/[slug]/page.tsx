import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { NavigationWrapper } from '@/components/navigation';
import { BlueprintBackground } from '@/components/background';
import { BlogMarkdownRenderer, ShareButton } from '@/components/blog';
import { JsonLd } from '@/components/seo';
import { generateBlogPostJsonLd, generateBreadcrumbJsonLd } from '@/lib/json-ld';
import { createClient } from '@/lib/supabase/server';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import type { BlogPost } from '@/types/database';
import type { Metadata } from 'next';

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    
    if (error) {
      // PGRST116 = no rows returned, which is expected for non-existent posts
      if (error.code !== 'PGRST116') {
        console.error('Error fetching blog post:', error);
      }
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tejassinghal.dev';

async function getSiteSettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('site_settings')
    .select('site_name, owner_name')
    .single();
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    getBlogPost(slug),
    getSiteSettings(),
  ]);
  
  const siteName = settings?.site_name || 'Portfolio';
  const ownerName = settings?.owner_name || '';
  
  if (!post) {
    return {
      title: `Post Not Found | ${siteName}`,
    };
  }

  const description = post.summary || `Read ${post.title}.`;
  
  // Generate dynamic OG image URL
  const ogImageParams = new URLSearchParams({
    title: post.title,
    description: description,
    type: 'blog',
    ...(post.tags.length > 0 && { tags: post.tags.join(',') }),
  });
  const ogImageUrl = `${SITE_URL}/api/og?${ogImageParams.toString()}`;

  return {
    title: `${post.title} | ${siteName}`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.published_at || undefined,
      ...(ownerName && { authors: [ownerName] }),
      tags: post.tags,
      images: [
        {
          url: post.cover_url || ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [post.cover_url || ogImageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    getBlogPost(slug),
    getSiteSettings(),
  ]);

  if (!post) {
    notFound();
  }

  const ownerName = settings?.owner_name || '';

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const blogPostJsonLd = generateBlogPostJsonLd({
    title: post.title,
    description: post.summary || `Read ${post.title}.`,
    slug: post.slug,
    publishedAt: post.published_at || new Date().toISOString(),
    modifiedAt: post.updated_at || undefined,
    coverImage: post.cover_url || undefined,
    tags: post.tags,
    readingTime: post.reading_time_minutes || undefined,
    authorName: ownerName,
  });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` },
  ]);

  return (
    <>
      <JsonLd data={blogPostJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <BlueprintBackground />
      <NavigationWrapper />
      <main className="lg:ml-[92px] pb-20 lg:pb-0 min-h-screen">
        <article className="p-6 md:p-8 lg:p-12 max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--blue)] transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-10">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-[var(--blue)]/10 text-[var(--blue)] rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="font-heading text-4xl md:text-5xl text-[var(--text)] mb-4 leading-tight">
              {post.title}
            </h1>

            {post.summary && (
              <p className="text-xl text-[var(--muted)] mb-6">
                {post.summary}
              </p>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-[var(--muted)] pb-6 border-b border-[var(--muted)]/20">
              {formattedDate && (
                <span className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {formattedDate}
                </span>
              )}
              {post.reading_time_minutes && (
                <span className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  {post.reading_time_minutes} min read
                </span>
              )}
            </div>
          </header>

          {/* Cover Image - Requirement 14.4: Optimized with WebP/AVIF */}
          {post.cover_url && (
            <div className="relative rounded-xl overflow-hidden mb-10 aspect-video">
              <Image 
                src={getProxiedImageUrl(post.cover_url) || post.cover_url} 
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <BlogMarkdownRenderer content={post.body_md} />

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-[var(--muted)]/20">
            <div className="flex items-center justify-between">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-[var(--blue)] hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                More posts
              </Link>
              
              <ShareButton title={post.title} />
            </div>
          </footer>
        </article>
      </main>
    </>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
