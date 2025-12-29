'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavigationWrapper } from '@/components/navigation';
import { createClient } from '@/lib/supabase/client';
import { useFeatureEnabled } from '@/lib/hooks/useFeatureToggles';
import { SnakeGame } from '@/components/games/SnakeGame';
import { PongGame } from '@/components/games/PongGame';
import { TetrisGame } from '@/components/games/TetrisGame';
import { BreakoutGame } from '@/components/games/BreakoutGame';
import { FlappyGame } from '@/components/games/FlappyGame';

type GameType = 'snake' | 'pong' | 'tetris' | 'breakout' | 'flappy';

interface GameConfig {
  enabled: boolean;
  name: string;
  emoji: string;
}

interface GamesConfig {
  snake: GameConfig;
  pong: GameConfig;
  tetris: GameConfig;
  breakout: GameConfig;
  flappy: GameConfig;
}

const DEFAULT_GAMES_CONFIG: GamesConfig = {
  snake: { enabled: true, name: 'Snake', emoji: '🐍' },
  pong: { enabled: true, name: 'Pong', emoji: '🏓' },
  tetris: { enabled: true, name: 'Tetris', emoji: '🧱' },
  breakout: { enabled: true, name: 'Breakout', emoji: '🧱' },
  flappy: { enabled: true, name: 'Flappy', emoji: '🐦' },
};

export default function PlayPage() {
  const router = useRouter();
  const gamesEnabled = useFeatureEnabled('games');
  const [gamesConfig, setGamesConfig] = useState<GamesConfig>(DEFAULT_GAMES_CONFIG);
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const supabase = createClient();

  // Redirect to home if games feature is disabled
  useEffect(() => {
    if (!gamesEnabled) {
      router.replace('/');
    }
  }, [gamesEnabled, router]);

  // Fetch games config from database
  useEffect(() => {
    async function fetchGamesConfig() {
      const { data } = await supabase
        .from('site_settings')
        .select('games_config')
        .single();
      
      if (data?.games_config) {
        const config = data.games_config as unknown as GamesConfig;
        setGamesConfig({ ...DEFAULT_GAMES_CONFIG, ...config });
      }
    }
    fetchGamesConfig();
  }, [supabase]);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) setSoundEnabled(false);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleSoundToggle = () => {
    if (!prefersReducedMotion) {
      setSoundEnabled(prev => !prev);
    }
  };

  const enabledGames = Object.entries(gamesConfig).filter(([_, cfg]) => cfg.enabled) as [GameType, GameConfig][];

  // Don't render if games feature is disabled (will redirect)
  if (!gamesEnabled) {
    return null;
  }

  if (enabledGames.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <NavigationWrapper />
        <main className="lg:ml-[92px] p-4 lg:p-8">
          <div className="max-w-4xl mx-auto text-center py-20">
            <h1 className="text-4xl font-heading font-bold mb-4">Arcade</h1>
            <p className="text-[var(--muted)]">No games are currently enabled.</p>
          </div>
        </main>
      </div>
    );
  }

  const gameColors: Record<GameType, string> = {
    snake: 'var(--green)',
    pong: 'var(--violet)',
    tetris: 'var(--blue)',
    breakout: 'var(--orange)',
    flappy: 'var(--yellow)',
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <NavigationWrapper />
      
      <main className="lg:ml-[92px] p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-heading font-bold mb-2">
              <span className="bg-gradient-to-r from-[var(--violet)] to-[var(--blue)] bg-clip-text text-transparent">
                Arcade
              </span>
            </h1>
            <p className="text-[var(--muted)] font-mono text-sm">You found the secret! 🎮</p>
            <p className="text-[var(--muted)] text-xs mt-1">(Hint: Konami code brought you here)</p>
          </div>

          {/* Game Selection */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {enabledGames.map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedGame(key)}
                className={`px-5 py-2.5 rounded-lg font-mono text-sm transition-all ${
                  selectedGame === key
                    ? 'text-[var(--bg)]'
                    : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface)]/80'
                }`}
                style={selectedGame === key ? { backgroundColor: gameColors[key] } : {}}
              >
                {config.emoji} {config.name}
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleSoundToggle}
              disabled={prefersReducedMotion}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                prefersReducedMotion
                  ? 'bg-[var(--surface)]/50 text-[var(--muted)] cursor-not-allowed'
                  : soundEnabled
                  ? 'bg-[var(--green)]/20 text-[var(--green)] border border-[var(--green)]/30'
                  : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
              title={prefersReducedMotion ? 'Sound disabled due to reduced motion preference' : ''}
            >
              {soundEnabled ? '🔊' : '🔇'}
              <span>Sound {soundEnabled ? 'ON' : 'OFF'}</span>
            </button>
            {prefersReducedMotion && (
              <span className="ml-2 text-xs text-[var(--muted)] self-center">(disabled: reduced motion)</span>
            )}
          </div>

          {/* Game Container - responsive with overflow handling */}
          <div className="flex justify-center pb-20 lg:pb-0">
            <div className="bg-[var(--surface)] p-4 sm:p-6 rounded-xl border border-[var(--surface)] max-w-full overflow-x-auto">
              {!selectedGame ? (
                <div className="flex items-center justify-center min-h-[400px] min-w-[300px]">
                  <p className="text-[var(--muted)] font-mono text-sm">Select a game to play ↑</p>
                </div>
              ) : (
                <>
                  {selectedGame === 'snake' && gamesConfig.snake.enabled && (
                    <SnakeGame soundEnabled={soundEnabled && !prefersReducedMotion} />
                  )}
                  {selectedGame === 'pong' && gamesConfig.pong.enabled && (
                    <PongGame soundEnabled={soundEnabled && !prefersReducedMotion} />
                  )}
                  {selectedGame === 'tetris' && gamesConfig.tetris.enabled && (
                    <TetrisGame soundEnabled={soundEnabled && !prefersReducedMotion} />
                  )}
                  {selectedGame === 'breakout' && gamesConfig.breakout.enabled && (
                    <BreakoutGame soundEnabled={soundEnabled && !prefersReducedMotion} />
                  )}
                  {selectedGame === 'flappy' && gamesConfig.flappy.enabled && (
                    <FlappyGame soundEnabled={soundEnabled && !prefersReducedMotion} />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-8 pb-4 text-center">
            <a href="/" className="text-[var(--muted)] hover:text-[var(--text)] font-mono text-sm transition-colors">
              ← Back to portfolio
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
