'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { AppId } from '../PhoneMock';

interface HomeScreenProps {
  time: string;
  onOpenApp: (appId: AppId) => void;
}

interface AppIcon {
  id: AppId;
  name: string;
  icon: React.ReactNode;
  gradient: string;
  notification?: number;
}

const APPS: AppIcon[] = [
  {
    id: 'projects',
    name: 'Projects',
    gradient: 'from-orange-400 to-pink-500',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'blog',
    name: 'Blog',
    gradient: 'from-green-400 to-emerald-500',
    notification: 3,
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    id: 'resume',
    name: 'Resume',
    gradient: 'from-blue-400 to-indigo-500',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'contact',
    name: 'Contact',
    gradient: 'from-purple-400 to-violet-500',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'github',
    name: 'GitHub',
    gradient: 'from-gray-700 to-gray-900',
    icon: (
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
  },
  {
    id: 'safari',
    name: 'Safari',
    gradient: 'from-sky-400 to-blue-500',
    icon: (
      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5l-7-3-3-7 7 3 3 7z"/>
      </svg>
    ),
  },
  {
    id: 'photos',
    name: 'Photos',
    gradient: 'from-pink-400 via-red-400 to-yellow-400',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    name: 'Settings',
    gradient: 'from-gray-400 to-gray-600',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const DOCK_APPS: AppId[] = ['projects', 'blog', 'contact', 'github'];

export function HomeScreen({ time, onOpenApp }: HomeScreenProps) {
  const [pressedApp, setPressedApp] = useState<AppId | null>(null);
  
  const mainApps = APPS.filter(app => !DOCK_APPS.includes(app.id));
  const dockApps = APPS.filter(app => DOCK_APPS.includes(app.id));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Wallpaper */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(147, 51, 234, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(236, 72, 153, 0.4) 0%, transparent 50%),
            linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)
          `,
        }}
      />

      {/* Status bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-14 pb-2">
        <span className="text-white text-[15px] font-semibold">{time}</span>
        <div className="flex items-center gap-1.5">
          <SignalBars strength={4} />
          <span className="text-white text-[11px] font-medium ml-0.5">5G</span>
          <WifiIcon />
          <BatteryIndicator percent={87} />
        </div>
      </div>

      {/* App grid */}
      <div className="flex-1 relative z-10 px-5 pt-2">
        <div className="grid grid-cols-4 gap-x-4 gap-y-5">
          {mainApps.map((app, index) => (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, type: 'spring', stiffness: 300 }}
              onTouchStart={() => setPressedApp(app.id)}
              onTouchEnd={() => setPressedApp(null)}
              onMouseDown={() => setPressedApp(app.id)}
              onMouseUp={() => setPressedApp(null)}
              onMouseLeave={() => setPressedApp(null)}
              onClick={() => onOpenApp(app.id)}
              className="flex flex-col items-center gap-1.5"
            >
              <motion.div
                animate={{ scale: pressedApp === app.id ? 0.9 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`relative w-[60px] h-[60px] rounded-[14px] bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-lg`}
                style={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                {app.icon}
                {/* Notification badge */}
                {app.notification && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                    <span className="text-white text-[11px] font-bold">{app.notification}</span>
                  </div>
                )}
              </motion.div>
              <span className="text-white text-[11px] font-medium drop-shadow-sm">
                {app.name}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Page dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          <div className="w-[6px] h-[6px] rounded-full bg-white" />
          <div className="w-[6px] h-[6px] rounded-full bg-white/30" />
          <div className="w-[6px] h-[6px] rounded-full bg-white/30" />
        </div>

        {/* Search pill */}
        <div className="mt-4 mx-auto">
          <div className="w-[160px] h-[32px] bg-white/15 backdrop-blur-xl rounded-full flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-white/60 text-[13px]">Search</span>
          </div>
        </div>
      </div>

      {/* Dock */}
      <div className="relative z-10 px-3 pb-3">
        <div className="bg-white/15 backdrop-blur-2xl rounded-[26px] p-2.5 flex justify-around border border-white/10">
          {dockApps.map((app) => (
            <motion.button
              key={app.id}
              onTouchStart={() => setPressedApp(app.id)}
              onTouchEnd={() => setPressedApp(null)}
              onMouseDown={() => setPressedApp(app.id)}
              onMouseUp={() => setPressedApp(null)}
              onMouseLeave={() => setPressedApp(null)}
              onClick={() => onOpenApp(app.id)}
            >
              <motion.div
                animate={{ scale: pressedApp === app.id ? 0.9 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`relative w-[56px] h-[56px] rounded-[13px] bg-gradient-to-br ${app.gradient} flex items-center justify-center`}
                style={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                {app.icon}
                {app.notification && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                    <span className="text-white text-[11px] font-bold">{app.notification}</span>
                  </div>
                )}
              </motion.div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Signal Bars
function SignalBars({ strength }: { strength: number }) {
  return (
    <div className="flex items-end gap-[2px] h-3">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`w-[3px] rounded-sm ${bar <= strength ? 'bg-white' : 'bg-white/30'}`}
          style={{ height: `${bar * 25}%` }}
        />
      ))}
    </div>
  );
}

// WiFi Icon
function WifiIcon() {
  return (
    <svg className="w-[17px] h-[12px] text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0-4c2.2 0 4 1.8 4 4h-2c0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.2 1.8-4 4-4zm0-4c3.3 0 6 2.7 6 6h-2c0-2.2-1.8-4-4-4s-4 1.8-4 4H6c0-3.3 2.7-6 6-6zm0-4c4.4 0 8 3.6 8 8h-2c0-3.3-2.7-6-6-6s-6 2.7-6 6H4c0-4.4 3.6-8 8-8z" />
    </svg>
  );
}

// Battery Indicator
function BatteryIndicator({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <div className="w-[24px] h-[11px] border border-white/50 rounded-[3px] flex items-center p-[2px]">
          <div 
            className="h-full bg-white rounded-[1px]" 
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[5px] bg-white/50 rounded-r-sm" />
      </div>
    </div>
  );
}
