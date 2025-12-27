'use client';

import { motion } from 'framer-motion';

interface ControlCenterProps {
  onClose: () => void;
  brightness: number;
  setBrightness: (v: number) => void;
  volume: number;
  setVolume: (v: number) => void;
  wifiOn: boolean;
  setWifiOn: (v: boolean) => void;
  bluetoothOn: boolean;
  setBluetoothOn: (v: boolean) => void;
  airplaneMode: boolean;
  setAirplaneMode: (v: boolean) => void;
}

export function ControlCenter({
  onClose,
  brightness,
  setBrightness,
  volume,
  setVolume,
  wifiOn,
  setWifiOn,
  bluetoothOn,
  setBluetoothOn,
  airplaneMode,
  setAirplaneMode,
}: ControlCenterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-xl z-40"
      onClick={onClose}
    >
      <div 
        className="p-4 pt-16"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top row - Connectivity */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Network group */}
          <div className="bg-white/10 rounded-3xl p-3 space-y-3">
            <div className="flex gap-2">
              <ToggleButton
                active={airplaneMode}
                onClick={() => setAirplaneMode(!airplaneMode)}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                }
                color="orange"
              />
              <ToggleButton
                active={wifiOn && !airplaneMode}
                onClick={() => setWifiOn(!wifiOn)}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0-4c2.2 0 4 1.8 4 4h-2c0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.2 1.8-4 4-4zm0-4c3.3 0 6 2.7 6 6h-2c0-2.2-1.8-4-4-4s-4 1.8-4 4H6c0-3.3 2.7-6 6-6zm0-4c4.4 0 8 3.6 8 8h-2c0-3.3-2.7-6-6-6s-6 2.7-6 6H4c0-4.4 3.6-8 8-8z"/>
                  </svg>
                }
                color="blue"
              />
            </div>
            <div className="flex gap-2">
              <ToggleButton
                active={bluetoothOn && !airplaneMode}
                onClick={() => setBluetoothOn(!bluetoothOn)}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
                  </svg>
                }
                color="blue"
              />
              <ToggleButton
                active={false}
                onClick={() => {}}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                }
                color="green"
              />
            </div>
          </div>

          {/* Media group */}
          <div className="bg-white/10 rounded-3xl p-3 space-y-3">
            <div className="flex gap-2">
              <ToggleButton
                active={false}
                onClick={() => {}}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                }
                color="pink"
              />
              <ToggleButton
                active={false}
                onClick={() => {}}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                  </svg>
                }
                color="green"
              />
            </div>
            <div className="flex gap-2">
              <ToggleButton
                active={true}
                onClick={() => {}}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                }
                color="green"
              />
              <ToggleButton
                active={false}
                onClick={() => {}}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                }
                color="purple"
              />
            </div>
          </div>
        </div>

        {/* Sliders row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Brightness */}
          <div className="bg-white/10 rounded-3xl p-4 h-32 relative overflow-hidden">
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white/30 transition-all"
              style={{ height: `${brightness}%` }}
            />
            <input
              type="range"
              min="20"
              max="100"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
            />
            <svg className="w-6 h-6 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
            </svg>
          </div>

          {/* Volume */}
          <div className="bg-white/10 rounded-3xl p-4 h-32 relative overflow-hidden">
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white/30 transition-all"
              style={{ height: `${volume}%` }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
            />
            <svg className="w-6 h-6 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-4 gap-3">
          <SquareButton
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/>
              </svg>
            }
            label="Flashlight"
          />
          <SquareButton
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            }
            label="Timer"
          />
          <SquareButton
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            }
            label="Calculator"
          />
          <SquareButton
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            }
            label="Camera"
          />
        </div>
      </div>
    </motion.div>
  );
}

function ToggleButton({ 
  active, 
  onClick, 
  icon, 
  color 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    pink: 'bg-pink-500',
    purple: 'bg-purple-500',
  };

  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
        active ? colorClasses[color] : 'bg-white/20'
      }`}
    >
      <span className={active ? 'text-white' : 'text-white/60'}>
        {icon}
      </span>
    </button>
  );
}

function SquareButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="bg-white/10 rounded-2xl p-3 flex flex-col items-center gap-1">
      <span className="text-white">{icon}</span>
      <span className="text-white/60 text-[9px]">{label}</span>
    </button>
  );
}
