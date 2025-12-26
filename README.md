# Portfolio v3

A modern, performant developer portfolio built with Next.js 16, featuring an IDE-inspired design with a command palette, terminal emulator, and arcade games.

![Lighthouse Score](https://img.shields.io/badge/Lighthouse-98-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

### Core
- **IDE-Inspired Design** - Left rail navigation, command palette (⌘K), and integrated terminal
- **Blog** - Markdown support with syntax highlighting via Shiki
- **Projects** - Showcase with detailed case studies and live demos
- **Resume** - PDF viewer with download option
- **Contact Form** - With validation and Supabase backend

### Interactive Elements
- **Command Palette** - Quick navigation and actions (⌘K)
- **Terminal Emulator** - Functional terminal with custom commands
- **Phone Mockup** - Interactive mobile preview component
- **6 Arcade Games** - Snake, Pong, Tetris, Memory, Catch, and Breakout

### Technical
- **98 Lighthouse Score** - Optimized for performance with SSR hero section
- **4 Color Themes** - Dark, Cyber, Dracula, Solarized
- **Fully Responsive** - Desktop sidebar, mobile bottom nav with overflow menu
- **PWA Ready** - Service worker with offline support
- **SEO Optimized** - Dynamic meta tags, JSON-LD, sitemap, RSS feed
- **Admin CMS** - Full content management with Supabase Auth

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel |

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/portfolio.git
cd portfolio

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Optional (for higher GitHub API rate limits)
GITHUB_TOKEN=your-github-token
```

### Database Setup

Run the migrations in `supabase/migrations/` in order, or use Supabase CLI:

```bash
npx supabase db push
```

## 📁 Project Structure

```
├── public/
│   ├── sw.js              # Service worker
│   └── offline.html       # Offline fallback page
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── admin/         # CMS admin pages
│   │   ├── api/           # API routes
│   │   └── ...            # Public pages
│   ├── components/
│   │   ├── command-palette/
│   │   ├── games/         # Arcade games
│   │   ├── home/          # Homepage sections
│   │   ├── navigation/    # LeftRail, BottomBar
│   │   ├── phone-mock/
│   │   ├── terminal/
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/      # Supabase client
│   │   └── hooks/         # Custom hooks
│   └── styles/
│       └── globals.css    # Tailwind + theme variables
└── supabase/
    └── migrations/        # Database migrations
```

## 🎮 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ + K` | Open command palette |
| `⌘ + J` | Toggle terminal |
| `⌘ + B` | Toggle phone mockup |
| `Escape` | Close modals |

## 🎨 Themes

The portfolio supports 4 color themes, switchable via the palette icon or command palette:

- **Dark** (default) - Deep charcoal with subtle accents
- **Cyber** - Neon-inspired with cyan highlights
- **Dracula** - Popular dark theme with purple tones
- **Solarized** - Warm, eye-friendly dark variant

## 📱 Responsive Design

- **Desktop (≥1024px)**: Fixed left sidebar with navigation
- **Mobile (<1024px)**: Bottom navigation bar with overflow menu for secondary actions

## 🔒 Admin CMS

Access the admin panel at `/admin` with Supabase Auth. Features include:

- Dashboard with analytics
- Blog post editor with markdown preview
- Project management
- Asset/media library
- Site settings configuration
- Message inbox

## 📄 License

All Rights Reserved. This code is proprietary and may not be used, copied, or distributed without permission.

---

Built with ☕ and Next.js
