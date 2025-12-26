'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/database';

type StatusFilter = 'all' | 'draft' | 'published' | 'archived';

interface GitHubRepo {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  lastPushed: string;
  isFork: boolean;
  isArchived: boolean;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  // GitHub import state
  const [showGitHubImport, setShowGitHubImport] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<Record<number, 'publish' | 'draft' | 'archive' | null>>({});
  const [importing, setImporting] = useState(false);
  
  const supabase = createClient();

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setIsLoading(false);
  }, [supabase, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setIsDragging(false);

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = projects.findIndex((p) => p.id === draggedId);
    const targetIndex = projects.findIndex((p) => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Reorder locally first for immediate feedback
    const newProjects = [...projects];
    const [removed] = newProjects.splice(draggedIndex, 1);
    newProjects.splice(targetIndex, 0, removed);

    // Update sort_order for all affected projects
    const updatedProjects = newProjects.map((p, index) => ({
      ...p,
      sort_order: index,
    }));

    setProjects(updatedProjects);
    setDraggedId(null);

    // Persist to database
    const updates = updatedProjects.map((p) => ({
      id: p.id,
      sort_order: p.sort_order,
    }));

    for (const update of updates) {
      await supabase
        .from('projects')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    } else {
      setProjects(projects.filter((p) => p.id !== id));
    }
  };

  const getStatusBadgeClass = (status: Project['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // GitHub import functions
  const fetchGitHubRepos = async () => {
    setLoadingRepos(true);
    try {
      const response = await fetch('/api/github-repos');
      const data = await response.json();
      
      // Filter out repos that already exist as projects
      const existingSlugs = new Set(projects.map(p => p.slug));
      const newRepos = (data.repos || []).filter(
        (repo: GitHubRepo) => !existingSlugs.has(repo.slug)
      );
      
      setGithubRepos(newRepos);
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleRepoSelection = (repoId: number, action: 'publish' | 'draft' | 'archive' | null) => {
    setSelectedRepos(prev => ({
      ...prev,
      [repoId]: prev[repoId] === action ? null : action,
    }));
  };

  const importSelectedRepos = async () => {
    const reposToImport = githubRepos.filter(repo => selectedRepos[repo.id]);
    if (reposToImport.length === 0) return;

    setImporting(true);
    try {
      const maxSortOrder = Math.max(...projects.map(p => p.sort_order), -1);
      
      for (let i = 0; i < reposToImport.length; i++) {
        const repo = reposToImport[i];
        const status = selectedRepos[repo.id];
        
        const projectData = {
          title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          slug: repo.slug,
          one_liner: repo.description || `A ${repo.language || 'code'} project`,
          problem: null,
          approach: null,
          impact: null,
          stack: repo.language ? [repo.language, ...repo.topics.slice(0, 4)] : repo.topics.slice(0, 5),
          links: {
            github: repo.url,
            live: repo.homepage || null,
          },
          build_notes: null,
          tradeoffs: [],
          improvements: [],
          cover_url: null,
          is_featured: false,
          sort_order: maxSortOrder + i + 1,
          status: (status === 'publish' ? 'published' : status === 'archive' ? 'archived' : 'draft') as 'draft' | 'published' | 'archived',
          published_at: status === 'publish' ? new Date().toISOString() : null,
        };

        await supabase.from('projects').insert(projectData);
      }

      // Refresh projects list
      await fetchProjects();
      setShowGitHubImport(false);
      setSelectedRepos({});
      setGithubRepos([]);
    } catch (error) {
      console.error('Error importing repos:', error);
      alert('Failed to import some repositories');
    } finally {
      setImporting(false);
    }
  };

  const openGitHubImport = () => {
    setShowGitHubImport(true);
    fetchGitHubRepos();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Projects</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={openGitHubImport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--surface)]/80 transition-colors border border-[var(--muted)]/20"
          >
            <GitHubIcon />
            Import from GitHub
          </button>
          <a
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors"
          >
            <PlusIcon />
            New Project
          </a>
        </div>
      </div>

      {/* GitHub Import Modal */}
      {showGitHubImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg)] rounded-lg border border-[var(--surface)] max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--surface)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text)]">Import from GitHub</h2>
              <button
                onClick={() => setShowGitHubImport(false)}
                className="text-[var(--muted)] hover:text-[var(--text)]"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingRepos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : githubRepos.length === 0 ? (
                <p className="text-center text-[var(--muted)] py-12">
                  No new repositories found to import.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--muted)] mb-4">
                    Select repositories to import and choose their status:
                  </p>
                  {githubRepos.map(repo => (
                    <div
                      key={repo.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        selectedRepos[repo.id]
                          ? 'bg-[var(--surface)] border-[var(--blue)]/50'
                          : 'bg-[var(--surface)]/50 border-[var(--surface)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-[var(--text)] truncate">{repo.name}</h3>
                            {repo.language && (
                              <span className="text-xs px-2 py-0.5 bg-[var(--bg)] text-[var(--muted)] rounded">
                                {repo.language}
                              </span>
                            )}
                            {repo.stars > 0 && (
                              <span className="text-xs text-[var(--muted)]">⭐ {repo.stars}</span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">
                            {repo.description || 'No description'}
                          </p>
                          {repo.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {repo.topics.slice(0, 5).map(topic => (
                                <span key={topic} className="text-xs px-1.5 py-0.5 bg-[var(--bg)] text-[var(--muted)] rounded">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRepoSelection(repo.id, 'publish')}
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                              selectedRepos[repo.id] === 'publish'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)]'
                            }`}
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => handleRepoSelection(repo.id, 'draft')}
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                              selectedRepos[repo.id] === 'draft'
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)]'
                            }`}
                          >
                            Draft
                          </button>
                          <button
                            onClick={() => handleRepoSelection(repo.id, 'archive')}
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                              selectedRepos[repo.id] === 'archive'
                                ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                : 'bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)]'
                            }`}
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-[var(--surface)] flex items-center justify-between">
              <p className="text-sm text-[var(--muted)]">
                {Object.values(selectedRepos).filter(Boolean).length} selected
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGitHubImport(false)}
                  className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  onClick={importSelectedRepos}
                  disabled={importing || Object.values(selectedRepos).filter(Boolean).length === 0}
                  className="px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Import Selected'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'draft', 'published', 'archived'] as StatusFilter[]).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-[var(--blue)] text-white'
                  : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-[var(--surface)] rounded-lg border border-[var(--surface)]">
          <p className="text-[var(--muted)] mb-4">No projects found</p>
          <a
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors"
          >
            <PlusIcon />
            Create your first project
          </a>
        </div>
      ) : (
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--surface)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--bg)]">
                <th className="w-10 px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bg)]">
              {projects.map((project, index) => (
                <tr
                  key={project.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, project.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, project.id)}
                  onDragEnd={handleDragEnd}
                  className={`hover:bg-[var(--bg)]/50 transition-colors ${
                    isDragging && draggedId === project.id
                      ? 'opacity-50'
                      : ''
                  } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">
                    <DragIcon />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <a
                        href={`/admin/projects/${project.id}`}
                        className="text-sm font-medium text-[var(--text)] hover:text-[var(--blue)] transition-colors"
                      >
                        {project.title}
                      </a>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        /{project.slug}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusBadgeClass(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {project.is_featured && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-[var(--violet)]/10 text-[var(--violet)] border border-[var(--violet)]/20">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/admin/projects/${project.id}`}
                        className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                        title="Edit"
                      >
                        <EditIcon />
                      </a>
                      {project.status === 'published' && (
                        <a
                          href={`/projects/${project.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                          title="View"
                        >
                          <ExternalLinkIcon />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-1.5 text-[var(--muted)] hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drag hint */}
      {projects.length > 1 && (
        <p className="text-xs text-[var(--muted)] mt-4 text-center">
          Drag rows to reorder projects
        </p>
      )}
    </div>
  );
}

// Icons
function PlusIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}

function DragIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}
