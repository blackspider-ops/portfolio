import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NavigationWrapper } from '@/components/navigation';
import { BlueprintBackground } from '@/components/background';
import { BlogMarkdownRenderer } from '@/components/blog';
import { MarkdownRenderer } from '@/components/content';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BlogPost, Project, Page } from '@/types/database';
import type { Metadata } from 'next';

// Disable caching for preview routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ContentType = 'project' | 'blog_post' | 'page';

interface PageProps {
  params: Promise<{ type: string; slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

interface ProjectLinks {
  github?: string;
  demo?: string;
  video?: string;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Preview: ${slug}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

async function validatePreviewToken(token: string, contentType: ContentType, contentId: string): Promise<boolean> {
  const supabase = createAdminClient();
  
  const { data: tokenData, error } = await supabase
    .from('preview_tokens')
    .select('*')
    .eq('token', token)
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !tokenData) {
    return false;
  }

  return true;
}

async function getContentBySlug(type: ContentType, slug: string): Promise<{ content: Project | BlogPost | Page | null; id: string | null }> {
  const supabase = createAdminClient();
  
  if (type === 'project') {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error || !data) {
      return { content: null, id: null };
    }
    return { content: data, id: data.id };
  }
  
  if (type === 'blog_post') {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error || !data) {
      return { content: null, id: null };
    }
    return { content: data, id: data.id };
  }
  
  if (type === 'page') {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('key', slug)
      .single();
    
    if (error || !data) {
      return { content: null, id: null };
    }
    return { content: data, id: data.id };
  }

  return { content: null, id: null };
}

function PreviewBanner({ type, slug }: { type: string; slug: string }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--violet)] text-white py-2 px-4 text-center">
      <div className="flex items-center justify-center gap-4">
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="font-semibold">Preview Mode</span>
        </span>
        <span className="text-sm opacity-90">
          This is a draft preview. Content may change before publishing.
        </span>
      </div>
    </div>
  );
}

function InvalidPreview({ reason }: { reason: string }) {
  return (
    <>
      <BlueprintBackground />
      <NavigationWrapper />
      <main className="lg:ml-[92px] pb-20 lg:pb-0 min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--surface)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl text-[var(--text)] mb-4">
            Preview Unavailable
          </h1>
          <p className="text-[var(--muted)] mb-6">
            {reason}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--blue)] text-[var(--bg)] rounded-lg hover:opacity-90 transition-opacity"
          >
            Go to Home
          </Link>
        </div>
      </main>
    </>
  );
}

