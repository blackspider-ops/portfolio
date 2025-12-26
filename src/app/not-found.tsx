'use client';

/**
 * 404 Not Found Page
 * Playable mini-game on the 404 page
 * Requirements: 9.3 - Render a playable mini-game on the 404 page
 * Requirements: 9.4 - Use the missing route hash as a score seed
 * Requirements: 14.3 - Lazy-load games
 */

import { useEffect, useState, lazy, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Lazy load game components - Requirement 14.3
const SnakeGame = lazy(() => import('@/components/games/SnakeGame').then(mod => ({ default: mod.SnakeGame })));
const PongGame = lazy(() => import('@/components/games/PongGame').then(mod => ({ default: mod.PongGame })));
const TetrisGame = lazy(() => import('@/components/games/TetrisGame').then(mod => ({ default: mod.TetrisGame })));
const BreakoutGame = lazy(() => import('@/components/games/BreakoutGame').then(mod => ({ default: mod.BreakoutGame })));
const FlappyGame = lazy(() => import('@/components/games/FlappyGame').then(mod => ({ default: mod.FlappyGame })));

type GameType = 'snake' | 'pong' | 'tetris' | 'breakout' | 'flappy';

interface GamesConfig {
  snake?: { enabled: boolean };
  pong?: { enabled: boolean };
  tetris?: { enabled: boolean };
  breakout?: { enabled: boolean };
  flappy?: { enabled: boolean };
}

// Loading fallback for the game
function GameLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[300px] min-w-[300px]">
      <div className="text-[var(--muted)] font-mono text-sm animate-pulse">
        Loading game...
      </div>
    </div>
  );
}

export default function NotFound() {
  const [seed, setSeed] = useState('404');
  const [highScore, setHighScore] = useState(0);
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);

  // Get enabled games and pick one randomly
  useEffect(() => {
    const loadGameConfig = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('site_settings')
          .select('games_config')
          .single();

        const gamesConfig = data?.games_config as GamesConfig | null;
        const enabledGames: GameType[] = [];

        if (gamesConfig) {
          if (gamesConfig.snake?.enabled) enabledGames.push('snake');
          if (gamesConfig.pong?.enabled) enabledGames.push('pong');
          if (gamesConfig.tetris?.enabled) enabledGames.push('tetris');
          if (gamesConfig.breakout?.enabled) enabledGames.push('breakout');
          if (gamesConfig.flappy?.enabled) enabledGames.push('flappy');
        }

        // If no games enabled, default to snake
        if (enabledGames.length === 0) {
          enabledGames.push('snake');
        }

        // Pick a random game
        const randomGame = enabledGames[Math.floor(Math.random() * enabledGames.length)];
        setSelectedGame(randomGame);
      } catch {
        // Default to snake on error
        setSelectedGame('snake');
      }
    };

    loadGameConfig();
  }, []);

  // Get the path from the URL to use as seed - Requirement 9.4
  useEffect(() => {
    const path = window.location.pathname;
    const hash = path.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0).toString(36);
    setSeed(hash || '404');

    try {
      const stored = localStorage.getItem('404-high-score');
      if (stored) {
        setHighScore(parseInt(stored, 10));
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleScoreChange = (score: number) => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('404-high-score', score.toString());
      } catch {
        // localStorage unavailable
      }
    }
  };

  const renderGame = () => {
    if (!selectedGame) return <GameLoadingFallback />;

    const gameProps = { seed, onScoreChange: handleScoreChange, soundEnabled: false };

    switch (selectedGame) {
      case 'snake':
        return <SnakeGame {...gameProps} />;
      case 'pong':
        return <PongGame {...gameProps} />;
      case 'tetris':
        return <TetrisGame {...gameProps} />;
      case 'breakout':
        return <BreakoutGame {...gameProps} />;
      case 'flappy':
        return <FlappyGame {...gameProps} />;
      default:
        return <SnakeGame {...gameProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-heading font-bold mb-2">
          <span className="bg-gradient-to-r from-[var(--violet)] to-[var(--blue)] bg-clip-text text-transparent">
            404
          </span>
        </h1>
        <p className="text-xl text-[var(--muted)] mb-2">Page not found</p>
        <p className="text-sm text-[var(--muted)]">
          But hey, while you&apos;re here... play a game! 🎮
        </p>
      </div>

      <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--surface)] mb-6">
        <Suspense fallback={<GameLoadingFallback />}>
          {renderGame()}
        </Suspense>
      </div>

      <div className="text-center mb-6">
        <p className="text-sm text-[var(--muted)] font-mono">
          High Score: <span className="text-[var(--green)]">{highScore}</span>
        </p>
        <p className="text-xs text-[var(--muted)] mt-1">
          Seed: <code className="bg-[var(--surface)] px-1 rounded">{seed}</code>
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-[var(--blue)] text-[var(--bg)] rounded-lg font-mono text-sm hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
        <Link
          href="/play"
          className="px-6 py-3 bg-[var(--surface)] text-[var(--text)] rounded-lg font-mono text-sm hover:bg-[var(--surface)]/80 transition-colors"
        >
          More Games
        </Link>
      </div>
    </div>
  );
}
