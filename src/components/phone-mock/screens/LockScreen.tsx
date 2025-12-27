'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface LockScreenProps {
  time: string;
  date: string;
  onUnlock: () => void;
}

export function LockScreen({ time, date, onUnlock }: LockScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, -150], [1, 0]);
  const scale = useTransform(y, [0, -150], [1, 0.9]);
  const blur = useTransform(y, [0, -150], [0, 10]);

  // Parse time for display
  const timeParts = time.replace(/AM|PM/i, '').trim();
  const period = time.includes('PM') ? 'PM' : 'AM';

  const handleDragEnd = useCallback((_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y < -100 || info.velocity.y < -500) {
      // Animate out then unlock
      animate(y, -300, { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        onComplete: onUnlock 
      });
    } else {
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
    setIsDragging(false);
  }, [onUnlock, y]);

  return (
    <motion.div
      style={{ y, opacity, scale }}
      drag="y"
      dragConstraints={{ top: -300, bottom: 0 }}
      dragElastic={0.2}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      {/* Wallpaper */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(120, 80, 200, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(60, 100, 180, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 90%, rgba(100, 60, 150, 0.3) 0%, transparent 40%),
            linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #0f0f23 100%)
          `,
        }}
      />

      {/* Depth of field blur effect */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
        }}
      />

      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 pt-16 z-10">
        <div className="flex items-center gap-1">
          <SignalBars strength={4} />
          <span className="text-white/80 text-xs font-medium ml-1">5G</span>
        </div>
        <div className="flex items-center gap-1.5">
          <WifiIcon />
          <BatteryIndicator percent={87} />
        </div>
      </div>

      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center pt-32">
        {/* Lock icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-4"
        >
          <svg className="w-6 h-6 text-white/60" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z"/>
          </svg>
        </motion.div>

        {/* Time */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <div className="flex items-baseline justify-center">
            <span className="text-[80px] font-light text-white tracking-tight leading-none">
              {timeParts}
            </span>
          </div>
        </motion.div>
        
        {/* Date */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[17px] text-white/70 mt-1 font-normal"
        >
          {date}
        </motion.p>

        {/* Notifications */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 w-[280px] space-y-2"
        >
          <NotificationCard
            icon="📱"
            app="Portfolio"
            title="Welcome!"
            message="Swipe up to explore my work"
            time="now"
          />
        </motion.div>
      </div>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 pb-8">
        {/* Flashlight and Camera */}
        <div className="flex justify-between px-10 mb-6">
          <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center active:bg-white/20">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
            </svg>
          </button>
          <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center active:bg-white/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Swipe indicator */}
        <motion.div
          animate={{ y: isDragging ? 0 : [0, -6, 0] }}
          transition={{ repeat: isDragging ? 0 : Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="flex flex-col items-center"
        >
          <span className="text-white/50 text-[13px] mb-2">Swipe up to unlock</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Notification Card
function NotificationCard({ 
  icon, 
  app, 
  title, 
  message, 
  time 
}: { 
  icon: string; 
  app: string; 
  title: string; 
  message: string; 
  time: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-2xl rounded-[20px] p-3.5 border border-white/10">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-white/60 text-[11px] font-medium uppercase tracking-wide">{app}</span>
            <span className="text-white/40 text-[11px]">{time}</span>
          </div>
          <p className="text-white text-[15px] font-semibold leading-tight">{title}</p>
          <p className="text-white/70 text-[13px] leading-tight mt-0.5 line-clamp-2">{message}</p>
        </div>
      </div>
    </div>
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
    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0-4c2.2 0 4 1.8 4 4h-2c0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.2 1.8-4 4-4zm0-4c3.3 0 6 2.7 6 6h-2c0-2.2-1.8-4-4-4s-4 1.8-4 4H6c0-3.3 2.7-6 6-6zm0-4c4.4 0 8 3.6 8 8h-2c0-3.3-2.7-6-6-6s-6 2.7-6 6H4c0-4.4 3.6-8 8-8z" />
    </svg>
  );
}

// Battery Indicator
function BatteryIndicator({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-white/80 text-[11px] font-medium">{percent}%</span>
      <div className="relative">
        <div className="w-[22px] h-[11px] border border-white/50 rounded-[3px] flex items-center p-[1px]">
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
