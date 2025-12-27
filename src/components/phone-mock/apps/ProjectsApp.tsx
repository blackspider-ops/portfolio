'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/database';
import { getProxiedImageUrl } from '@/lib/image-proxy';

interface ProjectsAppProps {
  onClose: () => void;
}

export function ProjectsApp({ onClose }: ProjectsAppProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'published')
          .order('sort_order', { ascending: true })
          .limit(10);
        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <button onClick={onClose} className="text-blue-400 text-sm">
          ← Back
        </button>
        <h1 className="text-white font-semibold">Projects</h1>
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedProject(project)}
                className="bg-white/5 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
              >
                {project.cover_url && (
                  <div 
                    className="h-32 bg-cover bg-center"
                    style={{ backgroundImage: `url(${getProxiedImageUrl(project.cover_url)})` }}
                  />
                )}
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1">{project.title}</h3>
                  <p className="text-white/60 text-sm line-clamp-2">{project.one_liner}</p>
                  {project.stack && project.stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {project.stack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.stack.length > 3 && (
                        <span className="text-white/40 text-xs">+{project.stack.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Project detail modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectDetail 
            project={selectedProject} 
            onClose={() => setSelectedProject(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const links = project.links as { github?: string; demo?: string } | null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 mt-12">
        <button onClick={onClose} className="text-blue-400 text-sm">
          ← Back
        </button>
        <h1 className="text-white font-semibold truncate max-w-[200px]">{project.title}</h1>
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {project.cover_url && (
          <div 
            className="h-48 bg-cover bg-center"
            style={{ backgroundImage: `url(${getProxiedImageUrl(project.cover_url)})` }}
          />
        )}
        
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-xl text-white font-bold mb-2">{project.title}</h2>
            <p className="text-white/70">{project.one_liner}</p>
          </div>

          {project.stack && project.stack.length > 0 && (
            <div>
              <h3 className="text-white/50 text-xs uppercase tracking-wider mb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.tradeoffs && project.tradeoffs.length > 0 && (
            <div>
              <h3 className="text-white/50 text-xs uppercase tracking-wider mb-2">Key Decisions</h3>
              <ul className="space-y-2">
                {project.tradeoffs.map((tradeoff, i) => (
                  <li key={i} className="text-white/70 text-sm flex gap-2">
                    <span className="text-blue-400">•</span>
                    {tradeoff}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Links */}
          <div className="flex gap-3 pt-4">
            {links?.github && (
              <a
                href={links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-white/10 rounded-xl text-white text-center text-sm font-medium"
              >
                View Code
              </a>
            )}
            {links?.demo && (
              <a
                href={links.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-blue-500 rounded-xl text-white text-center text-sm font-medium"
              >
                Live Demo
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
