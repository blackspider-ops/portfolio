# Implementation Plan: Tejas Portfolio v3

## Overview

This implementation plan builds a Next.js 14+ portfolio with Supabase backend, following the anti-template design with left-rail navigation, interactive features (terminal, command palette, workbench), and a full CMS admin panel. Tasks are ordered to build foundational infrastructure first, then public pages, interactive features, and finally the admin panel.

## Tasks

- [x] 1. Project Setup and Infrastructure
  - [x] 1.1 Initialize Next.js 14+ project with App Router and TypeScript
    - Create new Next.js project with `create-next-app`
    - Configure TypeScript strict mode
    - Set up path aliases in tsconfig.json
    - _Requirements: 24.1-24.11_

  - [x] 1.2 Configure Tailwind CSS with design tokens
    - Install Tailwind CSS 4
    - Define CSS custom properties for all design tokens (colors, fonts)
    - Configure Fraunces, Inter, and JetBrains Mono fonts (self-hosted)
    - _Requirements: 2.1-2.11_

  - [x] 1.3 Set up Supabase client and types
    - Install @supabase/supabase-js and @supabase/ssr
    - Create Supabase client utilities (browser, server, admin)
    - Generate TypeScript types from database schema
    - _Requirements: 21.1-21.10_

  - [x] 1.4 Create database migrations
    - Create migration for site_settings table (singleton)
    - Create migration for projects table
    - Create migration for blog_posts table
    - Create migration for pages table
    - Create migration for redirects table
    - Create migration for audit_log table
    - Create migration for contact_messages table
    - Create migration for content_revisions table
    - Create migration for preview_tokens table
    - Create migration for assets table
    - Create migration for user_roles table
    - _Requirements: 21.1-21.10_

  - [x] 1.5 Set up Row Level Security policies
    - Create RLS policies for public read access (published content only)
    - Create RLS policies for authenticated editor/admin access
    - Create RLS policies for admin-only tables (site_settings, audit_log)
    - Create RLS policies for preview tokens (public validation)
    - _Requirements: 22.1-22.4_

  - [x] 1.6 Create Supabase storage buckets
    - Create public-images bucket with image MIME type restrictions
    - Create resume bucket for PDF storage
    - Create private-admin bucket for draft assets
    - _Requirements: 20.1_

  - [x] 1.7 Write property test for design token consistency
    - **Property 3: Design Token Consistency**
    - **Validates: Requirements 2.1-2.11**

- [x] 2. Layout Components
  - [x] 2.1 Create root layout with providers
    - Set up ThemeProvider for theme switching
    - Configure font loading with next/font
    - Add global styles and CSS reset
    - _Requirements: 25.1-25.5_

  - [x] 2.2 Implement Left Rail navigation (desktop)
    - Create 92px fixed sidebar with TS monogram
    - Add navigation icons (Home, Projects, Blog, Resume, Contact)
    - Add utility icons (command palette, terminal, theme, settings)
    - Implement tooltips on hover/focus
    - Implement active state with pill highlight and glow
    - _Requirements: 3.1-3.7_

  - [x] 2.3 Implement Bottom Bar navigation (mobile)
    - Create responsive bottom bar for viewports < 1024px
    - Add 5 navigation icons with floating terminal action
    - Ensure smooth transition between layouts
    - _Requirements: 3.6_

  - [x] 2.4 Write property test for responsive navigation
    - **Property 1: Responsive Navigation Layout**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 2.5 Implement Blueprint background with scan line
    - Create subtle grid pattern background
    - Add slow scan line animation
    - Respect prefers-reduced-motion
    - _Requirements: 1.7, 1.8_

  - [x] 2.6 Write property test for reduced motion compliance
    - **Property 2: Reduced Motion Compliance**
    - **Validates: Requirements 1.8, 15.6**

