# Design Document: Tejas Portfolio v3

## Overview

Tejas Portfolio v3 is a Next.js 14+ application with App Router, featuring an anti-template design with left-rail navigation, interactive developer features (terminal, command palette, workbench), and a Supabase-powered CMS backend. The architecture prioritizes performance (LCP < 2.2s), accessibility (AAA/AA contrast), and zero-code content management.

The system consists of three main layers:
1. **Public Frontend**: Server-rendered Next.js pages fetching published content from Supabase
2. **Interactive Layer**: Client-side features (terminal, workbench, command palette, games)
3. **Admin Backend**: Protected routes with Supabase Auth for content management

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS APP ROUTER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  PUBLIC ROUTES                    │  ADMIN ROUTES (/admin/*)                │
│  ─────────────────                │  ────────────────────────               │
│  / (Home)                         │  /admin/dashboard                       │
│  /about                           │  /admin/home                            │
│  /projects                        │  /admin/about                           │
│  /projects/[slug]                 │  /admin/projects                        │
│  /blog                            │  /admin/blog                            │
│  /blog/[slug]                     │  /admin/assets                          │
│  /resume                          │  /admin/settings                        │
│  /contact                         │                                         │
│  /play (easter egg)               │  Protected by Supabase Auth             │
│  /preview/[type]/[slug] (token)   │                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                           INTERACTIVE LAYER (Client)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Terminal   │  │   Command    │  │  Workbench   │  │  Phone Mock  │     │
│  │   (~  key)   │  │   Palette    │  │  (Desktop)   │  │  (Swipeable) │     │
│  │              │  │   (⌘K)       │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────────────────────┤
│                              SUPABASE BACKEND                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Database   │  │   Auth       │  │   Storage    │  │   Realtime   │     │
│  │   (Postgres) │  │   (JWT)      │  │   (Buckets)  │  │   (Optional) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: Next.js 14+ (App Router, Server Components, Server Actions)
- **Styling**: Tailwind CSS 4 with CSS custom properties for design tokens
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (email/password, magic link)
- **Storage**: Supabase Storage (raw uploads) + Next.js Image optimization with caching OR Edge Function for variant generation
- **Markdown**: `react-markdown` + `remark-gfm` for rendering (no MDX - simpler, safer)
- **Rich Components**: Custom renderers for Callout, CodeBlock, Image via markdown syntax
- **Syntax Highlighting**: Shiki (server-side)
- **Animations**: Framer Motion (with reduced-motion support)
- **3D**: Three.js (lazy-loaded, optional ink ribbon)
- **Testing**: Vitest + React Testing Library + fast-check (property-based)

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Visitor   │────▶│  Next.js    │────▶│  Supabase   │
│   Browser   │◀────│  Server     │◀────│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Cache     │
                    │  (60s TTL)  │
                    └─────────────┘

Admin Flow:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Admin     │────▶│  Supabase   │────▶│  Database   │
│   Browser   │◀────│  Auth + API │◀────│  + Storage  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Revalidate  │
                    │  (on save)  │
                    └─────────────┘
```

### Cache Invalidation Strategy

Content updates propagate to the live site within 60 seconds using this approach:

1. **Route Cache TTL**: Next.js route segments use `revalidate: 60` for ISR (Incremental Static Regeneration)
2. **Manual Revalidation on Publish**: When admin publishes/unpublishes content, the server action calls `revalidatePath()` for affected routes
3. **No External Webhook Needed**: Revalidation happens within the same Next.js app via server actions

```typescript
// Example: Publishing a project triggers revalidation
async function publishProject(id: string) {
  // Update in Supabase
  await supabase.from('projects').update({ status: 'published', published_at: new Date() }).eq('id', id);
  
  // Revalidate affected routes
  revalidatePath('/projects');
  revalidatePath(`/projects/${slug}`);
  revalidatePath('/'); // Home page shows recent projects
}
```

### Contact Form Handling

Contact form submissions are:
1. **Stored in Supabase**: `contact_messages` table for admin review
2. **Optionally emailed**: Via Resend/SendGrid if configured in site_settings
3. **Rate limited**: Max 3 submissions per IP per hour (checked via hashed IP)

```typescript
// Contact form server action
async function submitContactForm(data: ContactFormData, ipHash: string) {
  // Check rate limit (3 per hour per IP)
  const recentCount = await supabase
    .from('contact_messages')
    .select('id', { count: 'exact' })
    .eq('ip_hash', ipHash)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());
  
  if (recentCount.count >= 3) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Store message
  await supabase.from('contact_messages').insert({
    name: data.name,
    email: data.email,
    message: data.message,
    ip_hash: ipHash,
  });
  
  // Optional: Send email notification
  if (siteSettings.email_notifications_enabled) {
    await sendEmail({ to: siteSettings.contact_email, ... });
  }
}
```

### Content Revisions (Undo/Restore)

Every content update creates a revision snapshot for undo functionality:

```typescript
// Save revision before updating content
async function updateContentWithRevision(
  type: 'project' | 'blog_post' | 'page',
  id: string,
  newData: Record<string, unknown>,
  userId: string
) {
  // Get current data for revision
  const { data: current } = await supabase.from(type + 's').select('*').eq('id', id).single();
  
  // Get next revision number
  const { count } = await supabase
    .from('content_revisions')
    .select('*', { count: 'exact' })
    .eq('content_type', type)
    .eq('content_id', id);
  
  // Save revision
  await supabase.from('content_revisions').insert({
    content_type: type,
    content_id: id,
    revision_number: (count || 0) + 1,
    data: current,
    created_by: userId,
  });
  
  // Update content
  await supabase.from(type + 's').update(newData).eq('id', id);
}

// Restore from revision
async function restoreRevision(revisionId: string) {
  const { data: revision } = await supabase
    .from('content_revisions')
    .select('*')
    .eq('id', revisionId)
    .single();
  
  await supabase
    .from(revision.content_type + 's')
    .update(revision.data)
    .eq('id', revision.content_id);
}
```

### Draft Preview with Tokens

Drafts can be previewed via time-limited tokens:

```typescript
// Generate preview token (valid for 1 hour)
async function generatePreviewToken(
  type: 'project' | 'blog_post' | 'page',
  id: string,
  userId: string
): Promise<string> {
  const token = crypto.randomUUID();
  
  await supabase.from('preview_tokens').insert({
    token,
    content_type: type,
    content_id: id,
    expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    created_by: userId,
  });
  
  return token;
}

// Preview route: /preview/[type]/[slug]?token=xxx
// Server component validates token and renders draft content
async function PreviewPage({ params, searchParams }) {
  const { token } = searchParams;
  
  // Validate token
  const { data: tokenData } = await supabase
    .from('preview_tokens')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (!tokenData) {
    return <div>Invalid or expired preview link</div>;
  }
  
  // Fetch draft content (bypasses RLS via service role)
  const { data: content } = await supabaseAdmin
    .from(tokenData.content_type + 's')
    .select('*')
    .eq('id', tokenData.content_id)
    .single();
  
  return <ContentPreview content={content} type={tokenData.content_type} />;
}
```

## Components and Interfaces

### Layout Components

```typescript
// Left Rail Navigation
interface LeftRailProps {
  currentPath: string;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  shortcut?: string;
}

// The Left Rail renders on desktop (≥1024px) as a fixed 92px sidebar
// On mobile (<1024px), it transforms to a bottom navigation bar
```

```typescript
// Blueprint Background
interface BlueprintBackgroundProps {
  showScanLine?: boolean; // Disabled when prefers-reduced-motion
}
```

### Interactive Components

```typescript
// Command Palette
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  type: 'route' | 'project' | 'blog' | 'action';
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
}
```

```typescript
// Terminal
interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TerminalCommand {
  name: string;
  description: string;
  execute: (args: string[]) => TerminalOutput;
}

interface TerminalOutput {
  type: 'text' | 'error' | 'success' | 'ascii';
  content: string;
}

// Command history stored in sessionStorage (last 5 commands)
```

```typescript
// Workbench (Simulated Desktop)
interface WorkbenchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WorkbenchWindow {
  id: string;
  type: 'ide' | 'terminal' | 'notes' | 'browser';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  zIndex: number;
}

// Window state persisted in localStorage
```

```typescript
// Phone Mock
interface PhoneMockProps {
  isOpen: boolean;
  onClose: () => void;
  initialApp?: 'projects' | 'blog' | 'resume' | 'contact';
}

interface PhoneApp {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

// Accessibility: Phone Mock supports multiple navigation methods:
// - Touch: Swipe left/right between apps
// - Keyboard: Arrow keys (←/→) to switch apps, Tab to navigate within
// - Mouse: Click visible tab buttons at bottom of phone
// All navigation methods are equivalent and fully accessible.
```

### Content Components

```typescript
// Project Card
interface ProjectCardProps {
  project: Project;
  showDevNotes?: boolean; // Toggled by terminal 'reveal' command
}

// Blog Post Card
interface BlogPostCardProps {
  post: BlogPost;
}

// Stats Card
interface StatsCardProps {
  githubStars?: number;
  lastCommit?: Date;
  nowPlaying?: SpotifyTrack | null;
}
```

### Admin Components

```typescript
// Markdown Editor
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  autoSave?: boolean; // Default: true, saves every 5-10 seconds
}

// Image Uploader
interface ImageUploaderProps {
  bucket: 'public-images' | 'resume';
  onUpload: (url: string, metadata: ImageMetadata) => void;
  maxSize?: number; // Default: 5MB
}

interface ImageMetadata {
  width: number;
  height: number;
  variants: {
    original: string;
    web: string;    // 1200px
    thumb: string;  // 600px
    og: string;     // 1200x630
  };
}
```

## Data Models

### Supabase Database Schema

```sql
-- Site Settings (singleton - enforced via fixed id)
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  hero_headline TEXT NOT NULL DEFAULT 'Tejas builds curious systems.',
  hero_subhead TEXT NOT NULL,
  primary_cta_text TEXT NOT NULL DEFAULT 'Open Workbench',
  secondary_cta_text TEXT NOT NULL DEFAULT 'View Projects',
  now_panel_items JSONB DEFAULT '[]',
  social_links JSONB DEFAULT '{}',
  seo_defaults JSONB DEFAULT '{}',
  feature_toggles JSONB DEFAULT '{
    "terminal": true,
    "workbench": true,
    "phone_mock": true,
    "games": true,
    "3d_ribbon": true
  }',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Enforce singleton: only one row allowed
  CONSTRAINT site_settings_singleton CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  one_liner TEXT NOT NULL,
  problem TEXT,
  approach TEXT,
  impact TEXT,
  stack TEXT[] DEFAULT '{}',
  links JSONB DEFAULT '{}',
  build_notes TEXT,
  build_diagram_url TEXT,
  tradeoffs TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  cover_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  body_md TEXT NOT NULL, -- Markdown content (primary)
  tags TEXT[] DEFAULT '{}',
  cover_url TEXT,
  reading_time_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: MDX support removed for simplicity. Rich components (Callout, CodeBlock, Image)
-- are handled via custom react-markdown renderers with whitelisted component syntax.

-- Pages (Home, About content blocks)
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE, -- 'home', 'about'
  body_md TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redirects (for slug changes)
CREATE TABLE redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'publish', 'unpublish'
  table_name TEXT NOT NULL,
  row_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Messages (stores form submissions)
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_hash TEXT, -- Hashed IP for rate limiting (not stored raw for privacy)
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Revisions (for undo/restore functionality)
CREATE TABLE content_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'project', 'blog_post', 'page'
  content_id UUID NOT NULL,
  revision_number INTEGER NOT NULL,
  data JSONB NOT NULL, -- Full snapshot of the content at this revision
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_type, content_id, revision_number)
);

-- Preview Tokens (for draft preview access)
CREATE TABLE preview_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL, -- 'project', 'blog_post', 'page'
  content_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets (tracks uploaded files and variants)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_url TEXT NOT NULL,
  bucket TEXT NOT NULL, -- 'public-images', 'resume', 'private-admin'
  mime_type TEXT NOT NULL,
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  variants JSONB DEFAULT '{}', -- { "web": "url", "thumb": "url", "og": "url" }
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (extends Supabase auth.users)
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript Types

```typescript
// Database types (generated from Supabase)
interface Project {
  id: string;
  title: string;
  slug: string;
  one_liner: string;
  problem: string | null;
  approach: string | null;
  impact: string | null;
  stack: string[];
  links: {
    github?: string;
    demo?: string;
    video?: string;
  };
  build_notes: string | null;
  build_diagram_url: string | null;
  tradeoffs: string[];
  improvements: string[];
  cover_url: string | null;
  is_featured: boolean;
  sort_order: number;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body_md: string;
  tags: string[];
  cover_url: string | null;
  reading_time_minutes: number | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  ip_hash: string | null;
  is_read: boolean;
  created_at: string;
}

interface ContentRevision {
  id: string;
  content_type: 'project' | 'blog_post' | 'page';
  content_id: string;
  revision_number: number;
  data: Record<string, unknown>; // Full content snapshot
  created_by: string | null;
  created_at: string;
}

interface PreviewToken {
  id: string;
  token: string;
  content_type: 'project' | 'blog_post' | 'page';
  content_id: string;
  expires_at: string;
  created_by: string | null;
  created_at: string;
}

interface SiteSettings {
  id: string;
  hero_headline: string;
  hero_subhead: string;
  primary_cta_text: string;
  secondary_cta_text: string;
  now_panel_items: string[];
  social_links: {
    github?: string;
    linkedin?: string;
    email?: string;
    calendly?: string;
  };
  seo_defaults: {
    title?: string;
    description?: string;
    og_image?: string;
  };
  feature_toggles: {
    terminal: boolean;
    workbench: boolean;
    phone_mock: boolean;
    games: boolean;
    '3d_ribbon': boolean;
  };
  updated_at: string;
}

interface Redirect {
  id: string;
  from_path: string;
  to_path: string;
  created_at: string;
}
```

### Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC READ POLICIES (anonymous users)
-- ============================================

-- Public can read published projects only
CREATE POLICY "Public can read published projects"
  ON projects FOR SELECT
  TO anon
  USING (status = 'published');

-- Public can read published blog posts only
CREATE POLICY "Public can read published blog posts"
  ON blog_posts FOR SELECT
  TO anon
  USING (status = 'published');

-- Public can read site settings (singleton, always public)
CREATE POLICY "Public can read site settings"
  ON site_settings FOR SELECT
  TO anon
  USING (true);

-- Public can read published pages only
CREATE POLICY "Public can read published pages"
  ON pages FOR SELECT
  TO anon
  USING (status = 'published');

-- Public can read redirects (needed for redirect resolution)
CREATE POLICY "Public can read redirects"
  ON redirects FOR SELECT
  TO anon
  USING (true);

-- Public can read public assets
CREATE POLICY "Public can read assets"
  ON assets FOR SELECT
  TO anon
  USING (bucket = 'public-images' OR bucket = 'resume');

-- ============================================
-- AUTHENTICATED USER POLICIES (editors/admins)
-- ============================================

-- Editors/Admins can read ALL projects (including drafts)
CREATE POLICY "Authenticated can read all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Editors/Admins can insert projects
CREATE POLICY "Authenticated can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Editors/Admins can update projects
CREATE POLICY "Authenticated can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Editors/Admins can delete projects
CREATE POLICY "Authenticated can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Same pattern for blog_posts
CREATE POLICY "Authenticated can read all blog posts"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated can insert blog posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated can update blog posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated can delete blog posts"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Same pattern for pages
CREATE POLICY "Authenticated can read all pages"
  ON pages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated can insert pages"
  ON pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated can update pages"
  ON pages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Editors/Admins can manage redirects
CREATE POLICY "Authenticated can manage redirects"
  ON redirects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Editors/Admins can manage assets
CREATE POLICY "Authenticated can manage assets"
  ON assets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- ============================================
-- ADMIN-ONLY POLICIES
-- ============================================

-- Only admins can modify site settings
CREATE POLICY "Admins can modify site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- AUDIT LOG (service role only for writes)
-- ============================================

-- Admins can read audit log
CREATE POLICY "Admins can read audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- No INSERT/UPDATE/DELETE policies for audit_log from client
-- Audit log writes happen via service role in server actions/Edge Functions
-- This ensures audit log integrity (clients cannot tamper with logs)

-- ============================================
-- USER ROLES (admin-only management)
-- ============================================

CREATE POLICY "Admins can read user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- CONTENT REVISIONS (editors/admins can manage)
-- ============================================

CREATE POLICY "Authenticated can read revisions"
  ON content_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated can create revisions"
  ON content_revisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- ============================================
-- PREVIEW TOKENS (editors/admins can manage)
-- ============================================

CREATE POLICY "Authenticated can manage preview tokens"
  ON preview_tokens FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Public can validate tokens (for preview route)
CREATE POLICY "Public can validate preview tokens"
  ON preview_tokens FOR SELECT
  TO anon
  USING (expires_at > NOW());

-- ============================================
-- CONTACT MESSAGES (admins can read)
-- ============================================

CREATE POLICY "Admins can read contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Contact form submissions via service role (no client insert policy)
```

### Storage Buckets and Image Optimization

```typescript
// Supabase Storage configuration
const storageBuckets = {
  'public-images': {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  'resume': {
    public: true,
    allowedMimeTypes: ['application/pdf'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  'private-admin': {
    public: false,
    allowedMimeTypes: ['image/*', 'application/pdf'],
    maxFileSize: 10 * 1024 * 1024,
  },
};

// Image optimization strategy:
// Option A: Next.js Image component with on-demand optimization
//   - Use next/image with Supabase URLs
//   - Next.js generates optimized versions on first request
//   - Cached at edge, no pre-generation needed
//   - Simpler, but less control over exact sizes
//
// Option B: Edge Function variant generation
//   - Supabase Edge Function triggered on upload
//   - Uses Sharp to generate web (1200px), thumb (600px), og (1200x630)
//   - Stores variants in same bucket with suffix
//   - More control, but requires Edge Function setup

// Recommended: Option A for simplicity, with assets table for metadata
interface Asset {
  id: string;
  filename: string;
  original_url: string;
  bucket: string;
  mime_type: string;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  variants: {
    web?: string;   // Generated on-demand or via Edge Function
    thumb?: string;
    og?: string;
  };
  alt_text: string | null;
  created_at: string;
  updated_at: string;
}

// Projects and blog posts reference assets by URL or asset_id
// cover_url can be the original Supabase URL; Next.js Image handles optimization
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Responsive Navigation Layout

*For any* viewport width, the navigation component should render as a left rail (92px fixed) when width ≥ 1024px, and as a bottom bar when width < 1024px.

**Validates: Requirements 1.1, 1.2**

### Property 2: Reduced Motion Compliance

*For any* animation or motion effect in the application, when `prefers-reduced-motion: reduce` is active, the animation should be disabled or replaced with an instant transition.

**Validates: Requirements 1.8, 15.6**

### Property 3: Design Token Consistency

*For any* design token (color, font, spacing) used in the application, it should reference a CSS custom property defined in the global stylesheet with the correct value.

**Validates: Requirements 2.1-2.11**

### Property 4: Command Palette Search

*For any* search query entered in the command palette, the results should include all routes, projects, and blog posts whose title, slug, or keywords contain the query string (case-insensitive).

**Validates: Requirements 5.2**

### Property 5: Command Palette Navigation

*For any* search result selected in the command palette, the application should navigate to the corresponding route without errors.

**Validates: Requirements 5.4**

### Property 6: Command Palette Keyboard Behavior

*For any* keyboard interaction with the command palette (Escape, arrow keys, Enter), the expected behavior should occur: Escape closes, arrows navigate, Enter selects.

**Validates: Requirements 5.5, 5.6, 5.7**

### Property 7: Terminal Toggle

*For any* state of the terminal (open or closed), pressing the tilde (~) key should toggle it to the opposite state.

**Validates: Requirements 6.1**

### Property 8: Terminal Command Execution

*For any* valid terminal command (help, whoami, ls, open, blog, theme, ascii, reveal, snake, pong), executing it should return a non-error output matching the expected behavior.

**Validates: Requirements 6.3-6.11**

### Property 9: Terminal Command History

*For any* sequence of N commands executed in the terminal (where N > 5), the command history should contain exactly the last 5 commands in order.

**Validates: Requirements 6.13**

### Property 10: Terminal Focus Management

*For any* state where the terminal is open, focus should be trapped within the terminal, and pressing Escape should close it and return focus to the previous element.

**Validates: Requirements 6.14, 6.15**

### Property 11: Workbench Window State Persistence (Round-Trip)

*For any* workbench window configuration (positions, sizes, minimized states), saving to localStorage and then loading should produce an equivalent configuration.

**Validates: Requirements 7.6**

### Property 12: Project Data Completeness

*For any* published project, it should have all required fields populated: title, slug, one_liner, and at least one of (problem, approach, impact).

**Validates: Requirements 10.1, 10.2**

### Property 13: Blog Post Rendering

*For any* published blog post with code blocks, the rendered output should include syntax-highlighted code with a copy button.

**Validates: Requirements 11.3, 11.4**

### Property 14: Contact Form Validation

*For any* contact form submission, if any required field (name, email, message) is empty or email format is invalid, the submission should be rejected with appropriate error messages.

**Validates: Requirements 13.1**

### Property 15: Admin Route Protection

*For any* request to an admin route (/admin/*) without valid authentication, the request should be redirected to the login page or return a 401/403 status.

**Validates: Requirements 16.1, 16.2**

### Property 16: RLS Public Content Filtering

*For any* anonymous database query to projects or blog_posts tables, only rows with status='published' should be returned.

**Validates: Requirements 22.1, 22.2, 22.3**

### Property 17: Slug Redirect Creation

*For any* content item (project or blog post) whose slug is changed, a redirect entry should be automatically created from the old slug to the new slug.

**Validates: Requirements 19.8**

### Property 18: Image Asset Tracking

*For any* image uploaded to the public-images bucket, an entry should be created in the assets table with the original URL, and the image should be servable via Next.js Image optimization.

**Validates: Requirements 20.2**

### Property 19: Theme Persistence (Round-Trip)

*For any* theme selection (dark, cyber, dracula, solarized), saving to localStorage and then loading should apply the same theme.

**Validates: Requirements 25.3, 25.4**

### Property 20: Route Resolution

*For any* defined route in the routing structure, navigating to that path should render the correct page component without 404.

**Validates: Requirements 24.1-24.9**

### Property 21: Redirect Resolution

*For any* redirect entry in the database, navigating to the from_path should redirect to the to_path.

**Validates: Requirements 24.10**

## Error Handling

### Games Audio Policy

Arcade games (Snake, Pong) follow these audio rules:
- **Sound OFF by default**: Respects user preference and avoids unexpected audio
- **Opt-in toggle**: Visible sound button to enable audio
- **Respects `prefers-reduced-motion`**: When enabled, disables sound effects
- **No autoplay**: Audio only plays after user interaction

### Client-Side Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| Network failure | Show toast notification, retry with exponential backoff (max 3 attempts) |
| Supabase query error | Log to console, show user-friendly error message |
| Invalid route | Render 404 page with playable mini-game |
| Terminal command not found | Display "command not found: {cmd}. Type 'help' for available commands." |
| Image load failure | Show placeholder with retry button |
| localStorage unavailable | Fall back to in-memory state, warn user |

### Server-Side Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| Database connection failure | Return 503 with retry-after header |
| RLS policy violation | Return 403 Forbidden |
| Invalid authentication | Redirect to login or return 401 |
| Rate limit exceeded | Return 429 with retry-after header |
| Image processing failure | Log error, return original image |

### Admin Panel Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| Autosave failure | Show warning indicator, queue for retry |
| Slug conflict | Show validation error, suggest alternative |
| Upload failure | Show error toast, allow retry |
| Session expiry | Redirect to login, preserve draft in localStorage |

### Input Validation

```typescript
// Contact form validation
const contactFormSchema = {
  name: { required: true, minLength: 2, maxLength: 100 },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  message: { required: true, minLength: 10, maxLength: 5000 },
};

// Slug validation
const slugSchema = {
  pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  minLength: 3,
  maxLength: 100,
};

// Markdown sanitization (prevent XSS)
// Use DOMPurify or similar for HTML output
```

## Testing Strategy

### Dual Testing Approach

This project uses both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all valid inputs

### Testing Framework

- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **Property-Based Testing**: fast-check
- **E2E Testing**: Playwright (optional, for critical flows)

### Property-Based Test Configuration

Each property test must:
1. Run minimum 100 iterations
2. Reference the design document property number
3. Use the tag format: `Feature: tejas-portfolio-v3, Property {number}: {property_text}`

```typescript
// Example property test structure
import { fc } from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Feature: tejas-portfolio-v3', () => {
  // Property 4: Command Palette Search
  it('Property 4: For any search query, results include matching content', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (query) => {
          const results = searchContent(query, mockContent);
          // All results should contain the query (case-insensitive)
          return results.every(r => 
            r.title.toLowerCase().includes(query.toLowerCase()) ||
            r.slug.toLowerCase().includes(query.toLowerCase())
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 9: Terminal Command History
  it('Property 9: Command history contains last 5 commands', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('help', 'whoami', 'ls', 'ascii tejas'), { minLength: 6, maxLength: 20 }),
        (commands) => {
          const terminal = new TerminalState();
          commands.forEach(cmd => terminal.execute(cmd));
          const history = terminal.getHistory();
          return history.length === 5 && 
                 history.every((cmd, i) => cmd === commands[commands.length - 5 + i]);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 11: Workbench State Round-Trip
  it('Property 11: Window state persists correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          position: fc.record({ x: fc.integer(), y: fc.integer() }),
          size: fc.record({ width: fc.nat(), height: fc.nat() }),
          isMinimized: fc.boolean(),
        }),
        (windowState) => {
          saveWindowState(windowState);
          const loaded = loadWindowState(windowState.id);
          return deepEqual(windowState, loaded);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Coverage

| Component | Test Focus |
|-----------|------------|
| LeftRail | Renders correct items, active state, tooltips |
| CommandPalette | Opens/closes, keyboard navigation, action execution |
| Terminal | Command parsing, output formatting, history |
| Workbench | Window drag/snap, minimize, state persistence |
| PhoneMock | Swipe navigation, long-press, story export |
| ProjectCard | Renders all fields, flip animation, dev notes overlay |
| BlogPost | Markdown rendering, code highlighting, copy button |
| ContactForm | Validation, honeypot, submission |
| AdminEditor | Autosave, preview, slug generation |

### Integration Tests

| Flow | Test Scenario |
|------|---------------|
| Content Publishing | Create draft → Edit → Publish → Verify public visibility |
| Slug Change | Change slug → Verify redirect created → Old URL redirects |
| Image Upload | Upload → Verify variants generated → Display on page |
| Auth Flow | Login → Access admin → Logout → Verify access denied |

### Accessibility Testing

- Automated: axe-core integration in Vitest
- Manual: Keyboard navigation, screen reader testing
- Contrast: Verify AAA for body text, AA for interactive elements

### Performance Testing

- Lighthouse CI for LCP, bundle size monitoring
- Bundle analyzer for JS size tracking
- Image optimization verification