function ProjectPreview({ project }: { project: Project }) {
  const links = project.links as ProjectLinks;

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-4xl pt-20">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--blue)] transition-colors mb-8"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        </svg>
        Back to Projects
      </Link>

      {/* Header */}
      <header className="mb-10">
        {/* Status badge */}
        <div className="mb-4">
          <span className="px-3 py-1 text-sm bg-[var(--violet)]/20 text-[var(--violet)] rounded-full">
            {project.status.toUpperCase()}
          </span>
        </div>

        {/* Cover Image */}
        {project.cover_url && (
          <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-8">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${project.cover_url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
          </div>
        )}

        <h1 className="font-heading text-4xl md:text-5xl text-[var(--text)] mb-4">
          {project.title}
        </h1>
        <p className="text-xl text-[var(--muted)] mb-6">
          {project.one_liner}
        </p>

        {/* Stack chips */}
        {project.stack && project.stack.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.stack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 text-sm bg-[var(--surface)] text-[var(--blue)] rounded-lg border border-[var(--muted)]/20"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-4">
          {links?.github && (
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] text-[var(--text)] rounded-lg border border-[var(--muted)]/20 hover:border-[var(--blue)]/50 transition-colors"
            >
              View on GitHub
            </a>
          )}
          {links?.demo && (
            <a
              href={links.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--blue)] text-[var(--bg)] rounded-lg hover:opacity-90 transition-opacity"
            >
              Live Demo
            </a>
          )}
        </div>
      </header>

      {/* Content sections */}
      <div className="space-y-10">
        {project.problem && (
          <section>
            <h2 className="font-heading text-2xl text-[var(--text)] mb-4">The Problem</h2>
            <div className="text-[var(--text)] leading-relaxed">
              <MarkdownRenderer content={project.problem} />
            </div>
          </section>
        )}

        {project.approach && (
          <section>
            <h2 className="font-heading text-2xl text-[var(--text)] mb-4">The Approach</h2>
            <div className="text-[var(--text)] leading-relaxed">
              <MarkdownRenderer content={project.approach} />
            </div>
          </section>
        )}

        {project.impact && (
          <section>
            <h2 className="font-heading text-2xl text-[var(--text)] mb-4">The Impact</h2>
            <div className="text-[var(--text)] leading-relaxed">
              <MarkdownRenderer content={project.impact} />
            </div>
          </section>
        )}

        {project.build_notes && (
          <section className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--muted)]/20">
            <h2 className="font-heading text-2xl text-[var(--text)] mb-4">Build Notes</h2>
            <div className="text-[var(--text)] leading-relaxed">
              <MarkdownRenderer content={project.build_notes} />
            </div>
          </section>
        )}

        {project.improvements && project.improvements.length > 0 && (
          <section>
            <h2 className="font-heading text-2xl text-[var(--text)] mb-4">What I&apos;d Improve Next</h2>
            <ul className="space-y-3">
              {project.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-3 text-[var(--text)]">
                  <span className="text-[var(--blue)] mt-1">→</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function BlogPostPreview({ post }: { post: BlogPost }) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not published';

  return (
    <article className="p-6 md:p-8 lg:p-12 max-w-3xl mx-auto pt-20">
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
        {/* Status badge */}
        <div className="mb-4">
          <span className="px-3 py-1 text-sm bg-[var(--violet)]/20 text-[var(--violet)] rounded-full">
            {post.status.toUpperCase()}
          </span>
        </div>

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
          <span>{formattedDate}</span>
          {post.reading_time_minutes && (
            <span>{post.reading_time_minutes} min read</span>
          )}
        </div>
      </header>

      {/* Cover Image */}
      {post.cover_url && (
        <div className="relative rounded-xl overflow-hidden mb-10">
          <img 
            src={post.cover_url} 
            alt={post.title}
            className="w-full"
          />
        </div>
      )}

      {/* Content */}
      <BlogMarkdownRenderer content={post.body_md} />
    </article>
  );
}

function PagePreview({ page }: { page: Page }) {
  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-3xl mx-auto pt-20">
      {/* Status badge */}
      <div className="mb-4">
        <span className="px-3 py-1 text-sm bg-[var(--violet)]/20 text-[var(--violet)] rounded-full">
          {page.status.toUpperCase()}
        </span>
      </div>

      <h1 className="font-heading text-4xl md:text-5xl text-[var(--text)] mb-8 capitalize">
        {page.key}
      </h1>

      <div className="text-[var(--text)] leading-relaxed">
        <MarkdownRenderer content={page.body_md} />
      </div>
    </div>
  );
}

export default async function PreviewPage({ params, searchParams }: PageProps) {
  const { type, slug } = await params;
  const { token } = await searchParams;

  // Validate content type
  const validTypes: ContentType[] = ['project', 'blog_post', 'page'];
  if (!validTypes.includes(type as ContentType)) {
    return <InvalidPreview reason="Invalid content type. Please check the preview link." />;
  }

  const contentType = type as ContentType;

  // Check for token
  if (!token) {
    return <InvalidPreview reason="No preview token provided. Please use a valid preview link." />;
  }

  // Get content by slug first to get the ID
  const { content, id } = await getContentBySlug(contentType, slug);

  if (!content || !id) {
    return <InvalidPreview reason="Content not found. It may have been deleted or the slug is incorrect." />;
  }

  // Validate token
  const isValidToken = await validatePreviewToken(token, contentType, id);

  if (!isValidToken) {
    return <InvalidPreview reason="Invalid or expired preview token. Please request a new preview link." />;
  }

  return (
    <>
      <BlueprintBackground />
      <NavigationWrapper />
      <PreviewBanner type={type} slug={slug} />
      <main className="lg:ml-[92px] pb-20 lg:pb-0 min-h-screen">
        {contentType === 'project' && <ProjectPreview project={content as Project} />}
        {contentType === 'blog_post' && <BlogPostPreview post={content as BlogPost} />}
        {contentType === 'page' && <PagePreview page={content as Page} />}
      </main>
    </>
  );
}