- [x] 3. Checkpoint - Layout Foundation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Public Pages - Home
  - [x] 4.1 Create Home page layout
    - Implement asymmetric two-column layout
    - Add H1 with gradient styling on middle line
    - Add subhead with 60ch max-width
    - Add primary CTA (Open Workbench) and secondary CTA (View Projects)
    - _Requirements: 4.1-4.5_

  - [x] 4.2 Implement Live Stats card
    - Fetch GitHub stars and last commit via API
    - Implement 10-minute cache for API data
    - Add count-up animation for numbers
    - Use JetBrains Mono for statistics
    - _Requirements: 4.6, 4.8_

  - [x] 4.3 Implement Recent Activity card
    - Display recent pushes, blog posts, deployments
    - Fetch from Supabase (recent published content)
    - _Requirements: 4.7_

  - [x] 4.4 Implement Recent Work section
    - Create asymmetric card layout (2 wide + 1 tall)
    - Fetch featured projects from Supabase
    - _Requirements: 4.9_

  - [x] 4.5 Implement Now panel and Signals row
    - Fetch Now panel items from site_settings
    - Display badges for HackPSU, Schreyer Honors, Devs@PSU
    - _Requirements: 4.10, 4.11_

  - [x] 4.6 Add keyboard shortcut hints
    - Display "Press ⌘K to search" and "Press ~ for terminal"
    - _Requirements: 4.12_

- [x] 5. Public Pages - Content
  - [x] 5.1 Create About page
    - Fetch content from pages table (key='about')
    - Render Markdown content
    - _Requirements: 24.2_

  - [x] 5.2 Create Projects hub page
    - Fetch published projects from Supabase
    - Display project cards with flip/expand on hover
    - Implement sort by sort_order
    - _Requirements: 10.1-10.6, 24.3_

  - [x] 5.3 Create Project detail page
    - Fetch project by slug
    - Display title, one-liner, problem, approach, impact
    - Display stack chips and links
    - Display Build Notes with tradeoffs
    - Display "What I'd improve next"
    - _Requirements: 10.2-10.4, 24.4_

  - [x] 5.4 Write property test for project data completeness
    - **Property 12: Project Data Completeness**
    - **Validates: Requirements 10.1, 10.2**

  - [x] 5.5 Create Blog list page
    - Fetch published blog posts from Supabase
    - Display cards with tags and reading time
    - _Requirements: 11.1, 24.5_

  - [x] 5.6 Create Blog post page
    - Fetch blog post by slug
    - Render Markdown with react-markdown + remark-gfm
    - Implement Shiki syntax highlighting
    - Add copy button to code blocks
    - _Requirements: 11.2-11.5, 24.6_

  - [x] 5.7 Write property test for blog post rendering
    - **Property 13: Blog Post Rendering**
    - **Validates: Requirements 11.3, 11.4**

  - [x] 5.8 Create Resume page
    - Embed resume PDF from Supabase storage
    - Add download button
    - Create ATS-friendly HTML section
    - _Requirements: 12.1-12.3, 24.7_

  - [x] 5.9 Create Contact page
    - Build contact form with name, email, message fields
    - Add honeypot field for spam prevention
    - Implement server action for form submission
    - Implement rate limiting (3/hour/IP)
    - Display social links and Calendly placeholder
    - _Requirements: 13.1-13.6, 24.8_

  - [x] 5.10 Write property test for contact form validation
    - **Property 14: Contact Form Validation**
    - **Validates: Requirements 13.1**

- [x] 6. Checkpoint - Public Pages
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. RSS and OG Images
  - [x] 7.1 Create RSS feed endpoint
    - Generate RSS XML at /rss.xml
    - Include all published blog posts
    - _Requirements: 11.6_

  - [x] 7.2 Implement OG image generation
    - Create dynamic OG images for blog posts
    - Use @vercel/og or similar
    - _Requirements: 11.7_

