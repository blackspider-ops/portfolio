'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface SettingsAppProps {
  onClose: () => void;
}

export function SettingsApp({ onClose }: SettingsAppProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);

  const settingsSections = [
    {
      title: 'General',
      items: [
        {
          icon: '🌙',
          label: 'Dark Mode',
          type: 'toggle' as const,
          value: darkMode,
          onChange: () => setDarkMode(!darkMode),
        },
        {
          icon: '🔔',
          label: 'Notifications',
          type: 'toggle' as const,
          value: notifications,
          onChange: () => setNotifications(!notifications),
        },
        {
          icon: '📳',
          label: 'Haptic Feedback',
          type: 'toggle' as const,
          value: haptics,
          onChange: () => setHaptics(!haptics),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: '📱',
          label: 'Version',
          type: 'info' as const,
          value: '1.0.0',
        },
        {
          icon: '👨‍💻',
          label: 'Developer',
          type: 'info' as const,
          value: 'Tejas Singhal',
        },
        {
          icon: '🌐',
          label: 'Website',
          type: 'link' as const,
          value: 'tejassinghal.dev',
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: '📄',
          label: 'Privacy Policy',
          type: 'link' as const,
          value: '',
        },
        {
          icon: '📋',
          label: 'Terms of Service',
          type: 'link' as const,
          value: '',
        },
        {
          icon: '⚖️',
          label: 'Licenses',
          type: 'link' as const,
          value: '',
        },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <button onClick={onClose} className="text-blue-400 text-sm">
          ← Back
        </button>
        <h1 className="text-white font-semibold">Settings</h1>
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile card */}
        <div className="p-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-2xl p-4 flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
              T
            </div>
            <div>
              <h2 className="text-white font-semibold">Tejas Singhal</h2>
              <p className="text-white/50 text-sm">Portfolio Demo</p>
            </div>
            <svg className="w-5 h-5 text-white/30 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </div>

        {/* Settings sections */}
        {settingsSections.map((section, sectionIndex) => (
          <div key={section.title} className="px-4 mb-6">
            <h3 className="text-white/50 text-xs uppercase tracking-wider mb-2 px-2">
              {section.title}
            </h3>
            <div className="bg-white/5 rounded-2xl overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (sectionIndex * 3 + itemIndex) * 0.05 }}
                  className={`flex items-center justify-between p-4 ${
                    itemIndex < section.items.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-white">{item.label}</span>
                  </div>
                  
                  {item.type === 'toggle' && (
                    <button
                      onClick={item.onChange}
                      className={`w-12 h-7 rounded-full transition-colors ${
                        item.value ? 'bg-green-500' : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: item.value ? 22 : 2 }}
                        className="w-6 h-6 bg-white rounded-full shadow"
                      />
                    </button>
                  )}
                  
                  {item.type === 'info' && (
                    <span className="text-white/50 text-sm">{item.value}</span>
                  )}
                  
                  {item.type === 'link' && (
                    <div className="flex items-center gap-2">
                      {item.value && (
                        <span className="text-white/50 text-sm">{item.value}</span>
                      )}
                      <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="p-4 text-center">
          <p className="text-white/30 text-xs">
            Made with ❤️ by Tejas Singhal
          </p>
          <p className="text-white/20 text-xs mt-1">
            © 2024 All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
