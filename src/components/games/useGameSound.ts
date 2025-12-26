'use client';

/**
 * Game Sound Hook
 * Handles sound effects for games with reduced motion support
 * Requirements: 9.2, 9.5 - Sound OFF by default, respect prefers-reduced-motion
 */

import { useCallback, useEffect, useState, useRef } from 'react';

interface UseGameSoundOptions {
  enabled: boolean;
  isPlaying?: boolean;
}

interface GameSounds {
  playBeep: () => void;
  playScore: () => void;
  playGameOver: () => void;
  playBounce: () => void;
}

export function useGameSound({ enabled, isPlaying = false }: UseGameSoundOptions): GameSounds {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const bgMusicRef = useRef<{ oscillators: OscillatorNode[]; gains: GainNode[] } | null>(null);
  const isPlayingRef = useRef(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Initialize audio context on first user interaction
  useEffect(() => {
    if (!enabled || prefersReducedMotion) return;

    const initAudio = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        setAudioContext(ctx);
      }
    };

    // Initialize on any user interaction
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, [enabled, prefersReducedMotion, audioContext]);

  // Background retro game music - only when game is playing
  useEffect(() => {
    if (!audioContext || !enabled || prefersReducedMotion || !isPlaying) {
      // Stop music if disabled or game not playing
      if (bgMusicRef.current) {
        bgMusicRef.current.gains.forEach(gain => {
          try {
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext?.currentTime || 0 + 0.1);
          } catch {}
        });
        setTimeout(() => {
          bgMusicRef.current?.oscillators.forEach(osc => {
            try { osc.stop(); } catch {}
          });
          bgMusicRef.current = null;
          isPlayingRef.current = false;
        }, 100);
      }
      return;
    }

    if (isPlayingRef.current) return;

    // Create retro chiptune style music
    const createRetroMusic = () => {
      const oscillators: OscillatorNode[] = [];
      const gains: GainNode[] = [];
      
      // Main melody oscillator
      const melodyOsc = audioContext.createOscillator();
      const melodyGain = audioContext.createGain();
      const melodyFilter = audioContext.createBiquadFilter();
      
      melodyOsc.type = 'square';
      melodyFilter.type = 'lowpass';
      melodyFilter.frequency.setValueAtTime(2000, audioContext.currentTime);
      
      melodyOsc.connect(melodyFilter);
      melodyFilter.connect(melodyGain);
      melodyGain.connect(audioContext.destination);
      melodyGain.gain.setValueAtTime(0.06, audioContext.currentTime);
      
      // Bass oscillator
      const bassOsc = audioContext.createOscillator();
      const bassGain = audioContext.createGain();
      
      bassOsc.type = 'triangle';
      bassOsc.connect(bassGain);
      bassGain.connect(audioContext.destination);
      bassGain.gain.setValueAtTime(0.08, audioContext.currentTime);
      
      // Simple retro melody pattern (C major pentatonic)
      const melodyNotes = [262, 294, 330, 392, 440, 392, 330, 294]; // C4, D4, E4, G4, A4...
      const bassNotes = [131, 131, 165, 165, 196, 196, 165, 165]; // C3, C3, E3, E3, G3...
      
      let noteIndex = 0;
      const tempo = 0.25; // seconds per note
      
      const playNote = () => {
        if (!isPlayingRef.current) return;
        
        const now = audioContext.currentTime;
        const melodyNote = melodyNotes[noteIndex % melodyNotes.length];
        const bassNote = bassNotes[noteIndex % bassNotes.length];
        
        melodyOsc.frequency.setValueAtTime(melodyNote, now);
        bassOsc.frequency.setValueAtTime(bassNote, now);
        
        // Add slight volume envelope for each note
        melodyGain.gain.setValueAtTime(0.06, now);
        melodyGain.gain.exponentialRampToValueAtTime(0.03, now + tempo * 0.8);
        
        noteIndex++;
        setTimeout(playNote, tempo * 1000);
      };
      
      melodyOsc.start();
      bassOsc.start();
      oscillators.push(melodyOsc, bassOsc);
      gains.push(melodyGain, bassGain);
      
      isPlayingRef.current = true;
      playNote();
      
      bgMusicRef.current = { oscillators, gains };
    };

    createRetroMusic();

    return () => {
      isPlayingRef.current = false;
      if (bgMusicRef.current) {
        bgMusicRef.current.gains.forEach(gain => {
          try {
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
          } catch {}
        });
        setTimeout(() => {
          bgMusicRef.current?.oscillators.forEach(osc => {
            try { osc.stop(); } catch {}
          });
          bgMusicRef.current = null;
        }, 100);
      }
    };
  }, [audioContext, enabled, prefersReducedMotion, isPlaying]);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'square') => {
    if (!audioContext || !enabled || prefersReducedMotion) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch {
      // Audio playback failed, ignore silently
    }
  }, [audioContext, enabled, prefersReducedMotion]);

  const playBeep = useCallback(() => {
    playTone(440, 0.1);
  }, [playTone]);

  const playScore = useCallback(() => {
    playTone(880, 0.15, 'sine');
  }, [playTone]);

  const playGameOver = useCallback(() => {
    playTone(220, 0.3, 'sawtooth');
  }, [playTone]);

  const playBounce = useCallback(() => {
    playTone(330, 0.05);
  }, [playTone]);

  return {
    playBeep,
    playScore,
    playGameOver,
    playBounce,
  };
}