- [x] 8. Redirects and Preview
  - [x] 8.1 Implement redirect middleware
    - Check redirects table for incoming paths
    - Perform 301 redirect to target path
    - _Requirements: 24.11_

  - [x] 8.2 Write property test for redirect resolution
    - **Property 21: Redirect Resolution**
    - **Validates: Requirements 24.10**

  - [x] 8.3 Create preview route
    - Implement /preview/[type]/[slug] route
    - Validate preview token and expiry
    - Render draft content with preview banner
    - _Requirements: 24.10_

- [x] 9. Interactive Features - Command Palette
  - [x] 9.1 Implement Command Palette component
    - Create modal with search input
    - Index routes, projects, and blog posts
    - Implement fuzzy search
    - _Requirements: 5.2_

  - [x] 9.2 Add Command Palette actions
    - Copy email action
    - Download resume action
    - Toggle theme action
    - Open terminal action
    - Open random project action
    - _Requirements: 5.3_

  - [x] 9.3 Implement keyboard shortcuts
    - Open on ⌘K (Mac) / Ctrl+K (Windows/Linux)
    - Close on Escape
    - Navigate with arrow keys
    - Select with Enter
    - Implement focus trap
    - _Requirements: 5.1, 5.5-5.7_

  - [x] 9.4 Write property test for command palette search
    - **Property 4: Command Palette Search**
    - **Validates: Requirements 5.2**

  - [x] 9.5 Write property test for command palette keyboard behavior
    - **Property 6: Command Palette Keyboard Behavior**
    - **Validates: Requirements 5.5, 5.6, 5.7**

- [x] 10. Interactive Features - Terminal
  - [x] 10.1 Implement Terminal component
    - Create overlay with terminal UI
    - Display prompt `tejas@portfolio:~$`
    - Implement command input and output display
    - _Requirements: 6.2_

  - [x] 10.2 Implement terminal commands
    - `help` - show all commands
    - `whoami` - short bio
    - `ls` / `ls projects` - list content
    - `open <slug>` - navigate to project
    - `blog <query>` - search and open blog
    - `theme <name>` - change theme
    - `ascii tejas` - display ASCII logo
    - `reveal` - toggle dev notes overlay
    - `snake` / `pong` - launch games
    - `sudo` - permission denied easter egg
    - _Requirements: 6.3-6.12_

  - [x] 10.3 Implement terminal keyboard handling
    - Toggle on tilde (~) key
    - Close on Escape
    - Implement focus trap
    - Store last 5 commands in sessionStorage
    - _Requirements: 6.1, 6.13-6.15_

  - [x] 10.4 Write property test for terminal toggle
    - **Property 7: Terminal Toggle**
    - **Validates: Requirements 6.1**

  - [x] 10.5 Write property test for terminal command execution
    - **Property 8: Terminal Command Execution**
    - **Validates: Requirements 6.3-6.11**

  - [x] 10.6 Write property test for terminal command history
    - **Property 9: Terminal Command History**
    - **Validates: Requirements 6.13**

- [x] 11. Checkpoint - Interactive Features Part 1
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Interactive Features - Workbench
  - [x] 12.1 Implement Workbench container
    - Create faux OS layer overlay
    - Implement taskbar with window buttons
    - Apply wallpaper matching current theme
    - _Requirements: 7.1, 7.8_

  - [x] 12.2 Implement draggable windows
    - Create window component with title bar
    - Implement drag functionality
    - Implement snap to edges
    - Implement minimize/restore
    - Manage z-index for window stacking
    - _Requirements: 7.2-7.5_

  - [x] 12.3 Create window content components
    - IDE window with "Run demo" button
    - Terminal window (reuse terminal component)
    - Notes window
    - Browser window
    - _Requirements: 7.2, 7.7_

  - [x] 12.4 Implement state persistence
    - Save window positions/sizes to localStorage
    - Save minimized states
    - Restore on workbench open
    - _Requirements: 7.6_

  - [x] 12.5 Write property test for workbench state persistence
    - **Property 11: Workbench Window State Persistence**
    - **Validates: Requirements 7.6**

