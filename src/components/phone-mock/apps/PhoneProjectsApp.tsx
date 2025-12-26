'use client';

/**
 * Phone Projects App
 * Requirements: 8.2, 8.3
 * - Display projects in phone-style cards
 * - Long-press shows stack chips and key tradeoff
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Project } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { PhoneShareButton } from '../PhoneShareButton';
import { getProxiedImageUrl } from '@/lib/image-proxy';

interface PhoneProjectCardProps {
  project: Project;
}

function PhoneProjectCard({ project }: PhoneProjectCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Long-press handling - Requirement 8.3
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowDetails(true);
    }, 500); // 500ms for long press
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowDetails(true);
    }, 500);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Close details on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDetails]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const links = project.links as { github?: string; demo?: string; video?: string };

  return (
    <div
      ref={cardRef}
      className="relative bg-[var(--surface)] rounded-xl overflow-hidden border border-[var(--muted)]/20"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Cover image */}
      {project.cover_url && (
        <div className="relative h-32 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${getProxiedImageUrl(project.cover_url)})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading text-base text-[var(--text)] mb-1">
          {project.title}
        </h3>
        <p className="text-[var(--muted)] text-sm line-clamp-2 mb-3">
          {project.one_liner}
        </p>

        {/* Stack preview */}
        {project.stack && project.stack.length > 0 && !showDetails && (
          <div className="flex flex-wrap gap-1.5">
            {project.stack.slice(0, 2).map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 text-xs bg-[var(--bg)] text-[var(--muted)] rounded"
              >
                {tech}
              </span>
            ))}
            {project.stack.length > 2 && (
              <span className="px-2 py-0.5 text-xs text-[var(--muted)]">
                +{project.stack.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Link
            href={`/projects/${project.slug}`}
            className="text-xs text-[var(--blue)] hover:underline"
          >
            View Details
          </Link>
          <PhoneShareButton
            title={project.title}
            coverUrl={getProxiedImageUrl(project.cover_url)}
            type="project"
          />
        </div>
      </div>

      {/* Long-press details overlay - Requirement 8.3 */}
      {showDetails && (
        <div className="absolute inset-0 bg-[var(--bg)]/95 p-4 flex flex-col animate-in fade-in duration-200">
          <button
            onClick={() => setShowDetails(false)}
            className="absolute top-2 right-2 p-1 text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Close details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h3 className="font-heading text-base text-[var(--text)] mb-3">
            {project.title}
          </h3>

          {/* Full stack chips */}
          {project.stack && project.stack.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">
                Stack
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 text-xs bg-[var(--surface)] text-[var(--blue)] rounded"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key tradeoff */}
          {project.tradeoffs && project.tradeoffs.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">
                Key Tradeoff
              </h4>
              <p className="text-sm text-[var(--text)]">
                {project.tradeoffs[0]}
              </p>
            </div>
          )}

          {/* Links */}
          <div className="mt-auto flex flex-wrap gap-3">
            {links?.github && (
              <a
                href={links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--text)] hover:text-[var(--blue)]"
              >
                GitHub
              </a>
            )}
            {links?.demo && (
              <a
                href={links.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--text)] hover:text-[var(--blue)]"
              >
                Demo
              </a>
            )}
          </div>
        </div>
      )}

      {/* Long-press hint */}
      <div className="absolute bottom-2 right-2 text-[10px] text-[var(--muted)]/50">
        Hold for details
      </div>
    </div>
  );
}

export function PhoneProjectsApp() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'published')
          .order('sort_order', { ascending: true })
          .limit(6);

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-[var(--surface)] rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="font-heading text-xl text-[var(--text)] mb-4">Projects</h2>
      <div className="space-y-4">
        {projects.map((project) => (
          <PhoneProjectCard key={project.id} project={project} />
        ))}
        {projects.length === 0 && (
          <p className="text-[var(--muted)] text-center py-8">
            No projects yet
          </p>
        )}
      </div>
    </div>
  );
}
