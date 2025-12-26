# Requirements Document

## Introduction

Tejas Singhal's Portfolio v3 is a premium, developer-focused portfolio website that breaks away from template conventions. It features an asymmetric left-rail layout, interactive terminal, command palette, dev workbench, and a Supabase-powered admin panel for zero-code content management. The site targets two audiences: normal visitors who see a clean, professional portfolio, and developers who discover hidden interactive features like a terminal, arcade games, and a simulated desktop environment.

## Glossary

- **Portfolio_Site**: The Next.js web application serving the portfolio
- **Left_Rail**: Fixed 92px vertical navigation on desktop, converts to bottom bar on mobile
- **Command_Palette**: Searchable modal (⌘K) for quick navigation and actions
- **Terminal**: Interactive CLI overlay (~ key) with custom commands
- **Workbench**: Simulated desktop environment with draggable windows
- **Phone_Mock**: Floating interactive phone UI for browsing content
- **Admin_Panel**: Protected Supabase-authenticated interface for content management
- **Content_API**: Supabase database layer serving published content
- **RLS**: Row Level Security policies in Supabase
- **MDX**: Markdown with JSX support for blog posts

## Requirements

### Requirement 1: Anti-Template Layout System

**User Story:** As a visitor, I want to see a unique asymmetric layout with left-rail navigation, so that the portfolio stands out from generic templates.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL render a fixed 92px left rail navigation on desktop viewports (≥1024px)
2. WHEN the viewport width is less than 1024px, THE Left_Rail SHALL transform into a bottom navigation bar
3. THE Portfolio_Site SHALL NOT render a centered hero with circular avatar
4. THE Portfolio_Site SHALL NOT render a horizontal top navbar with evenly spaced links
5. THE Portfolio_Site SHALL NOT render three CTA buttons in a row below the hero
6. THE Portfolio_Site SHALL NOT use uniform 3-card grid with glass blur as primary layout
7. THE Portfolio_Site SHALL apply the blueprint grid background motif with subtle scan line animation
8. WHILE the user has `prefers-reduced-motion` enabled, THE Portfolio_Site SHALL disable scan line and 3D animations

### Requirement 2: Design Token System

**User Story:** As a developer, I want consistent design tokens applied throughout the site, so that the visual identity remains cohesive.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL use `#0A0D11` as the primary background color (`--bg`)
2. THE Portfolio_Site SHALL use `#0E1319` as the surface color (`--surface`)
3. THE Portfolio_Site SHALL use `#E8EDF2` as the primary text color (`--text`)
4. THE Portfolio_Site SHALL use `#A1ACB7` as the muted text color (`--muted`)
5. THE Portfolio_Site SHALL use `#5B9CFF` as the blue accent (`--blue`)
6. THE Portfolio_Site SHALL use `#A78BFA` as the violet accent (`--violet`)
7. THE Portfolio_Site SHALL use `#28F07B` as the green accent (`--green`) sparingly for positive deltas
8. THE Portfolio_Site SHALL use Fraunces (fallback: Playfair Display) for headings
9. THE Portfolio_Site SHALL use Inter for body text
10. THE Portfolio_Site SHALL use JetBrains Mono for terminal and statistics
11. THE Portfolio_Site SHALL self-host fonts with `font-display: swap`

### Requirement 3: Left Rail Navigation

**User Story:** As a visitor, I want intuitive navigation via the left rail, so that I can quickly access all sections of the portfolio.

#### Acceptance Criteria

1. THE Left_Rail SHALL display a TS monogram at the top
2. THE Left_Rail SHALL display navigation icons for Home, Projects, Blog, Resume, and Contact
3. THE Left_Rail SHALL display utility icons for command palette (⌘K), terminal toggle, theme toggle, and settings
4. WHEN a user hovers or focuses on a navigation icon, THE Left_Rail SHALL display a tooltip with the section name
5. WHEN a navigation item is active, THE Left_Rail SHALL highlight it with a pill shape and subtle glow
6. WHEN on mobile viewport, THE Left_Rail SHALL render as a bottom bar with 5 icons and floating terminal action
7. THE Left_Rail SHALL be fully keyboard navigable with visible focus indicators

### Requirement 4: Home Page Layout

