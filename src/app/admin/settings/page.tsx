'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { revalidateAllContent } from '@/app/admin/actions/revalidate';
import type { Json } from '@/types/database';

interface SocialLinks {
  github?: string;
  linkedin?: string;
  email?: string;
  calendly?: string;
}

interface SeoDefaults {
  title?: string;
  description?: string;
  og_image?: string;
}

interface FeatureToggles {
  terminal: boolean;
  phone_mock: boolean;
  games: boolean;
  '3d_ribbon': boolean;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  enabled: boolean;
}

interface GameConfig {
  enabled: boolean;
  name: string;
  emoji: string;
}

interface GamesConfig {
  snake: GameConfig;
  pong: GameConfig;
  tetris: GameConfig;
  breakout: GameConfig;
  flappy: GameConfig;
}

interface ThemeConfig {
  colors: {
    violet: string;
    blue: string;
    green: string;
    orange: string;
    yellow: string;
  };
}

const DEFAULT_FEATURE_TOGGLES: FeatureToggles = {
  terminal: true,
  phone_mock: true,
  games: true,
  '3d_ribbon': true,
};

const DEFAULT_GAMES_CONFIG: GamesConfig = {
  snake: { enabled: true, name: 'Snake', emoji: '🐍' },
  pong: { enabled: true, name: 'Pong', emoji: '🏓' },
  tetris: { enabled: true, name: 'Tetris', emoji: '🧱' },
  breakout: { enabled: true, name: 'Breakout', emoji: '🧱' },
  flappy: { enabled: true, name: 'Flappy', emoji: '🐦' },
};

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colors: {
    violet: '#8B5CF6',
    blue: '#3B82F6',
    green: '#10B981',
    orange: '#F97316',
    yellow: '#EAB308',
  },
};

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'social' | 'seo' | 'features' | 'navigation' | 'games' | 'site'>('social');
  const supabase = createClient();

  // Form state
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [seoDefaults, setSeoDefaults] = useState<SeoDefaults>({});
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>(DEFAULT_FEATURE_TOGGLES);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [gamesConfig, setGamesConfig] = useState<GamesConfig>(DEFAULT_GAMES_CONFIG);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [siteName, setSiteName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerInitials, setOwnerInitials] = useState('');

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
    } else if (data) {
      setSocialLinks((data.social_links as SocialLinks) || {});
      setSeoDefaults((data.seo_defaults as SeoDefaults) || {});
      
      const toggles = data.feature_toggles;
      if (toggles && typeof toggles === 'object' && !Array.isArray(toggles)) {
        setFeatureToggles({ ...DEFAULT_FEATURE_TOGGLES, ...(toggles as unknown as FeatureToggles) });
      }
      
      const navItems = data.navigation_items;
      if (Array.isArray(navItems)) {
        setNavigationItems(navItems as unknown as NavigationItem[]);
      }
      
      const games = data.games_config;
      if (games && typeof games === 'object' && !Array.isArray(games)) {
        setGamesConfig({ ...DEFAULT_GAMES_CONFIG, ...(games as unknown as GamesConfig) });
      }
      
      const theme = data.theme_config;
      if (theme && typeof theme === 'object' && !Array.isArray(theme)) {
        setThemeConfig({ ...DEFAULT_THEME_CONFIG, ...(theme as unknown as ThemeConfig) });
      }
      
      setSiteName(data.site_name || '');
      setOwnerName(data.owner_name || '');
      setOwnerInitials(data.owner_initials || '');
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    const updateData: Record<string, Json | string> = {
      social_links: socialLinks as unknown as Json,
      seo_defaults: seoDefaults as unknown as Json,
      feature_toggles: featureToggles as unknown as Json,
      navigation_items: navigationItems as unknown as Json,
      games_config: gamesConfig as unknown as Json,
      theme_config: themeConfig as unknown as Json,
      site_name: siteName,
      owner_name: ownerName,
      owner_initials: ownerInitials,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('site_settings')
      .update(updateData)
      .eq('id', '00000000-0000-0000-0000-000000000001');

    if (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
    } else {
      await revalidateAllContent();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Settings</h1>
        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && <span className="text-sm text-[var(--green)]">✓ Saved</span>}
          {saveStatus === 'error' && <span className="text-sm text-red-400">Failed to save</span>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--surface)] p-1 rounded-lg flex-wrap">
        {(['social', 'seo', 'features', 'navigation', 'games', 'site'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-[var(--bg)] text-[var(--text)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab === 'social' && 'Contact Links'}
            {tab === 'seo' && 'SEO'}
            {tab === 'features' && 'Features'}
            {tab === 'navigation' && 'Navigation'}
            {tab === 'games' && 'Games'}
            {tab === 'site' && 'Site Info'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--surface)] p-6">
        {activeTab === 'social' && <SocialLinksTab socialLinks={socialLinks} onChange={setSocialLinks} />}
        {activeTab === 'seo' && <SeoDefaultsTab seoDefaults={seoDefaults} onChange={setSeoDefaults} />}
        {activeTab === 'features' && <FeatureTogglesTab featureToggles={featureToggles} onChange={setFeatureToggles} />}
        {activeTab === 'navigation' && <NavigationTab navigationItems={navigationItems} onChange={setNavigationItems} />}
        {activeTab === 'games' && <GamesTab gamesConfig={gamesConfig} onChange={setGamesConfig} />}
        {activeTab === 'site' && (
          <SiteInfoTab
            siteName={siteName}
            setSiteName={setSiteName}
            ownerName={ownerName}
            setOwnerName={setOwnerName}
            ownerInitials={ownerInitials}
            setOwnerInitials={setOwnerInitials}
            themeConfig={themeConfig}
            setThemeConfig={setThemeConfig}
          />
        )}
      </div>
    </div>
  );
}


// Social Links Tab
function SocialLinksTab({
  socialLinks,
  onChange,
}: {
  socialLinks: { github?: string; linkedin?: string; email?: string; calendly?: string };
  onChange: (links: { github?: string; linkedin?: string; email?: string; calendly?: string }) => void;
}) {
  const updateField = (field: string, value: string) => {
    onChange({ ...socialLinks, [field]: value || undefined });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Contact Links</h3>
        <p className="text-sm text-[var(--muted)] mb-6">Configure your social media and contact links.</p>
      </div>
      <div className="grid gap-6">
        {[
          { key: 'github', label: 'GitHub URL', placeholder: 'https://github.com/username' },
          { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/username' },
          { key: 'email', label: 'Email Address', placeholder: 'hello@example.com' },
          { key: 'calendly', label: 'Calendly URL', placeholder: 'https://calendly.com/username' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">{label}</label>
            <input
              type={key === 'email' ? 'email' : 'url'}
              value={(socialLinks as Record<string, string | undefined>)[key] || ''}
              onChange={(e) => updateField(key, e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--blue)]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// SEO Defaults Tab
function SeoDefaultsTab({
  seoDefaults,
  onChange,
}: {
  seoDefaults: { title?: string; description?: string; og_image?: string };
  onChange: (defaults: { title?: string; description?: string; og_image?: string }) => void;
}) {
  const updateField = (field: string, value: string) => {
    onChange({ ...seoDefaults, [field]: value || undefined });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">SEO Defaults</h3>
        <p className="text-sm text-[var(--muted)] mb-6">Configure default SEO metadata for pages.</p>
      </div>
      <div className="grid gap-6">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">Default Title</label>
          <input
            type="text"
            value={seoDefaults.title || ''}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Tejas Singhal - Developer Portfolio"
            className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)]"
          />
          <p className="text-xs text-[var(--muted)] mt-1">Recommended: 50-60 characters</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">Default Description</label>
          <textarea
            value={seoDefaults.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="A developer portfolio showcasing projects..."
            rows={3}
            className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] resize-none"
          />
          <p className="text-xs text-[var(--muted)] mt-1">Recommended: 150-160 characters</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">Default OG Image URL</label>
          <input
            type="url"
            value={seoDefaults.og_image || ''}
            onChange={(e) => updateField('og_image', e.target.value)}
            placeholder="https://example.com/og-image.png"
            className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)]"
          />
          <p className="text-xs text-[var(--muted)] mt-1">Recommended size: 1200×630 pixels</p>
        </div>
      </div>
    </div>
  );
}

// Feature Toggles Tab
function FeatureTogglesTab({
  featureToggles,
  onChange,
}: {
  featureToggles: { terminal: boolean; phone_mock: boolean; games: boolean; '3d_ribbon': boolean };
  onChange: (toggles: { terminal: boolean; phone_mock: boolean; games: boolean; '3d_ribbon': boolean }) => void;
}) {
  const toggleFeature = (feature: string) => {
    onChange({ ...featureToggles, [feature]: !(featureToggles as Record<string, boolean>)[feature] });
  };

  const features = [
    { key: 'terminal', label: 'Terminal', description: 'Interactive CLI overlay accessible via ~ key' },
    { key: 'phone_mock', label: 'Phone Mock', description: 'Interactive phone mockup for browsing content' },
    { key: 'games', label: 'Games', description: 'Easter egg arcade games (Snake, Pong, etc.)' },
    { key: '3d_ribbon', label: '3D Ribbon', description: 'Animated 3D ink ribbon effect on homepage' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Feature Toggles</h3>
        <p className="text-sm text-[var(--muted)] mb-6">Enable or disable interactive features on the site.</p>
      </div>
      <div className="space-y-4">
        {features.map((feature) => (
          <div key={feature.key} className="flex items-center justify-between p-4 bg-[var(--bg)] rounded-lg border border-[var(--surface)]">
            <div>
              <div className="font-medium text-[var(--text)]">{feature.label}</div>
              <div className="text-sm text-[var(--muted)]">{feature.description}</div>
            </div>
            <button
              onClick={() => toggleFeature(feature.key)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                (featureToggles as Record<string, boolean>)[feature.key] ? 'bg-[var(--blue)]' : 'bg-[var(--surface)]'
              }`}
              role="switch"
              aria-checked={(featureToggles as Record<string, boolean>)[feature.key]}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                (featureToggles as Record<string, boolean>)[feature.key] ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


// Navigation Tab
function NavigationTab({
  navigationItems,
  onChange,
}: {
  navigationItems: { href: string; label: string; icon: string; enabled: boolean }[];
  onChange: (items: { href: string; label: string; icon: string; enabled: boolean }[]) => void;
}) {
  const toggleItem = (index: number) => {
    const updated = [...navigationItems];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    onChange(updated);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...navigationItems];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === navigationItems.length - 1)) return;
    const updated = [...navigationItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  const addItem = () => {
    onChange([...navigationItems, { href: '/new-page', label: 'New Page', icon: 'home', enabled: true }]);
  };

  const removeItem = (index: number) => {
    onChange(navigationItems.filter((_, i) => i !== index));
  };

  const iconOptions = [
    { value: 'home', label: '🏠 Home' },
    { value: 'projects', label: '📁 Projects' },
    { value: 'blog', label: '📝 Blog' },
    { value: 'resume', label: '📄 Resume' },
    { value: 'contact', label: '✉️ Contact' },
    { value: 'arcade', label: '🎮 Arcade' },
    { value: 'link', label: '🔗 External Link' },
    { value: 'github', label: '💻 GitHub' },
    { value: 'twitter', label: '🐦 Twitter' },
    { value: 'linkedin', label: '💼 LinkedIn' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Navigation Items</h3>
          <p className="text-sm text-[var(--muted)]">Configure the sidebar navigation menu. Drag to reorder, toggle to show/hide.</p>
        </div>
        <button
          onClick={addItem}
          className="px-4 py-2 text-sm bg-[var(--blue)] text-white rounded-lg hover:bg-[var(--blue)]/90 flex items-center gap-2"
        >
          <span>+</span> Add Item
        </button>
      </div>
      
      {navigationItems.length === 0 ? (
        <div className="text-center py-8 text-[var(--muted)]">
          No navigation items. Click &quot;Add Item&quot; to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {navigationItems.map((item, index) => (
            <div key={index} className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--surface)]">
              <div className="flex items-start gap-3">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-1 pt-2">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="w-6 h-6 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === navigationItems.length - 1}
                    className="w-6 h-6 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>

                {/* Form fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--muted)] mb-1">Label</label>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateItem(index, 'label', e.target.value)}
                      placeholder="Page Name"
                      className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted)] mb-1">URL / Path</label>
                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => updateItem(index, 'href', e.target.value)}
                      placeholder="/path or https://..."
                      className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted)] mb-1">Icon</label>
                    <select
                      value={item.icon}
                      onChange={(e) => updateItem(index, 'icon', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-[var(--blue)]"
                    >
                      {iconOptions.map((icon) => (
                        <option key={icon.value} value={icon.value}>{icon.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => toggleItem(index)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                        item.enabled 
                          ? 'bg-[var(--green)]/20 text-[var(--green)] border border-[var(--green)]/30' 
                          : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--surface)]'
                      }`}
                    >
                      {item.enabled ? '✓ Visible' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => removeItem(index)}
                      className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete item"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
              
              {/* External link indicator */}
              {item.href.startsWith('http') && (
                <div className="mt-2 ml-9 text-xs text-[var(--muted)] flex items-center gap-1">
                  <span>↗</span> External link - opens in new tab
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="p-4 bg-[var(--bg)]/50 rounded-lg border border-dashed border-[var(--muted)]/30">
        <p className="text-sm text-[var(--muted)]">
          <strong>Tips:</strong> Use paths like <code className="px-1 py-0.5 bg-[var(--surface)] rounded">/projects</code> for internal pages, 
          or full URLs like <code className="px-1 py-0.5 bg-[var(--surface)] rounded">https://github.com/username</code> for external links.
        </p>
      </div>
    </div>
  );
}

// Games Tab
function GamesTab({
  gamesConfig,
  onChange,
}: {
  gamesConfig: {
    snake: { enabled: boolean; name: string; emoji: string };
    pong: { enabled: boolean; name: string; emoji: string };
    tetris: { enabled: boolean; name: string; emoji: string };
    breakout: { enabled: boolean; name: string; emoji: string };
    flappy: { enabled: boolean; name: string; emoji: string };
  };
  onChange: (config: typeof gamesConfig) => void;
}) {
  const toggleGame = (game: keyof typeof gamesConfig) => {
    onChange({
      ...gamesConfig,
      [game]: { ...gamesConfig[game], enabled: !gamesConfig[game].enabled },
    });
  };

  const updateGame = (game: keyof typeof gamesConfig, field: string, value: string) => {
    onChange({
      ...gamesConfig,
      [game]: { ...gamesConfig[game], [field]: value },
    });
  };

  const games = Object.entries(gamesConfig) as [keyof typeof gamesConfig, { enabled: boolean; name: string; emoji: string }][];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Games Configuration</h3>
        <p className="text-sm text-[var(--muted)] mb-6">Enable/disable individual games and customize their display.</p>
      </div>
      <div className="space-y-4">
        {games.map(([key, game]) => (
          <div key={key} className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--surface)]">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={game.emoji}
                onChange={(e) => updateGame(key, 'emoji', e.target.value)}
                className="w-16 px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-center text-xl"
                maxLength={2}
              />
              <input
                type="text"
                value={game.name}
                onChange={(e) => updateGame(key, 'name', e.target.value)}
                className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--surface)] rounded-lg text-[var(--text)]"
              />
              <button
                onClick={() => toggleGame(key)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  game.enabled ? 'bg-[var(--blue)]' : 'bg-[var(--surface)]'
                }`}
                role="switch"
                aria-checked={game.enabled}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  game.enabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Site Info Tab
function SiteInfoTab({
  siteName,
  setSiteName,
  ownerName,
  setOwnerName,
  ownerInitials,
  setOwnerInitials,
  themeConfig,
  setThemeConfig,
}: {
  siteName: string;
  setSiteName: (v: string) => void;
  ownerName: string;
  setOwnerName: (v: string) => void;
  ownerInitials: string;
  setOwnerInitials: (v: string) => void;
  themeConfig: { colors: { violet: string; blue: string; green: string; orange: string; yellow: string } };
  setThemeConfig: (v: typeof themeConfig) => void;
}) {
  const updateColor = (color: string, value: string) => {
    setThemeConfig({
      ...themeConfig,
      colors: { ...themeConfig.colors, [color]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Site Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Site Name</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Tejas Singhal"
              className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Owner Name</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Tejas Singhal"
              className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Owner Initials (for logo)</label>
            <input
              type="text"
              value={ownerInitials}
              onChange={(e) => setOwnerInitials(e.target.value.toUpperCase())}
              placeholder="TS"
              maxLength={3}
              className="w-32 px-4 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)]"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-[var(--bg)]">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Theme Colors</h3>
        <p className="text-sm text-[var(--muted)] mb-4">Customize the accent colors used throughout the site.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(themeConfig.colors).map(([color, value]) => {
            // Calculate contrasting text color
            const getContrastColor = (hex: string) => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              return luminance > 0.5 ? '#000000' : '#FFFFFF';
            };
            const textColor = getContrastColor(value);
            
            return (
              <div key={color}>
                <label className="block text-sm font-medium text-[var(--text)] mb-2 capitalize">{color}</label>
                <label
                  className="relative rounded-lg p-4 flex items-center justify-center font-mono text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: value, color: textColor }}
                >
                  {value.toUpperCase()}
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => updateColor(color, e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
