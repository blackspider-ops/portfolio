/**
 * Terminal Types
 * Requirements: 6.1-6.15
 */

export interface TerminalOutput {
  type: 'text' | 'error' | 'success' | 'ascii' | 'list';
  content: string;
  items?: string[];
}

export interface TerminalCommand {
  name: string;
  description: string;
  usage?: string;
  execute: (args: string[], context: TerminalContext) => TerminalOutput | Promise<TerminalOutput>;
}

export interface SiteSettingsInfo {
  owner_name?: string;
  hero_subhead?: string;
  social_links?: {
    github?: string;
    linkedin?: string;
    email?: string;
  };
}

export interface TerminalContext {
  navigate: (path: string) => void;
  setTheme: (theme: string) => void;
  toggleDevNotes: () => void;
  toggleMatrix: () => void;
  projects: ProjectInfo[];
  blogPosts: BlogPostInfo[];
  siteSettings?: SiteSettingsInfo;
}

export interface ProjectInfo {
  slug: string;
  title: string;
  one_liner: string;
}

export interface BlogPostInfo {
  slug: string;
  title: string;
  summary?: string;
}

export interface TerminalHistoryEntry {
  command: string;
  output: TerminalOutput;
  timestamp: number;
}

export interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: ProjectInfo[];
  blogPosts?: BlogPostInfo[];
  siteSettings?: SiteSettingsInfo;
  onNavigate?: (path: string) => void;
  onSetTheme?: (theme: string) => void;
  onToggleDevNotes?: () => void;
  onToggleMatrix?: () => void;
}