**User Story:** As a visitor, I want to see an asymmetric home page with Tejas's headline, stats, and recent work, so that I immediately understand who he is and what he builds.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL render the H1 "Tejas builds curious systems." with tight tracking (-0.005em) and line-height 0.95
2. THE Portfolio_Site SHALL apply a violet-to-blue gradient only to the middle line of the headline
3. THE Portfolio_Site SHALL render a subhead limited to 2 lines and 60ch width
4. THE Portfolio_Site SHALL render a primary CTA button labeled "Open Workbench"
5. THE Portfolio_Site SHALL render a secondary ghost button labeled "View Projects"
6. THE Portfolio_Site SHALL render a Live Stats card showing GitHub stars, last commit time
7. THE Portfolio_Site SHALL render a Recent Activity card showing recent pushes, blog posts, deployments
8. THE Portfolio_Site SHALL animate stat numbers with count-up effect using JetBrains Mono
9. THE Portfolio_Site SHALL render a "Recent Work" section with asymmetric card layout (2 wide + 1 tall)
10. THE Portfolio_Site SHALL render a "Now" panel showing current month's building focus
11. THE Portfolio_Site SHALL render a "Signals" row with HackPSU, Schreyer Honors, Devs@PSU badges
12. THE Portfolio_Site SHALL display hints "Press ⌘K to search" and "Press ~ for terminal" below the hero

### Requirement 5: Command Palette

**User Story:** As a power user, I want a command palette accessible via ⌘K, so that I can quickly navigate and perform actions.

#### Acceptance Criteria

1. WHEN a user presses ⌘K (Mac) or Ctrl+K (Windows/Linux), THE Command_Palette SHALL open
2. THE Command_Palette SHALL search across routes, projects, and blog posts
3. THE Command_Palette SHALL provide actions: copy email, download resume, toggle theme, open terminal, open random project
4. WHEN a user selects a search result, THE Command_Palette SHALL navigate to that route
5. WHEN a user presses Escape, THE Command_Palette SHALL close
6. THE Command_Palette SHALL trap focus while open
7. THE Command_Palette SHALL be fully keyboard navigable with arrow keys and Enter to select

### Requirement 6: Interactive Terminal

**User Story:** As a developer visitor, I want an interactive terminal, so that I can explore the portfolio in a unique CLI-style interface.

#### Acceptance Criteria

1. WHEN a user presses the tilde (~) key, THE Terminal SHALL toggle open/closed
2. THE Terminal SHALL display the prompt `tejas@portfolio:~$`
3. THE Terminal SHALL execute the `help` command showing all available commands
4. THE Terminal SHALL execute the `whoami` command showing a short bio
5. THE Terminal SHALL execute `ls` and `ls projects` commands listing content
6. THE Terminal SHALL execute `open <project-slug>` navigating to that project
7. THE Terminal SHALL execute `blog <query>` searching and opening blog posts
8. THE Terminal SHALL execute `theme <dark|cyber|dracula|solarized>` changing the theme
9. THE Terminal SHALL execute `ascii tejas` displaying an ASCII logo
10. THE Terminal SHALL execute `reveal` toggling dev-notes overlay on project cards
11. THE Terminal SHALL execute `snake` and `pong` launching games or routing to `/play`
12. WHEN a user types `sudo`, THE Terminal SHALL return "permission denied 🔒 (nice try)"
13. THE Terminal SHALL remember the last 5 commands per session
14. THE Terminal SHALL trap focus while open and close on Escape
15. THE Terminal SHALL be fully keyboard accessible

### Requirement 7: Dev Workbench

**User Story:** As a developer visitor, I want a simulated desktop environment, so that I can experience an interactive OS-like interface.

#### Acceptance Criteria

1. WHEN a user clicks "Open Workbench", THE Workbench SHALL open as a faux OS layer
2. THE Workbench SHALL render windows for IDE, Terminal, Notes, and Browser
3. THE Workbench SHALL allow windows to be dragged to new positions
4. THE Workbench SHALL allow windows to snap to edges and other windows
5. THE Workbench SHALL allow windows to be minimized
6. THE Workbench SHALL persist window positions and state in localStorage
7. WHEN a user clicks "Run demo" in the IDE window, THE Workbench SHALL deep-link to a real project page
8. THE Workbench SHALL apply wallpaper theme matching the selected site theme
9. THE Workbench SHALL be keyboard accessible with focus management

