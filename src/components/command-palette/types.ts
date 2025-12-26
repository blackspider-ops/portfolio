/**
 * Command Palette Types
 * Requirements: 5.1-5.7
 */

export type CommandItemType = 'route' | 'project' | 'blog' | 'action';

export interface CommandItem {
  id: string;
  type: CommandItemType;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
  shortcut?: string;
}

export interface SearchableContent {
  id: string;
  type: 'project' | 'blog';
  title: string;
  slug: string;
  description?: string;
  keywords?: string[];
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: SearchableContent[];
  blogPosts?: SearchableContent[];
  onNavigate?: (path: string) => void;
  onCopyEmail?: () => void;
  onDownloadResume?: () => void;
  onToggleTheme?: () => void;
  onOpenTerminal?: () => void;
}
