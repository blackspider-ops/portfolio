'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { revalidateAllContent } from '@/app/admin/actions/revalidate';

interface TerminalCommand {
  id: string;
  name: string;
  description: string;
  usage: string | null;
  category: string;
  output_type: 'text' | 'error' | 'success' | 'ascii' | 'list';
  output_content: string;
  output_items: string[] | null;
  is_system: boolean;
  is_enabled: boolean;
  sort_order: number;
}

const OUTPUT_TYPES = [
  { value: 'text', label: 'Text', description: 'Normal text output' },
  { value: 'success', label: 'Success', description: 'Green success message' },
  { value: 'error', label: 'Error', description: 'Red error message' },
  { value: 'ascii', label: 'ASCII Art', description: 'Monospace ASCII art' },
  { value: 'list', label: 'List', description: 'Text with bullet items' },
];

const CATEGORIES = [
  { value: 'custom', label: 'Custom' },
  { value: 'info', label: 'Info' },
  { value: 'fun', label: 'Fun' },
  { value: 'navigation', label: 'Navigation' },
];

export default function AdminTerminalPage() {
  const [commands, setCommands] = useState<TerminalCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [editingCommand, setEditingCommand] = useState<TerminalCommand | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const supabase = createClient();

  const fetchCommands = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('terminal_commands')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching commands:', error);
    } else {
      setCommands(data || []);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);


  const handleSave = async (command: Partial<TerminalCommand>) => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      if (command.id) {
        // Update existing
        const { error } = await supabase
          .from('terminal_commands')
          .update({
            name: command.name,
            description: command.description,
            usage: command.usage || null,
            category: command.category,
            output_type: command.output_type,
            output_content: command.output_content,
            output_items: command.output_items,
            is_enabled: command.is_enabled,
            sort_order: command.sort_order,
          })
          .eq('id', command.id);

        if (error) throw error;
      } else {
        // Create new
        const insertData = {
          name: command.name!,
          description: command.description!,
          usage: command.usage || null,
          category: command.category || 'custom',
          output_type: (command.output_type || 'text') as 'text' | 'error' | 'success' | 'ascii' | 'list',
          output_content: command.output_content!,
          output_items: command.output_items || null,
          is_enabled: command.is_enabled ?? true,
          sort_order: command.sort_order || commands.length,
        };
        const { error } = await supabase
          .from('terminal_commands')
          .insert(insertData);

        if (error) throw error;
      }

      await revalidateAllContent();
      await fetchCommands();
      setSaveStatus('saved');
      setEditingCommand(null);
      setIsCreating(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving command:', error);
      setSaveStatus('error');
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this command?')) return;

    const { error } = await supabase
      .from('terminal_commands')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting command:', error);
      alert('Failed to delete command');
    } else {
      await fetchCommands();
    }
  };

  const handleToggleEnabled = async (command: TerminalCommand) => {
    const { error } = await supabase
      .from('terminal_commands')
      .update({ is_enabled: !command.is_enabled })
      .eq('id', command.id);

    if (error) {
      console.error('Error toggling command:', error);
    } else {
      await fetchCommands();
    }
  };

  const filteredCommands = commands.filter(cmd => {
    const matchesSearch = cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cmd.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || cmd.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Terminal Commands</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage custom terminal commands. System commands (help, ls, cd, etc.) are built-in.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && <span className="text-sm text-[var(--green)]">✓ Saved</span>}
          {saveStatus === 'error' && <span className="text-sm text-red-400">Failed to save</span>}
          <button
            onClick={() => {
              setIsCreating(true);
              setEditingCommand({
                id: '',
                name: '',
                description: '',
                usage: null,
                category: 'custom',
                output_type: 'text',
                output_content: '',
                output_items: null,
                is_system: false,
                is_enabled: true,
                sort_order: commands.length,
              });
            }}
            className="px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors flex items-center gap-2"
          >
            <span>+</span> New Command
          </button>
        </div>
      </div>


      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--blue)]"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--blue)]"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Commands List */}
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--surface)] overflow-hidden">
        {filteredCommands.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)]">
            {searchQuery || filterCategory !== 'all' 
              ? 'No commands match your search.' 
              : 'No custom commands yet. Click "New Command" to create one.'}
          </div>
        ) : (
          <div className="divide-y divide-[var(--bg)]">
            {filteredCommands.map((command) => (
              <div
                key={command.id}
                className={`p-4 hover:bg-[var(--bg)]/50 transition-colors ${!command.is_enabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-[var(--blue)] font-mono font-medium">{command.name}</code>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        command.output_type === 'success' ? 'bg-[var(--green)]/20 text-[var(--green)]' :
                        command.output_type === 'error' ? 'bg-red-500/20 text-red-400' :
                        command.output_type === 'ascii' ? 'bg-[var(--violet)]/20 text-[var(--violet)]' :
                        command.output_type === 'list' ? 'bg-[var(--orange)]/20 text-[var(--orange)]' :
                        'bg-[var(--muted)]/20 text-[var(--muted)]'
                      }`}>
                        {command.output_type}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded bg-[var(--surface)] text-[var(--muted)]">
                        {command.category}
                      </span>
                      {command.is_system && (
                        <span className="px-2 py-0.5 text-xs rounded bg-[var(--blue)]/20 text-[var(--blue)]">
                          system
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text)] mb-1">{command.description}</p>
                    {command.usage && (
                      <p className="text-xs text-[var(--muted)] font-mono">Usage: {command.usage}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEnabled(command)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        command.is_enabled
                          ? 'bg-[var(--green)]/20 text-[var(--green)]'
                          : 'bg-[var(--surface)] text-[var(--muted)]'
                      }`}
                    >
                      {command.is_enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => setEditingCommand(command)}
                      className="px-3 py-1.5 text-xs bg-[var(--surface)] text-[var(--text)] rounded-lg hover:bg-[var(--bg)] transition-colors"
                    >
                      Edit
                    </button>
                    {!command.is_system && (
                      <button
                        onClick={() => handleDelete(command.id)}
                        className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Built-in Commands Reference */}
      <div className="mt-8 p-6 bg-[var(--surface)] rounded-lg border border-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Built-in System Commands</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          These commands are hardcoded and cannot be modified. They provide core terminal functionality.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm font-mono">
          {[
            { cmd: 'help', desc: 'Show all commands' },
            { cmd: 'whoami', desc: 'Display bio' },
            { cmd: 'ls [dir]', desc: 'List content' },
            { cmd: 'cd <page>', desc: 'Navigate pages' },
            { cmd: 'open <slug>', desc: 'Open project' },
            { cmd: 'blog <query>', desc: 'Search blog' },
            { cmd: 'theme <name>', desc: 'Change theme' },
            { cmd: 'clear', desc: 'Clear terminal' },
            { cmd: 'history', desc: 'Command history' },
            { cmd: 'echo <text>', desc: 'Print text' },
            { cmd: 'date', desc: 'Show date/time' },
            { cmd: 'uptime', desc: 'Session duration' },
            { cmd: 'contact', desc: 'Contact info' },
            { cmd: 'skills', desc: 'Technical skills' },
            { cmd: 'ascii <text>', desc: 'ASCII art' },
            { cmd: 'fortune', desc: 'Random quote' },
            { cmd: 'cowsay <msg>', desc: 'Cow says...' },
            { cmd: 'neofetch', desc: 'System info' },
            { cmd: 'matrix', desc: 'Matrix effect' },
            { cmd: 'reveal', desc: 'Toggle dev notes' },
            { cmd: 'snake', desc: 'Play Snake' },
            { cmd: 'pong', desc: 'Play Pong' },
            { cmd: 'sudo', desc: 'Nice try 🔒' },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="flex justify-between p-2 bg-[var(--bg)] rounded">
              <code className="text-[var(--blue)]">{cmd}</code>
              <span className="text-[var(--muted)]">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Create Modal */}
      {(editingCommand || isCreating) && (
        <CommandEditor
          command={editingCommand!}
          isCreating={isCreating}
          isSaving={isSaving}
          onSave={handleSave}
          onCancel={() => {
            setEditingCommand(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}


// Command Editor Modal
function CommandEditor({
  command,
  isCreating,
  isSaving,
  onSave,
  onCancel,
}: {
  command: TerminalCommand;
  isCreating: boolean;
  isSaving: boolean;
  onSave: (command: Partial<TerminalCommand>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<TerminalCommand>>(command);
  const [listItems, setListItems] = useState<string>(
    command.output_items?.join('\n') || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.name?.trim()) {
      alert('Command name is required');
      return;
    }
    if (!formData.output_content?.trim() && formData.output_type !== 'list') {
      alert('Output content is required');
      return;
    }

    // Parse list items if type is list
    const output_items = formData.output_type === 'list' && listItems.trim()
      ? listItems.split('\n').filter(item => item.trim())
      : null;

    onSave({
      ...formData,
      output_items,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[var(--surface)] rounded-xl border border-[var(--surface)] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--bg)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            {isCreating ? 'Create Command' : 'Edit Command'}
          </h2>
          <button
            onClick={onCancel}
            className="text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Command Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s/g, '') })}
              placeholder="mycommand"
              className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] font-mono focus:outline-none focus:border-[var(--blue)]"
              disabled={command.is_system}
            />
            <p className="text-xs text-[var(--muted)] mt-1">Lowercase, no spaces. This is what users type.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Description *
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What this command does"
              className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--blue)]"
            />
          </div>

          {/* Usage */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Usage (optional)
            </label>
            <input
              type="text"
              value={formData.usage || ''}
              onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
              placeholder="mycommand [arg1] <arg2>"
              className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] font-mono focus:outline-none focus:border-[var(--blue)]"
            />
            <p className="text-xs text-[var(--muted)] mt-1">Use [brackets] for optional args, &lt;angle&gt; for required.</p>
          </div>

          {/* Category and Output Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Category
              </label>
              <select
                value={formData.category || 'custom'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--blue)]"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Output Type
              </label>
              <select
                value={formData.output_type || 'text'}
                onChange={(e) => setFormData({ ...formData, output_type: e.target.value as TerminalCommand['output_type'] })}
                className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--blue)]"
              >
                {OUTPUT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Output Content */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Output Content *
            </label>
            <textarea
              value={formData.output_content || ''}
              onChange={(e) => setFormData({ ...formData, output_content: e.target.value })}
              placeholder={formData.output_type === 'ascii' 
                ? 'Enter ASCII art here...\nUse multiple lines for art.'
                : 'The text that will be displayed when the command runs.'}
              rows={formData.output_type === 'ascii' ? 10 : 4}
              className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] font-mono text-sm focus:outline-none focus:border-[var(--blue)] resize-none"
            />
          </div>

          {/* List Items (only for list type) */}
          {formData.output_type === 'list' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                List Items (one per line)
              </label>
              <textarea
                value={listItems}
                onChange={(e) => setListItems(e.target.value)}
                placeholder="Item 1&#10;Item 2&#10;Item 3"
                rows={5}
                className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] font-mono text-sm focus:outline-none focus:border-[var(--blue)] resize-none"
              />
            </div>
          )}

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Preview
            </label>
            <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--surface)] font-mono text-sm">
              <div className="text-[var(--green)] mb-2">phantom@protocol:~$ {formData.name || 'command'}</div>
              <div className={
                formData.output_type === 'success' ? 'text-[var(--green)]' :
                formData.output_type === 'error' ? 'text-red-400' :
                formData.output_type === 'ascii' ? 'text-[var(--muted)] whitespace-pre' :
                'text-[var(--text)]'
              }>
                {formData.output_content || '(output will appear here)'}
              </div>
              {formData.output_type === 'list' && listItems && (
                <div className="text-[var(--muted)] mt-1">
                  {listItems.split('\n').filter(i => i.trim()).map((item, i) => (
                    <div key={i}>{item}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--bg)]">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : isCreating ? 'Create Command' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