### Requirement 8: Interactive Phone Mock

**User Story:** As a visitor, I want an interactive phone mockup, so that I can browse content in a mobile-style interface.

#### Acceptance Criteria

1. THE Phone_Mock SHALL be toggleable from Home or Workbench
2. THE Phone_Mock SHALL allow navigation between apps (Projects, Blog, Resume, Contact) via swipe, arrow keys, or visible tab buttons
3. WHEN a user long-presses a project card in Phone_Mock, THE Phone_Mock SHALL show stack chips and key tradeoff
4. WHEN a user triggers "Share to Story", THE Phone_Mock SHALL render a 1080×1920 PNG with cover and title
5. THE Phone_Mock SHALL be fully keyboard accessible with arrow key navigation and Tab for internal focus

### Requirement 9: Easter Egg Arcade

**User Story:** As a curious developer, I want hidden games and easter eggs, so that I can discover fun surprises.

#### Acceptance Criteria

1. WHEN a user enters the Konami code (↑↑↓↓←→←→BA Enter), THE Portfolio_Site SHALL navigate to `/play`
2. THE Portfolio_Site SHALL render Snake and Pong games at `/play` with sound toggle (sound OFF by default)
3. THE Portfolio_Site SHALL render a playable mini-game on the 404 page
4. THE 404 mini-game SHALL use the missing route hash as a score seed
5. WHILE `prefers-reduced-motion` is enabled, THE Portfolio_Site SHALL disable game sound effects

### Requirement 10: Projects Content and Presentation

**User Story:** As a visitor, I want to see Tejas's projects with detailed build notes, so that I understand his technical depth.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL display 4-6 projects maximum
2. FOR EACH project, THE Portfolio_Site SHALL display title, one-liner, problem, approach, impact, stack chips, and links
3. FOR EACH project, THE Portfolio_Site SHALL display Build Notes with diagram and 3 tradeoffs
4. FOR EACH project, THE Portfolio_Site SHALL display "What I'd improve next" bullets
5. THE Portfolio_Site SHALL feature pinned projects: Raspberry Pi Admin System, Zoodu, VulnScanX, Autonomous Relief Drone
6. WHEN a user hovers or clicks a project card, THE Portfolio_Site SHALL flip/expand to show stack and links
7. WHEN the `reveal` terminal command is active, THE Portfolio_Site SHALL overlay dev notes on project cards

### Requirement 11: Blog System

**User Story:** As a visitor, I want to read Tejas's blog posts with syntax highlighting, so that I can learn from his technical writing.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL render a blog list at `/blog` with tags and reading time
2. THE Portfolio_Site SHALL render individual blog posts at `/blog/[slug]` from Supabase-stored content
3. THE Portfolio_Site SHALL render blog post body from `body_md` (Markdown) stored in Supabase
4. THE Portfolio_Site SHALL apply Shiki syntax highlighting to code blocks with copy button
5. THE Portfolio_Site SHALL support custom components (Callout, CodeBlock, Image) via markdown syntax and custom renderers
6. THE Portfolio_Site SHALL generate an RSS feed at `/rss.xml`
7. THE Portfolio_Site SHALL auto-generate OG images per blog post

### Requirement 12: Resume Page

**User Story:** As a recruiter, I want to view and download Tejas's resume, so that I can evaluate his qualifications.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL embed the resume PDF at `/resume`
2. THE Portfolio_Site SHALL provide a download button for the resume PDF
3. THE Portfolio_Site SHALL render an ATS-friendly HTML section with Education, Skills, Experience, Leadership

### Requirement 13: Contact Page

**User Story:** As a visitor, I want to contact Tejas, so that I can reach out for opportunities or collaboration.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL render a contact form with name, email, and message fields
2. THE Portfolio_Site SHALL implement honeypot field for spam prevention
3. THE Portfolio_Site SHALL implement rate limiting (max 3 submissions per IP per hour)
4. THE Portfolio_Site SHALL store contact form submissions in the `contact_messages` table
5. THE Portfolio_Site SHALL display social links: GitHub, LinkedIn, Email
6. THE Portfolio_Site SHALL display a Calendly placeholder link