- [x] 13. Interactive Features - Phone Mock
  - [x] 13.1 Implement Phone Mock component
    - Create floating phone frame
    - Toggle from Home or Workbench
    - _Requirements: 8.1_

  - [x] 13.2 Implement app navigation
    - Create swipe gesture handling
    - Add arrow key navigation
    - Add visible tab buttons
    - Switch between Projects, Blog, Resume, Contact apps
    - _Requirements: 8.2, 8.5_

  - [x] 13.3 Implement long-press interaction
    - Show stack chips and key tradeoff on project cards
    - _Requirements: 8.3_

  - [x] 13.4 Implement Share to Story
    - Generate 1080×1920 PNG with cover and title
    - Use html-to-image or similar
    - _Requirements: 8.4_

- [x] 14. Easter Eggs and Games
  - [x] 14.1 Implement Konami code detection
    - Listen for ↑↑↓↓←→←→BA Enter sequence
    - Navigate to /play on success
    - _Requirements: 9.1_

  - [x] 14.2 Create /play arcade page
    - Implement Snake game
    - Implement Pong game
    - Add sound toggle (OFF by default)
    - Respect prefers-reduced-motion for sound
    - _Requirements: 9.2, 9.5_

  - [x] 14.3 Create playable 404 page
    - Implement mini-game
    - Use route hash as score seed
    - _Requirements: 9.3, 9.4_

- [x] 15. Theme System
  - [x] 15.1 Implement theme switching
    - Create dark, cyber, dracula, solarized themes
    - Apply via CSS custom properties
    - Persist selection in localStorage
    - _Requirements: 25.1-25.5_

  - [x] 15.2 Write property test for theme persistence
    - **Property 19: Theme Persistence**
    - **Validates: Requirements 25.3, 25.4**

- [x] 16. Checkpoint - Interactive Features Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Admin Panel - Authentication
  - [x] 17.1 Create admin layout with auth protection
    - Implement Supabase Auth middleware
    - Redirect unauthenticated users to login
    - Check user role from user_roles table
    - _Requirements: 16.1-16.5_

  - [x] 17.2 Create login page
    - Email/password login form
    - Magic link option
    - Error handling
    - _Requirements: 16.2_

  - [x] 17.3 Write property test for admin route protection
    - **Property 15: Admin Route Protection**
    - **Validates: Requirements 16.1, 16.2**

- [x] 18. Admin Panel - Dashboard
  - [x] 18.1 Create admin dashboard
    - Display published posts count
    - Display drafts count
    - Display last update time
    - Add quick action buttons
    - _Requirements: 17.1-17.3_

- [x] 19. Admin Panel - Content Management
  - [x] 19.1 Create projects admin page
    - List all projects (drafts and published)
    - CRUD operations
    - Drag-to-reorder functionality
    - _Requirements: 18.3_

  - [x] 19.2 Create project editor
    - Form fields for all project properties
    - Stack chips editor
    - Links editor
    - Build notes with tradeoffs
    - Cover image upload
    - _Requirements: 19.1-19.4_

  - [x] 19.3 Create blog admin page
    - List all blog posts
    - CRUD operations
    - _Requirements: 18.4_

  - [x] 19.4 Create blog post editor
    - Title, slug (auto-generated), summary fields
    - Markdown editor with live preview
    - Tags editor
    - Cover image upload
    - Reading time auto-calculation
    - _Requirements: 19.1-19.4_

  - [x] 19.5 Create pages admin (Home/About)
    - Edit hero headline, subhead, CTAs
    - Edit Now panel items
    - Edit About content
    - _Requirements: 18.1, 18.2_

  - [x] 19.6 Implement autosave
    - Save draft every 5-10 seconds
    - Show "Saved" indicator
    - _Requirements: 19.5_

  - [x] 19.7 Implement publish workflow
    - Draft → Preview → Publish flow
    - Generate preview token
    - Unpublish and Archive actions
    - _Requirements: 19.6-19.8_

  - [x] 19.8 Implement slug change redirect
    - Detect slug changes
    - Auto-create redirect entry
    - _Requirements: 19.9_

  - [x] 19.9 Write property test for slug redirect creation
    - **Property 17: Slug Redirect Creation**
    - **Validates: Requirements 19.8**

