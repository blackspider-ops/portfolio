'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameSound } from './useGameSound';
import type { GameProps } from './types';

const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 24;

const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[1, 0, 0], [1, 1, 1]], // L
  [[0, 0, 1], [1, 1, 1]], // J
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
];

const COLORS = ['#00f5ff', '#ffeb3b', '#e040fb', '#ff9800', '#2196f3', '#4caf50', '#f44336'];

interface Piece {
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

interface TetrisState {
  board: (string | null)[][];
  piece: Piece | null;
  nextPiece: Piece;
  score: number;
  lines: number;
  level: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
}

const createPiece = (): Piece => {
  const idx = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[idx],
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[idx][0].length / 2),
    y: 0,
    color: COLORS[idx],
  };
};

const createBoard = (): (string | null)[][] =>
  Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

const getInitialState = (): TetrisState => ({
  board: createBoard(),
  piece: null,
  nextPiece: createPiece(),
  score: 0,
  lines: 0,
  level: 1,
  isPlaying: false,
  isGameOver: false,
  isPaused: false,
});

export function TetrisGame({ soundEnabled, onScoreChange, onGameOver }: GameProps) {
  const [state, setState] = useState<TetrisState>(getInitialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastDropRef = useRef<number>(0);
  const { playScore, playGameOver } = useGameSound({ 
    enabled: soundEnabled, 
    isPlaying: state.isPlaying && !state.isPaused 
  });

  const collides = useCallback((board: (string | null)[][], piece: Piece, offsetX = 0, offsetY = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
          if (newY >= 0 && board[newY][newX]) return true;
        }
      }
    }
    return false;
  }, []);

  const mergePiece = useCallback((board: (string | null)[][], piece: Piece): (string | null)[][] => {
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] && piece.y + y >= 0) {
          newBoard[piece.y + y][piece.x + x] = piece.color;
        }
      }
    }
    return newBoard;
  }, []);

  const clearLines = useCallback((board: (string | null)[][]): { board: (string | null)[][]; cleared: number } => {
    const newBoard = board.filter(row => row.some(cell => !cell));
    const cleared = ROWS - newBoard.length;
    while (newBoard.length < ROWS) {
      newBoard.unshift(Array(COLS).fill(null));
    }
    return { board: newBoard, cleared };
  }, []);

  const rotate = useCallback((piece: Piece): Piece => {
    const newShape = piece.shape[0].map((_, i) =>
      piece.shape.map(row => row[i]).reverse()
    );
    return { ...piece, shape: newShape };
  }, []);


  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cs = getComputedStyle(document.documentElement);
    const bgColor = cs.getPropertyValue('--bg').trim() || '#0A0D11';
    const surfaceColor = cs.getPropertyValue('--surface').trim() || '#0E1319';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = surfaceColor;
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(COLS * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, ROWS * CELL_SIZE);
      ctx.stroke();
    }

    // Draw board
    state.board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          ctx.fillStyle = cell;
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }
      });
    });

    // Draw current piece
    if (state.piece) {
      ctx.fillStyle = state.piece.color;
      state.piece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            ctx.fillRect(
              (state.piece!.x + x) * CELL_SIZE + 1,
              (state.piece!.y + y) * CELL_SIZE + 1,
              CELL_SIZE - 2,
              CELL_SIZE - 2
            );
          }
        });
      });
    }

    // Overlays
    if (state.isGameOver) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#E8EDF2';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '14px monospace';
      ctx.fillText(`Score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('SPACE to restart', canvas.width / 2, canvas.height / 2 + 35);
    } else if (state.isPaused) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#E8EDF2';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    } else if (!state.isPlaying) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#E8EDF2';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TETRIS', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '14px monospace';
      ctx.fillText('SPACE to start', canvas.width / 2, canvas.height / 2 + 15);
    }
  }, [state]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (state.isGameOver) setState(getInitialState());
        else if (!state.isPlaying) setState(s => ({ ...s, isPlaying: true, piece: s.nextPiece, nextPiece: createPiece() }));
        else setState(s => ({ ...s, isPaused: !s.isPaused }));
        return;
      }
      if (!state.isPlaying || state.isPaused || state.isGameOver || !state.piece) return;

      // Prevent arrow keys from scrolling the page
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      setState(s => {
        if (!s.piece) return s;
        if (e.key === 'ArrowLeft' && !collides(s.board, s.piece, -1, 0)) {
          return { ...s, piece: { ...s.piece, x: s.piece.x - 1 } };
        }
        if (e.key === 'ArrowRight' && !collides(s.board, s.piece, 1, 0)) {
          return { ...s, piece: { ...s.piece, x: s.piece.x + 1 } };
        }
        if (e.key === 'ArrowDown' && !collides(s.board, s.piece, 0, 1)) {
          return { ...s, piece: { ...s.piece, y: s.piece.y + 1 } };
        }
        if (e.key === 'ArrowUp') {
          const rotated = rotate(s.piece);
          if (!collides(s.board, rotated)) return { ...s, piece: rotated };
        }
        return s;
      });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.isPlaying, state.isPaused, state.isGameOver, state.piece, collides, rotate]);

  useEffect(() => {
    const loop = (time: number) => {
      if (state.isPlaying && !state.isPaused && !state.isGameOver && state.piece) {
        const speed = Math.max(100, 500 - state.level * 50);
        if (time - lastDropRef.current > speed) {
          lastDropRef.current = time;
          setState(s => {
            if (!s.piece) return s;
            if (!collides(s.board, s.piece, 0, 1)) {
              return { ...s, piece: { ...s.piece, y: s.piece.y + 1 } };
            }
            // Lock piece
            let newBoard = mergePiece(s.board, s.piece);
            const { board: clearedBoard, cleared } = clearLines(newBoard);
            const newScore = s.score + cleared * 100 * s.level;
            const newLines = s.lines + cleared;
            const newLevel = Math.floor(newLines / 10) + 1;
            if (cleared > 0) { playScore(); onScoreChange?.(newScore); }
            
            const newPiece = s.nextPiece;
            if (collides(clearedBoard, newPiece)) {
              playGameOver();
              onGameOver?.(newScore);
              return { ...s, board: clearedBoard, piece: null, score: newScore, lines: newLines, level: newLevel, isGameOver: true, isPlaying: false };
            }
            return { ...s, board: clearedBoard, piece: newPiece, nextPiece: createPiece(), score: newScore, lines: newLines, level: newLevel };
          });
        }
      }
      draw();
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [state, draw, collides, mergePiece, clearLines, playScore, playGameOver, onScoreChange, onGameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full max-w-[240px] text-sm font-mono text-[var(--muted)]">
        <span>Score: {state.score}</span>
        <span>Level: {state.level}</span>
      </div>
      <canvas ref={canvasRef} width={COLS * CELL_SIZE} height={ROWS * CELL_SIZE} className="border border-[var(--surface)] rounded-lg" />
      <div className="text-center text-sm text-[var(--muted)] font-mono">
        <p>← → Move | ↑ Rotate | ↓ Drop</p>
        <p>SPACE to start/pause</p>
      </div>
    </div>
  );
}