### Requirement 14: Performance Requirements

**User Story:** As a visitor, I want the site to load quickly, so that I have a smooth browsing experience.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL achieve Home LCP under 2.2 seconds on mobile Fast 3G
2. THE Portfolio_Site SHALL keep JavaScript bundle under 250KB gzip on Home
3. THE Portfolio_Site SHALL lazy-load 3D ribbon and Workbench layer
4. THE Portfolio_Site SHALL serve images in WebP/AVIF format with srcset
5. THE Portfolio_Site SHALL self-host fonts with `font-display: swap`

### Requirement 15: Accessibility Requirements

**User Story:** As a visitor with accessibility needs, I want the site to be fully accessible, so that I can navigate and consume content.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL achieve AAA contrast ratio for body text
2. THE Portfolio_Site SHALL achieve AA contrast ratio for interactive text
3. THE Portfolio_Site SHALL render visible focus rings on all interactive elements
4. THE Portfolio_Site SHALL support full keyboard navigation
5. THE Portfolio_Site SHALL implement focus traps in Terminal, Workbench, and Command Palette
6. WHILE `prefers-reduced-motion` is enabled, THE Portfolio_Site SHALL disable scan line and 3D animations

### Requirement 16: Admin Panel Authentication

**User Story:** As Tejas, I want a protected admin panel, so that only authorized users can edit content.

#### Acceptance Criteria

1. THE Admin_Panel SHALL be accessible at `/admin` and subroutes
2. THE Admin_Panel SHALL require Supabase authentication to access
3. THE Admin_Panel SHALL support `admin` role with full CRUD, publish/unpublish, and settings access
4. THE Admin_Panel SHALL support `editor` role with CRUD on content but no global settings access
5. THE Admin_Panel SHALL prevent anonymous users from accessing admin UI or draft content
6. THE Admin_Panel SHALL validate inputs and sanitize markdown/HTML to prevent XSS

### Requirement 17: Admin Dashboard

**User Story:** As Tejas, I want an admin dashboard, so that I can see an overview of my content status.

#### Acceptance Criteria

1. THE Admin_Panel SHALL render a dashboard at `/admin/dashboard`
2. THE Admin_Panel SHALL display count of published posts, drafts, and last update time
3. THE Admin_Panel SHALL provide quick action buttons for common tasks

### Requirement 18: Admin Content Management

**User Story:** As Tejas, I want to manage all website content from the admin panel, so that I can update the site without code changes.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide `/admin/home` for editing hero headline, subhead, CTAs, Now panel, and featured projects
2. THE Admin_Panel SHALL provide `/admin/about` for editing About content blocks
3. THE Admin_Panel SHALL provide `/admin/projects` for CRUD operations on projects with reordering and Build Notes
4. THE Admin_Panel SHALL provide `/admin/blog` for CRUD operations on blog posts with editor, tags, cover, and publish controls
5. THE Admin_Panel SHALL provide `/admin/assets` for uploading and managing images, resume PDF, and OG templates
6. THE Admin_Panel SHALL provide `/admin/settings` for theme presets, contact links, SEO defaults, and feature toggles

### Requirement 19: Admin Editing Experience

**User Story:** As Tejas, I want a user-friendly editing experience, so that I can manage content without technical knowledge.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide fields for title, auto-generated slug, summary, and tags
2. THE Admin_Panel SHALL provide a Markdown editor with live preview (MDX optional, requires sandboxing)
3. THE Admin_Panel SHALL support code blocks with language selection
4. THE Admin_Panel SHALL support cover image upload with auto-optimization
5. THE Admin_Panel SHALL autosave drafts every 5-10 seconds with "Saved" indicator
6. THE Admin_Panel SHALL support Draft → Preview → Publish workflow
7. THE Admin_Panel SHALL generate shareable preview links with time-limited tokens (1 hour expiry)
8. THE Admin_Panel SHALL support Unpublish and Archive (soft delete) actions
9. WHEN a slug changes, THE Admin_Panel SHALL auto-create a redirect to prevent broken links
10. THE Admin_Panel SHALL save content revisions on each update for undo/restore functionality
11. THE Admin_Panel SHALL allow restoring content to any previous revision

### Requirement 20: Supabase Storage

