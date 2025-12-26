'use client';

import { useProjects } from '@/lib/hooks/useData';
import { ProjectCard } from './ProjectCard';

export function ProjectsContent() {
  const { data: projects } = useProjects();

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--muted)] text-lg">
          No projects published yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
