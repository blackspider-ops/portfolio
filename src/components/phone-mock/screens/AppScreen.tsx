'use client';

import { motion } from 'framer-motion';
import type { AppId } from '../PhoneMock';
import { ProjectsApp } from '../apps/ProjectsApp';
import { BlogApp } from '../apps/BlogApp';
import { ResumeApp } from '../apps/ResumeApp';
import { ContactApp } from '../apps/ContactApp';
import { GitHubApp } from '../apps/GitHubApp';
import { SafariApp } from '../apps/SafariApp';
import { PhotosApp } from '../apps/PhotosApp';
import { SettingsApp } from '../apps/SettingsApp';

interface AppScreenProps {
  appId: AppId;
  onClose: () => void;
  time: string;
}

const APP_COMPONENTS: Record<AppId, React.ComponentType<{ onClose: () => void }>> = {
  projects: ProjectsApp,
  blog: BlogApp,
  resume: ResumeApp,
  contact: ContactApp,
  github: GitHubApp,
  safari: SafariApp,
  photos: PhotosApp,
  settings: SettingsApp,
};

const APP_NAMES: Record<AppId, string> = {
  projects: 'Projects',
  blog: 'Blog',
  resume: 'Resume',
  contact: 'Contact',
  github: 'GitHub',
  safari: 'Safari',
  photos: 'Photos',
  settings: 'Settings',
};

export function AppScreen({ appId, onClose, time }: AppScreenProps) {
  const AppComponent = APP_COMPONENTS[appId];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute inset-0 bg-[#0a0a0f] flex flex-col"
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-14 pb-2 bg-[#0a0a0f]">
        <span className="text-white/80 text-sm font-medium">{time}</span>
        <div className="flex items-center gap-1">
          <SignalIcon className="w-4 h-4 text-white/80" />
          <WifiIcon className="w-4 h-4 text-white/80" />
          <BatteryIcon className="w-5 h-5 text-white/80" />
        </div>
      </div>

      {/* App content */}
      <div className="flex-1 overflow-hidden">
        <AppComponent onClose={onClose} />
      </div>
    </motion.div>
  );
}

function SignalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 20h2V10H2v10zm4 0h2V8H6v12zm4 0h2V4h-2v16zm4 0h2V6h-2v14zm4 0h2V2h-2v18z" />
    </svg>
  );
}

function WifiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0-4c2.2 0 4 1.8 4 4h-2c0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.2 1.8-4 4-4zm0-4c3.3 0 6 2.7 6 6h-2c0-2.2-1.8-4-4-4s-4 1.8-4 4H6c0-3.3 2.7-6 6-6zm0-4c4.4 0 8 3.6 8 8h-2c0-3.3-2.7-6-6-6s-6 2.7-6 6H4c0-4.4 3.6-8 8-8z" />
    </svg>
  );
}

function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="4" y="9" width="14" height="6" rx="1" fill="currentColor" />
      <path d="M22 10v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
