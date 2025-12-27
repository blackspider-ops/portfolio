import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { NavigationWrapper } from '@/components/navigation';
import { BlueprintBackground } from '@/components/background';
import { MarkdownRenderer } from '@/components/content';
import { JsonLd } from '@/components/seo';
import { generateProjectJsonLd, generateBreadcrumbJsonLd } from '@/lib/json-ld';
import { createClient } from '@/lib/supabase/server';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import type { Project } from '@/types/database';
import type { Metadata } from 'next';

interface ProjectLinks {
  github?: string;
  demo?: string;
  video?: string;
}

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProject(slug: string): Promise<Project | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    
    if (error) {
      // PGRST116 = no rows returned, which is expected for non-existent projects
      if (error.code !== 'PGRST116') {
        console.error('Error fetching project:', error);
      }
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error fetching project:', error);
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
  const [project, settings] = await Promise.all([
    getProject(slug),
    getSiteSettings(),
  ]);
  
  const siteName = settings?.site_name || 'Portfolio';
  
  if (!project) {
    return {
      title: `Project Not Found | ${siteName}`,
    };
  }

  const description = project.one_liner;
  
  // Generate dynamic OG image URL
  const ogImageParams = new URLSearchParams({
    title: project.title,
    description: description,
    type: 'project',
    ...(project.stack.length > 0 && { tags: project.stack.slice(0, 4).join(',') }),
  });
  const ogImageUrl = `${SITE_URL}/api/og?${ogImageParams.toString()}`;

  return {
    title: `${project.title} | ${siteName}`,
    description,
    openGraph: {
      title: project.title,
      description,
      type: 'article',
      images: [
        {
          url: project.cover_url || ogImageUrl,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description,
      images: [project.cover_url || ogImageUrl],
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([
    getProject(slug),
    getSiteSettings(),
  ]);

  if (!project) {
    notFound();
  }

  const ownerName = settings?.owner_name || '';
  const links = project.links as ProjectLinks;

  const projectJsonLd = generateProjectJsonLd({
    title: project.title,
    description: project.one_liner,
    slug: project.slug,
    coverImage: project.cover_url || undefined,
    technologies: project.stack,
    url: links?.demo,
    sourceCode: links?.github,
    authorName: ownerName,
  });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Projects', url: '/projects' },
    { name: project.title, url: `/projects/${project.slug}` },
  ]);

  return (
    <>
      <JsonLd data={projectJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <BlueprintBackground />
      <NavigationWrapper />
      <main className="lg:ml-[92px] pb-20 lg:pb-0 min-h-screen">
        <div className="p-6 md:p-8 lg:p-12 max-w-4xl">
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
            {/* Cover Image - Requirement 14.4: Optimized with WebP/AVIF */}
            {project.cover_url && (
              <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-8">
                <Image 
                  src={getProxiedImageUrl(project.cover_url) || project.cover_url}
                  alt={project.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
                  className="object-cover"
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
                  <GitHubIcon className="w-5 h-5" />
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
                  <ExternalLinkIcon className="w-5 h-5" />
                  Live Demo
                </a>
              )}
              {links?.video && (
                <a
                  href={links.video}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] text-[var(--text)] rounded-lg border border-[var(--muted)]/20 hover:border-[var(--blue)]/50 transition-colors"
                >
                  <VideoIcon className="w-5 h-5" />
                  Watch Video
                </a>
              )}
            </div>
          </header>

          {/* Content sections */}
          <div className="space-y-10">
            {/* Problem */}
            {project.problem && (
              <section>
                <h2 className="font-heading text-2xl text-[var(--text)] mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[var(--violet)]/20 flex items-center justify-center">
                    <ProblemIcon className="w-4 h-4 text-[var(--violet)]" />
                  </span>
                  The Problem
                </h2>
                <div className="text-[var(--text)] leading-relaxed">
                  <MarkdownRenderer content={project.problem} />
                </div>
              </section>
            )}

            {/* Approach */}
            {project.approach && (
              <section>
                <h2 className="font-heading text-2xl text-[var(--text)] mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[var(--blue)]/20 flex items-center justify-center">
                    <ApproachIcon className="w-4 h-4 text-[var(--blue)]" />
                  </span>
                  The Approach
                </h2>
                <div className="text-[var(--text)] leading-relaxed">
                  <MarkdownRenderer content={project.approach} />
                </div>
              </section>
            )}

            {/* Impact */}
            {project.impact && (
              <section>
                <h2 className="font-heading text-2xl text-[var(--text)] mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[var(--green)]/20 flex items-center justify-center">
                    <ImpactIcon className="w-4 h-4 text-[var(--green)]" />
                  </span>
                  The Impact
                </h2>
                <div className="text-[var(--text)] leading-relaxed">
                  <MarkdownRenderer content={project.impact} />
                </div>
              </section>
            )}

            {/* Build Notes */}
            {project.build_notes && (
              <section className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--muted)]/20">
                <h2 className="font-heading text-2xl text-[var(--text)] mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[var(--muted)]/20 flex items-center justify-center">
                    <NotesIcon className="w-4 h-4 text-[var(--muted)]" />
                  </span>
                  Build Notes
                </h2>
                
                {/* Build diagram - Requirement 14.4: Optimized with WebP/AVIF */}
                {project.build_diagram_url && (
                  <div className="mb-6 rounded-lg overflow-hidden relative aspect-video">
                    <Image 
                      src={project.build_diagram_url} 
                      alt={`${project.title} architecture diagram`}
                      fill
                      sizes="(max-width: 768px) 100vw, 800px"
                      className="object-contain"
                    />
                  </div>
                )}
                
                <div className="text-[var(--text)] leading-relaxed mb-6">
                  <MarkdownRenderer content={project.build_notes} />
                </div>

                {/* Tradeoffs */}
                {project.tradeoffs && project.tradeoffs.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-[var(--text)] mb-3">Key Tradeoffs</h3>
                    <ul className="space-y-2">
                      {project.tradeoffs.map((tradeoff, index) => (
                        <li key={index} className="flex items-start gap-3 text-[var(--muted)]">
                          <span className="text-[var(--violet)] mt-1">⚖️</span>
                          {tradeoff}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* What I'd improve next */}
            {project.improvements && project.improvements.length > 0 && (
              <section>
                <h2 className="font-heading text-2xl text-[var(--text)] mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[var(--blue)]/20 flex items-center justify-center">
                    <ImprovementIcon className="w-4 h-4 text-[var(--blue)]" />
                  </span>
                  What I&apos;d Improve Next
                </h2>
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
      </main>
    </>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ProblemIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ApproachIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function ImpactIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function NotesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ImprovementIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
