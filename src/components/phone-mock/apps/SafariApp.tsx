'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface SafariAppProps {
  onClose: () => void;
}

export function SafariApp({ onClose }: SafariAppProps) {
  const [url, setUrl] = useState('tejassinghal.dev');
  const [isLoading, setIsLoading] = useState(false);

  const bookmarks = [
    { name: 'Portfolio', url: 'tejassinghal.dev', icon: '🏠' },
    { name: 'GitHub', url: 'github.com', icon: '🐙' },
    { name: 'LinkedIn', url: 'linkedin.com', icon: '💼' },
    { name: 'Twitter', url: 'twitter.com', icon: '🐦' },
  ];

  const handleNavigate = (newUrl: string) => {
    setIsLoading(true);
    setUrl(newUrl);
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="h-full flex flex-col bg-[#1c1c1e]">
      {/* URL bar */}
      <div className="px-3 py-2 bg-[#2c2c2e] border-b border-white/10">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-blue-400 text-sm">
            ←
          </button>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#3a3a3c] rounded-lg">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            )}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNavigate(url)}
              className="flex-1 bg-transparent text-white text-sm outline-none"
              placeholder="Search or enter website"
            />
          </div>
          <button className="text-blue-400 text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#1c1c1e]">
        {/* Favorites */}
        <div className="p-4">
          <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">Favorites</h3>
          <div className="grid grid-cols-4 gap-4">
            {bookmarks.map((bookmark, index) => (
              <motion.button
                key={bookmark.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleNavigate(bookmark.url)}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                  {bookmark.icon}
                </div>
                <span className="text-white/70 text-xs">{bookmark.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Reading List */}
        <div className="p-4 border-t border-white/10">
          <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">Reading List</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">Building Modern Web Apps</p>
                <p className="text-white/50 text-xs">dev.to</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-500" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">React Best Practices 2024</p>
                <p className="text-white/50 text-xs">medium.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Report */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Privacy Report</p>
                <p className="text-white/50 text-xs">Safari prevented 12 trackers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-around py-3 bg-[#2c2c2e] border-t border-white/10">
        <button className="text-white/50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="text-white/50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button className="text-blue-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
        <button className="text-white/50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
        <button className="text-white/50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
