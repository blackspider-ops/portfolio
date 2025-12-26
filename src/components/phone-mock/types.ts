/**
 * Phone Mock Types
 * Requirements: 8.1-8.5
 */

import type { Project, BlogPost } from '@/types/database';

export interface PhoneMockProps {
  isOpen: boolean;
  onClose: () => void;
  initialApp?: PhoneAppId;
}

export type PhoneAppId = 'projects' | 'blog' | 'resume' | 'contact';

export interface PhoneApp {
  id: PhoneAppId;
  name: string;
  icon: React.ReactNode;
}

export interface PhoneMockContextValue {
  isOpen: boolean;
  open: (initialApp?: PhoneAppId) => void;
  close: () => void;
  toggle: () => void;
}

export interface PhoneProjectCardProps {
  project: Project;
  onLongPress?: () => void;
  showDetails?: boolean;
}

export interface PhoneBlogCardProps {
  post: BlogPost;
}

export interface ShareToStoryData {
  title: string;
  coverUrl?: string | null;
  type: 'project' | 'blog';
}
