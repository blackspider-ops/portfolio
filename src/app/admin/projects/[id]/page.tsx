'use client';

import { useEffect, useState, useCallback, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/database';
import { useAutosave, AutosaveIndicator } from '@/lib/hooks/useAutosave';
import { PublishWorkflow, RevisionHistory, ImageUpload } from '@/components/admin';
import { saveRevision } from '@/lib/revisions';

interface ProjectEditorProps {
  params: Promise<{ id: string }>;
}

type ProjectLinks = {
  github?: string;
  demo?: string;
  video?: string;
};

export default function ProjectEditorPage({ params }: ProjectEditorProps) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [problem, setProblem] = useState('');
  const [approach, setApproach] = useState('');
  const [impact, setImpact] = useState('');
  const [stack, setStack] = useState<string[]>([]);
  const [stackInput, setStackInput] = useState('');
  const [links, setLinks] = useState<ProjectLinks>({});
  const [buildNotes, setBuildNotes] = useState('');
  const [buildDiagramUrl, setBuildDiagramUrl] = useState('');
  const [tradeoffs, setTradeoffs] = useState<string[]>([]);
  const [tradeoffInput, setTradeoffInput] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [improvementInput, setImprovementInput] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<Project['status']>('draft');

  // Track original slug for redirect creation
  const [originalSlug, setOriginalSlug] = useState('');

  const fetchProject = useCallback(async () => {
    if (isNew) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      setError('Project not found');
      setIsLoading(false);
      return;
    }

    setTitle(data.title);
    setSlug(data.slug);
    setOriginalSlug(data.slug);
    setOneLiner(data.one_liner);
    setProblem(data.problem || '');
    setApproach(data.approach || '');
    setImpact(data.impact || '');
    setStack(data.stack || []);
    setLinks((data.links as ProjectLinks) || {});
    setBuildNotes(data.build_notes || '');
    setBuildDiagramUrl(data.build_diagram_url || '');
    setTradeoffs(data.tradeoffs || []);
    setImprovements(data.improvements || []);
    setCoverUrl(data.cover_url || '');
    setIsFeatured(data.is_featured);
    setStatus(data.status);
    setIsLoading(false);
    setHasInitialized(true);
  }, [id, isNew, supabase]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Autosave data object
  const autosaveData = useMemo(() => ({
    title,
    slug,
    one_liner: oneLiner,
    problem: problem || null,
    approach: approach || null,
    impact: impact || null,
    stack,
    links,
    build_notes: buildNotes || null,
    build_diagram_url: buildDiagramUrl || null,
    tradeoffs,
    improvements,
    cover_url: coverUrl || null,
    is_featured: isFeatured,
    status,
  }), [title, slug, oneLiner, problem, approach, impact, stack, links, buildNotes, buildDiagramUrl, tradeoffs, improvements, coverUrl, isFeatured, status]);

  // Autosave handler
  const handleAutosave = useCallback(async (data: typeof autosaveData) => {
    if (isNew || !hasInitialized || !data.title || !data.slug || !data.one_liner) return;

    // Get current user for revision tracking
    const { data: userData } = await supabase.auth.getUser();

    // Get current content to save as revision before updating
    const { data: currentContent } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (currentContent) {
      // Save revision before updating
      await saveRevision({
        contentType: 'project',
        contentId: id,
        data: currentContent,
        userId: userData.user?.id,
      });
    }

    // Check if slug changed and create redirect
    if (originalSlug && data.slug !== originalSlug) {
      await supabase.from('redirects').insert({
        from_path: `/projects/${originalSlug}`,
        to_path: `/projects/${data.slug}`,
      });
      setOriginalSlug(data.slug);
    }

    await supabase
      .from('projects')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }, [id, isNew, hasInitialized, originalSlug, supabase]);

  const { status: autosaveStatus, lastSaved } = useAutosave({
    data: autosaveData,
    onSave: handleAutosave,
    interval: 5000,
    enabled: !isNew && hasInitialized && !!title && !!slug && !!oneLiner,
  });

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (isNew || !originalSlug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async () => {
    if (!title || !slug || !oneLiner) {
      setError('Title, slug, and one-liner are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    const projectData = {
      title,
      slug,
      one_liner: oneLiner,
      problem: problem || null,
      approach: approach || null,
      impact: impact || null,
      stack,
      links,
      build_notes: buildNotes || null,
      build_diagram_url: buildDiagramUrl || null,
      tradeoffs,
      improvements,
      cover_url: coverUrl || null,
      is_featured: isFeatured,
      status,
      updated_at: new Date().toISOString(),
    };

    try {
      // Get current user for revision tracking
      const { data: userData } = await supabase.auth.getUser();

      if (isNew) {
        const { data, error: insertError } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single();

        if (insertError) throw insertError;

        router.push(`/admin/projects/${data.id}`);
      } else {
        // Get current content to save as revision before updating
        const { data: currentContent } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (currentContent) {
          // Save revision before updating
          await saveRevision({
            contentType: 'project',
            contentId: id,
            data: currentContent,
            userId: userData.user?.id,
          });
        }

        // Check if slug changed and create redirect
        if (originalSlug && slug !== originalSlug) {
          await supabase.from('redirects').insert({
            from_path: `/projects/${originalSlug}`,
            to_path: `/projects/${slug}`,
          });
          setOriginalSlug(slug);
        }

        const { error: updateError } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', id);

        if (updateError) throw updateError;
      }
    } catch (err) {
      console.error('Error saving project:', err);
      setError('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const addStackItem = () => {
    if (stackInput.trim() && !stack.includes(stackInput.trim())) {
      setStack([...stack, stackInput.trim()]);
      setStackInput('');
    }
  };

  const removeStackItem = (item: string) => {
    setStack(stack.filter((s) => s !== item));
  };

  const addTradeoff = () => {
    if (tradeoffInput.trim()) {
      setTradeoffs([...tradeoffs, tradeoffInput.trim()]);
      setTradeoffInput('');
    }
  };

  const removeTradeoff = (index: number) => {
    setTradeoffs(tradeoffs.filter((_, i) => i !== index));
  };

  const addImprovement = () => {
    if (improvementInput.trim()) {
      setImprovements([...improvements, improvementInput.trim()]);
      setImprovementInput('');
    }
  };

  const removeImprovement = (index: number) => {
    setImprovements(improvements.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !isNew && !title) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
          <a
            href="/admin/projects"
            className="inline-block mt-4 text-[var(--blue)] hover:underline"
          >
            ← Back to projects
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <a
            href="/admin/projects"
            className="text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            ← Back
          </a>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            {isNew ? 'New Project' : 'Edit Project'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <AutosaveIndicator status={autosaveStatus} lastSaved={lastSaved} />
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="Project title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Slug *
              </label>
              <div className="flex items-center">
                <span className="text-[var(--muted)] text-sm mr-2">/projects/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                  placeholder="project-slug"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                One-liner *
              </label>
              <input
                type="text"
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="A brief description of the project"
              />
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
            Content
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Problem
              </label>
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)] resize-none"
                placeholder="What problem does this project solve?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Approach
              </label>
              <textarea
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)] resize-none"
                placeholder="How did you approach solving it?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Impact
              </label>
              <textarea
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)] resize-none"
                placeholder="What was the impact or result?"
              />
            </div>
          </div>
        </section>

        {/* Stack Chips */}
        <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {stack.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--bg)] text-[var(--text)] text-sm rounded-full"
              >
                {item}
                <button
                  onClick={() => removeStackItem(item)}
                  className="ml-1 text-[var(--muted)] hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={stackInput}
              onChange={(e) => setStackInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStackItem())}
              className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              placeholder="Add technology (press Enter)"
            />
            <button
              onClick={addStackItem}
              className="px-4 py-2 bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--bg)]/80 transition-colors border border-[var(--surface)]"
            >
              Add
            </button>
          </div>
        </section>

        {/* Links */}
        <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
            Links
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                GitHub URL
              </label>
              <input
                type="url"
                value={links.github || ''}
                onChange={(e) => setLinks({ ...links, github: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Demo URL
              </label>
              <input
                type="url"
                value={links.demo || ''}
                onChange={(e) => setLinks({ ...links, demo: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Video URL
              </label>
              <input
                type="url"
                value={links.video || ''}
                onChange={(e) => setLinks({ ...links, video: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </section>

        {/* Build Notes */}
        <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
            Build Notes
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Build Notes (Markdown)
              </label>
              <textarea
                value={buildNotes}
                onChange={(e) => setBuildNotes(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)] resize-none"
                placeholder="Technical notes about the build process..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Build Diagram URL
              </label>
              <input
                type="url"
                value={buildDiagramUrl}
                onChange={(e) => setBuildDiagramUrl(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="URL to architecture diagram"
              />
            </div>
          </div>
        </section>

        {/* Tradeoffs */}
        <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
            Tradeoffs
          </h2>
          <div className="space-y-2 mb-3">
            {tradeoffs.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-[var(--bg)] rounded-lg"
              >
                <span className="flex-1 text-sm text-[var(--text)]">{item}</span>
                <button
                  onClick={() => removeTradeoff(index)}
                  className="text-[var(--muted)] hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tradeoffInput}
              onChange={(e) => setTradeoffInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTradeoff())}
              className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              placeholder="Add a tradeoff (press Enter)"
            />
            <button
              onClick={addTradeoff}
              className="px-4 py-2 bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--bg)]/80 transition-colors border border-[var(--surface)]"
            >
              Add
            </button>
          </div>
        </section>

        {/* Improvements */}
        <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
            What I&apos;d Improve Next
          </h2>
          <div className="space-y-2 mb-3">
            {improvements.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-[var(--bg)] rounded-lg"
              >
                <span className="flex-1 text-sm text-[var(--text)]">{item}</span>
                <button
                  onClick={() => removeImprovement(index)}
                  className="text-[var(--muted)] hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={improvementInput}
              onChange={(e) => setImprovementInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImprovement())}
              className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              placeholder="Add an improvement idea (press Enter)"
            />
            <button
              onClick={addImprovement}
              className="px-4 py-2 bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--bg)]/80 transition-colors border border-[var(--surface)]"
            >
              Add
            </button>
          </div>
        </section>

        {/* Cover Image */}
        <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
          <ImageUpload
            value={coverUrl}
            onChange={setCoverUrl}
            bucket="covers"
            label="Cover Image"
            aspectRatio="video"
          />
        </section>

        {/* Settings */}
        <section className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
            Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="featured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--surface)] bg-[var(--bg)] text-[var(--blue)] focus:ring-[var(--blue)]"
              />
              <label htmlFor="featured" className="text-sm text-[var(--text)]">
                Featured project (shown on home page)
              </label>
            </div>
            {isNew && (
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Project['status'])}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Publish Workflow (for existing projects) */}
        {!isNew && (
          <PublishWorkflow
            contentId={id}
            contentType="project"
            currentStatus={status}
            slug={slug}
            onStatusChange={setStatus}
          />
        )}

        {/* Revision History (for existing projects) */}
        {!isNew && (
          <RevisionHistory
            contentId={id}
            contentType="project"
            onRestore={fetchProject}
          />
        )}

        {/* Save Button (bottom) */}
        <div className="flex justify-end gap-3 pt-4">
          <a
            href="/admin/projects"
            className="px-4 py-2 bg-[var(--surface)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--surface)]/80 transition-colors"
          >
            Cancel
          </a>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
