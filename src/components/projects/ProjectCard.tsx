'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Project } from '@/types/database';
import { getProxiedImageUrl } from '@/lib/image-proxy';

interface ProjectCardProps {
  project: Project;
  showDevNotes?: boolean;
}

interface ProjectLinks {
  github?: string;
  demo?: string;
  video?: string;
}

export function ProjectCard({ project, showDevNotes = false }: ProjectCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const links = project.links as ProjectLinks;
  const coverUrl = getProxiedImageUrl(project.cover_url);

  return (
    <div
      className="group relative h-[320px] perspective-1000"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={`
          relative w-full h-full transition-transform duration-500 transform-style-3d
          ${isFlipped ? 'rotate-y-180' : ''}
        `}
      >
        {/* Front of card */}
        <div className="absolute inset-0 backface-hidden">
          <Link
            href={`/projects/${project.slug}`}
            className="block h-full bg-[var(--surface)] rounded-xl border border-[var(--muted)]/20 
                       overflow-hidden transition-all duration-300
                       hover:border-[var(--blue)]/50 hover:shadow-lg hover:shadow-[var(--blue)]/10
                       focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
          >
            {/* Cover Image */}
            {coverUrl && (
              <div className="relative h-40 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url(${coverUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] to-transparent" />
              </div>
            )}
            
            {/* Content */}
            <div className={`p-5 ${!coverUrl ? 'pt-6' : ''}`}>
              <h3 className="font-heading text-lg text-[var(--text)] mb-2 group-hover:text-[var(--blue)] transition-colors">
                {project.title}
              </h3>
              <p className="text-[var(--muted)] text-sm line-clamp-2 mb-4">
                {project.one_liner}
              </p>
              
              {/* Stack chips preview */}
              {project.stack && project.stack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.stack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 text-xs bg-[var(--bg)] text-[var(--muted)] rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.stack.length > 3 && (
                    <span className="px-2 py-1 text-xs text-[var(--muted)]">
                      +{project.stack.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Dev notes overlay */}
            {showDevNotes && project.build_notes && (
              <div className="absolute inset-0 bg-[var(--bg)]/90 p-4 flex items-center justify-center">
                <p className="text-[var(--text)] text-sm text-center line-clamp-4">
                  {project.build_notes}
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Back of card (flipped view) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="h-full bg-[var(--surface)] rounded-xl border border-[var(--blue)]/50 
                          shadow-lg shadow-[var(--blue)]/10 p-5 flex flex-col">
            <h3 className="font-heading text-lg text-[var(--text)] mb-3">
              {project.title}
            </h3>
            
            {/* Full stack list */}
            {project.stack && project.stack.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 text-xs bg-[var(--bg)] text-[var(--blue)] rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Links */}
            <div className="mt-auto flex flex-wrap gap-3">
              {links?.github && (
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--text)] hover:text-[var(--blue)] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GitHubIcon className="w-4 h-4" />
                  GitHub
                </a>
              )}
              {links?.demo && (
                <a
                  href={links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--text)] hover:text-[var(--blue)] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                  Demo
                </a>
              )}
              {links?.video && (
                <a
                  href={links.video}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--text)] hover:text-[var(--blue)] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <VideoIcon className="w-4 h-4" />
                  Video
                </a>
              )}
              <Link
                href={`/projects/${project.slug}`}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--blue)] hover:underline ml-auto"
              >
                View Details
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
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

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}
