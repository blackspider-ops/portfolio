'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import type { PhoneMockProps } from './types';

// Screen imports
import { HomeScreen } from './screens/HomeScreen';
import { LockScreen } from './screens/LockScreen';
import { AppScreen } from './screens/AppScreen';
import { ControlCenter } from './screens/ControlCenter';

export type AppId = 'projects' | 'blog' | 'resume' | 'contact' | 'photos' | 'settings' | 'safari' | 'github';

export function PhoneMock({ isOpen, onClose, initialApp }: PhoneMockProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [time, setTime] = useState(new Date());
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(50);
  const [wifiOn, setWifiOn] = useState(true);
  const [bluetoothOn, setBluetoothOn] = useState(true);
  const [airplaneMode, setAirplaneMode] = useState(false);
  const [isAppSwitcher, setIsAppSwitcher] = useState(false);
  const [recentApps, setRecentApps] = useState<AppId[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  // For swipe gestures
  const dragY = useMotionValue(0);
  const screenScale = useTransform(dragY, [0, 200], [1, 0.85]);
  const screenBorderRadius = useTransform(dragY, [0, 200], [0, 40]);

  // Update time every second for realistic clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setIsLocked(true);
      setActiveApp(null);
      setShowControlCenter(false);
      setIsAppSwitcher(false);
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => containerRef.current?.focus(), 10);
      
      if (initialApp) {
        setTimeout(() => {
          setIsLocked(false);
          setActiveApp(initialApp as AppId);
        }, 300);
      }
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen, initialApp]);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  const handleOpenApp = useCallback((appId: AppId) => {
    setActiveApp(appId);
    setRecentApps(prev => {
      const filtered = prev.filter(id => id !== appId);
      return [appId, ...filtered].slice(0, 5);
    });
    setIsAppSwitcher(false);
  }, []);

  const handleCloseApp = useCallback(() => {
    setActiveApp(null);
    setIsAppSwitcher(false);
  }, []);

  // Home gesture - swipe up from bottom
  const handleHomeGesture = useCallback(() => {
    if (showControlCenter) {
      setShowControlCenter(false);
    } else if (isAppSwitcher) {
      setIsAppSwitcher(false);
    } else if (activeApp) {
      setActiveApp(null);
    }
  }, [showControlCenter, activeApp, isAppSwitcher]);

  // App switcher gesture - swipe up and hold
  const handleAppSwitcher = useCallback(() => {
    if (activeApp && !isLocked) {
      setIsAppSwitcher(true);
    }
  }, [activeApp, isLocked]);

  // Handle drag end for home bar
  const handleDragEnd = useCallback((_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y < -100) {
      if (info.velocity.y < -500) {
        // Fast swipe - go home
        handleHomeGesture();
      } else {
        // Slow swipe - app switcher
        handleAppSwitcher();
      }
    }
    animate(dragY, 0, { type: 'spring', stiffness: 400, damping: 30 });
  }, [handleHomeGesture, handleAppSwitcher, dragY]);

  // Keyboard handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        if (showControlCenter) {
          setShowControlCenter(false);
        } else if (isAppSwitcher) {
          setIsAppSwitcher(false);
        } else if (activeApp) {
          setActiveApp(null);
        } else {
          onClose();
        }
        break;
      case 'h':
        e.preventDefault();
        handleHomeGesture();
        break;
    }
  }, [onClose, showControlCenter, activeApp, isAppSwitcher, handleHomeGesture]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Format time like iPhone
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    }).replace(' ', '');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Phone"
    >
      {/* Phone device */}
      <motion.div
        ref={containerRef}
        initial={{ scale: 0.8, opacity: 0, y: 100 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Phone frame - iPhone 15 Pro style */}
        <div 
          className="relative w-[320px] h-[680px] rounded-[55px] p-[12px]"
          style={{
            background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.1),
              0 50px 100px -20px rgba(0,0,0,0.8),
              inset 0 1px 0 rgba(255,255,255,0.1)
            `,
          }}
        >
          {/* Titanium frame effect */}
          <div className="absolute inset-0 rounded-[55px] pointer-events-none"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
            }}
          />

          {/* Screen bezel */}
          <div 
            className="relative w-full h-full rounded-[44px] overflow-hidden"
            style={{
              background: '#000',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.5)',
            }}
          >
            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50">
              <motion.div 
                className="bg-black rounded-full flex items-center justify-center gap-2 px-4"
                animate={{ 
                  width: showControlCenter ? 180 : 126,
                  height: showControlCenter ? 38 : 36,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                {/* Front camera */}
                <div className="w-[10px] h-[10px] rounded-full bg-[#1a1a1a] relative">
                  <div className="absolute inset-[2px] rounded-full bg-[#0d0d0d]" />
                  <div className="absolute top-[2px] left-[2px] w-[2px] h-[2px] rounded-full bg-[#2a2a2a]" />
                </div>
                {/* Face ID sensors */}
                <div className="w-[6px] h-[6px] rounded-full bg-[#1a1a1a]" />
              </motion.div>
            </div>

            {/* Screen content */}
            <motion.div 
              className="absolute inset-0 overflow-hidden"
              style={{ 
                scale: screenScale,
                borderRadius: screenBorderRadius,
                filter: `brightness(${brightness}%)`,
              }}
            >
              <AnimatePresence mode="wait">
                {isLocked ? (
                  <LockScreen
                    key="lock"
                    time={formatTime(time)}
                    date={formatDate(time)}
                    onUnlock={handleUnlock}
                  />
                ) : isAppSwitcher ? (
                  <AppSwitcherView
                    key="switcher"
                    recentApps={recentApps}
                    onSelectApp={handleOpenApp}
                    onClose={() => setIsAppSwitcher(false)}
                  />
                ) : activeApp ? (
                  <AppScreen
                    key={activeApp}
                    appId={activeApp}
                    onClose={handleCloseApp}
                    time={formatTime(time)}
                  />
                ) : (
                  <HomeScreen
                    key="home"
                    time={formatTime(time)}
                    onOpenApp={handleOpenApp}
                  />
                )}
              </AnimatePresence>

              {/* Control Center overlay */}
              <AnimatePresence>
                {showControlCenter && (
                  <ControlCenter
                    onClose={() => setShowControlCenter(false)}
                    brightness={brightness}
                    setBrightness={setBrightness}
                    volume={volume}
                    setVolume={setVolume}
                    wifiOn={wifiOn}
                    setWifiOn={setWifiOn}
                    bluetoothOn={bluetoothOn}
                    setBluetoothOn={setBluetoothOn}
                    airplaneMode={airplaneMode}
                    setAirplaneMode={setAirplaneMode}
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Home indicator bar */}
            {!isLocked && (
              <motion.div 
                className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 cursor-grab active:cursor-grabbing"
                drag="y"
                dragConstraints={{ top: -200, bottom: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                style={{ y: dragY }}
                onClick={handleHomeGesture}
              >
                <div className="w-[134px] h-[5px] bg-white/40 rounded-full" />
              </motion.div>
            )}

            {/* Top notch area tap for control center */}
            <div 
              className="absolute top-0 right-0 w-24 h-12 z-40 cursor-pointer"
              onClick={() => setShowControlCenter(true)}
            />
          </div>
        </div>

        {/* Side buttons */}
        {/* Silent switch */}
        <div className="absolute -left-[2px] top-[120px] w-[3px] h-[30px] bg-[#2a2a2a] rounded-l-sm" />
        {/* Volume up */}
        <div className="absolute -left-[2px] top-[170px] w-[3px] h-[55px] bg-[#2a2a2a] rounded-l-sm" />
        {/* Volume down */}
        <div className="absolute -left-[2px] top-[235px] w-[3px] h-[55px] bg-[#2a2a2a] rounded-l-sm" />
        {/* Power button */}
        <div className="absolute -right-[2px] top-[180px] w-[3px] h-[80px] bg-[#2a2a2a] rounded-r-sm" />
      </motion.div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
        aria-label="Close phone"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Keyboard hints */}
      <div className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-6 text-xs text-white/30">
        <span className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10">H</kbd>
          Home
        </span>
        <span className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10">ESC</kbd>
          Back
        </span>
      </div>
    </div>
  );
}

// App Switcher View
function AppSwitcherView({ 
  recentApps, 
  onSelectApp, 
  onClose 
}: { 
  recentApps: AppId[]; 
  onSelectApp: (id: AppId) => void;
  onClose: () => void;
}) {
  const appNames: Record<AppId, string> = {
    projects: 'Projects',
    blog: 'Blog',
    resume: 'Resume',
    contact: 'Contact',
    github: 'GitHub',
    safari: 'Safari',
    photos: 'Photos',
    settings: 'Settings',
  };

  const appColors: Record<AppId, string> = {
    projects: 'from-orange-400 to-pink-500',
    blog: 'from-green-400 to-emerald-500',
    resume: 'from-blue-400 to-indigo-500',
    contact: 'from-purple-400 to-violet-500',
    github: 'from-gray-600 to-gray-800',
    safari: 'from-sky-400 to-blue-500',
    photos: 'from-pink-400 to-yellow-400',
    settings: 'from-gray-400 to-gray-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center"
      onClick={onClose}
    >
      <div className="flex gap-4 px-4 overflow-x-auto">
        {recentApps.length > 0 ? (
          recentApps.map((appId, index) => (
            <motion.button
              key={appId}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 0.85 }}
              transition={{ delay: index * 0.05 }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectApp(appId);
              }}
              className="flex-shrink-0 w-[200px] h-[400px] rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className={`w-full h-full bg-gradient-to-br ${appColors[appId]} flex items-center justify-center`}>
                <span className="text-white text-xl font-semibold">{appNames[appId]}</span>
              </div>
            </motion.button>
          ))
        ) : (
          <p className="text-white/50 text-center">No recent apps</p>
        )}
      </div>
    </motion.div>
  );
}