**User Story:** As Tejas, I want uploaded assets to be optimized and organized, so that the site performs well.

#### Acceptance Criteria

1. THE Content_API SHALL create storage buckets: `public-images`, `private-admin`, `resume`
2. WHEN an image is uploaded, THE Content_API SHALL generate optimized variants: 1200px web, 600px thumb, 1200×630 OG
3. THE Content_API SHALL store image metadata (width, height) in the database
4. WHEN the resume PDF is updated, THE Portfolio_Site SHALL reflect the change immediately on `/resume`

### Requirement 21: Database Schema

**User Story:** As a developer, I want a well-structured database schema, so that content is properly organized and queryable.

#### Acceptance Criteria

1. THE Content_API SHALL maintain a `site_settings` table with hero text, social links, SEO defaults, and feature toggles
2. THE Content_API SHALL maintain a `projects` table with title, slug, one_liner, problem, approach, impact, stack, links, build_notes, is_featured, sort_order, status, and published_at
3. THE Content_API SHALL maintain a `blog_posts` table with title, slug, summary, body_md (Markdown string), tags, cover_url, reading_time_minutes, status, and published_at
4. THE Content_API SHALL maintain a `pages` table with key, body_md, and updated_at
5. THE Content_API SHALL maintain a `redirects` table with from_path, to_path, and created_at
6. THE Content_API SHALL maintain an `audit_log` table with actor_id, action, table, row_id, and created_at
7. THE Content_API SHALL maintain a `contact_messages` table with name, email, message, ip_hash, is_read, and created_at
8. THE Content_API SHALL maintain an `assets` table with filename, original_url, bucket, mime_type, size_bytes, width, height, variants, and alt_text
9. THE Content_API SHALL maintain a `content_revisions` table with content_type, content_id, revision_number, data, created_by, and created_at
10. THE Content_API SHALL maintain a `preview_tokens` table with token, content_type, content_id, expires_at, and created_by

### Requirement 22: Row Level Security

**User Story:** As Tejas, I want database security policies, so that only authorized users can access appropriate data.

#### Acceptance Criteria

1. THE Content_API SHALL enable RLS on all tables
2. THE Content_API SHALL allow anonymous users SELECT only where status equals 'published'
3. THE Content_API SHALL allow authenticated editor/admin users full CRUD based on role
4. THE Content_API SHALL prevent anonymous access to draft content

### Requirement 23: Content Update Propagation

**User Story:** As Tejas, I want content changes to appear on the live site quickly, so that updates are visible without redeployment.

#### Acceptance Criteria

1. WHEN content changes in Supabase, THE Portfolio_Site SHALL reflect updates within 60 seconds
2. THE Portfolio_Site SHALL implement cache revalidation via webhook, realtime subscription, or polling

### Requirement 24: Routing Structure

**User Story:** As a visitor, I want clear URL routes, so that I can navigate and share links easily.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL serve the home page at `/`
2. THE Portfolio_Site SHALL serve the about page at `/about`
3. THE Portfolio_Site SHALL serve the projects hub at `/projects`
4. THE Portfolio_Site SHALL serve individual projects at `/projects/[slug]`
5. THE Portfolio_Site SHALL serve the blog list at `/blog`
6. THE Portfolio_Site SHALL serve individual blog posts at `/blog/[slug]`
7. THE Portfolio_Site SHALL serve the resume at `/resume`
8. THE Portfolio_Site SHALL serve the contact page at `/contact`
9. THE Portfolio_Site SHALL serve the hidden arcade at `/play`
10. THE Portfolio_Site SHALL serve draft preview at `/preview/[type]/[slug]` with valid token
11. WHEN a redirect exists for a path, THE Portfolio_Site SHALL redirect to the target path

### Requirement 25: Theme System

**User Story:** As a visitor, I want multiple theme options, so that I can customize my viewing experience.

#### Acceptance Criteria

1. THE Portfolio_Site SHALL support dark theme as default and Persist to localStorage.
2. THE Portfolio_Site SHALL support cyber, dracula, and solarized theme variants
3. THE Portfolio_Site SHALL persist theme selection in localStorage
4. THE Portfolio_Site SHALL apply theme via terminal command `theme <name>`
5. THE Portfolio_Site SHALL apply theme via settings toggle in Left Rail