- [x] 20. Admin Panel - Assets and Settings
  - [x] 20.1 Create assets admin page
    - Upload images to public-images bucket
    - Upload resume PDF
    - Display asset gallery
    - Track in assets table
    - _Requirements: 18.5, 20.1-20.4_

  - [x] 20.2 Write property test for image asset tracking
    - **Property 18: Image Asset Tracking**
    - **Validates: Requirements 20.2**

  - [x] 20.3 Create settings admin page
    - Theme presets configuration
    - Contact links (GitHub, LinkedIn, Email, Calendly)
    - SEO defaults
    - Feature toggles (Terminal, Workbench, Phone, Games, 3D)
    - _Requirements: 18.6_

- [x] 21. Admin Panel - Revisions
  - [x] 21.1 Implement revision saving
    - Save revision on content update
    - Store full content snapshot
    - _Requirements: 19.10_

  - [x] 21.2 Create revision history UI
    - Display revision list with timestamps
    - Preview revision content
    - Restore to previous revision
    - _Requirements: 19.11_

- [x] 22. Admin Panel - Contact Messages
  - [x] 22.1 Create contact messages admin page
    - List all contact form submissions
    - Mark as read/unread
    - _Requirements: 13.4_

- [x] 23. RLS and Security Verification
  - [x] 23.1 Write property test for RLS public content filtering
    - **Property 16: RLS Public Content Filtering**
    - **Validates: Requirements 22.1, 22.2, 22.3**

  - [x] 23.2 Implement input sanitization
    - Sanitize Markdown/HTML to prevent XSS
    - Validate all admin inputs
    - _Requirements: 16.6_

- [x] 24. Accessibility Audit
  - [x] 24.1 Implement focus management
    - Visible focus rings on all interactive elements
    - Focus traps in Terminal, Workbench, Command Palette
    - _Requirements: 15.3-15.5_

  - [x] 24.2 Write property test for terminal focus management
    - **Property 10: Terminal Focus Management**
    - **Validates: Requirements 6.14, 6.15**

  - [x] 24.3 Verify contrast ratios
    - AAA for body text
    - AA for interactive elements
    - _Requirements: 15.1, 15.2_

- [x] 25. Performance Optimization
  - [x] 25.1 Implement lazy loading
    - Lazy-load 3D ink ribbon
    - Lazy-load Workbench layer
    - Lazy-load games
    - _Requirements: 14.3_

  - [x] 25.2 Optimize images
    - Configure Next.js Image optimization
    - Serve WebP/AVIF with srcset
    - _Requirements: 14.4_

  - [x] 25.3 Verify performance budgets
    - LCP < 2.2s on mobile Fast 3G
    - JS ≤ 250KB gzip on Home
    - _Requirements: 14.1, 14.2_

- [x] 26. Cache Invalidation
  - [x] 26.1 Configure ISR with 60s revalidation
    - Set revalidate: 60 on content routes
    - _Requirements: 23.1_

  - [x] 26.2 Implement manual revalidation
    - Call revalidatePath on publish/unpublish
    - Revalidate affected routes
    - _Requirements: 23.2_

- [x] 27. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all acceptance criteria are met.
  - Test full admin workflow: create → edit → preview → publish.
  - Test all interactive features: terminal, command palette, workbench, phone mock.
  - Verify performance and accessibility requirements.

## Notes

- All tasks including property-based tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Database migrations should be run in order (1.4) before RLS policies (1.5)
- Admin panel tasks (17-22) depend on authentication being set up first
