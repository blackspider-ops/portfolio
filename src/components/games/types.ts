/**
 * Game Types
 * Shared types for arcade games
 */

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  score: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
}

export interface GameProps {
  soundEnabled: boolean;
  onScoreChange?: (score: number) => void;
  onGameOver?: (score: number) => void;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
