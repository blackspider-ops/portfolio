'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameSound } from './useGameSound';
import type { GameProps } from './types';

const WIDTH = 480;
const HEIGHT = 400;
const PADDLE_W = 80;
const PADDLE_H = 12;
const BALL_R = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_W = 54;
const BRICK_H = 18;
const BRICK_GAP = 4;

interface Brick { x: number; y: number; color: string; alive: boolean; }

interface BreakoutState {
  paddleX: number;
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  bricks: Brick[];
  score: number;
  lives: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  won: boolean;
}

const COLORS = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3'];

const createBricks = (): Brick[] => {
  const bricks: Brick[] = [];
  const startX = (WIDTH - (BRICK_COLS * (BRICK_W + BRICK_GAP) - BRICK_GAP)) / 2;
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: startX + c * (BRICK_W + BRICK_GAP),
        y: 50 + r * (BRICK_H + BRICK_GAP),
        color: COLORS[r],
        alive: true,
      });
    }
  }
  return bricks;
};

const getInitialState = (): BreakoutState => ({
  paddleX: WIDTH / 2 - PADDLE_W / 2,
  ballX: WIDTH / 2,
  ballY: HEIGHT - 60,
  ballVX: 4,
  ballVY: -4,
  bricks: createBricks(),
  score: 0,
  lives: 3,
  isPlaying: false,
  isGameOver: false,
  isPaused: false,
  won: false,
});

export function BreakoutGame({ soundEnabled, onScoreChange, onGameOver }: GameProps) {
  const [state, setState] = useState<BreakoutState>(getInitialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const touchXRef = useRef<number | null>(null);
  const { playBounce, playScore, playGameOver } = useGameSound({ 
    enabled: soundEnabled, 
    isPlaying: state.isPlaying && !state.isPaused 
  });

  // Touch handlers for paddle control
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    touchXRef.current = touch.clientX - rect.left;
    
    // Tap to start/pause
    if (state.isGameOver || state.won) {
      setState(getInitialState());
    } else if (!state.isPlaying) {
      setState(s => ({ ...s, isPlaying: true }));
    }
  }, [state.isGameOver, state.won, state.isPlaying]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!state.isPlaying || state.isPaused) return;
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const touchX = (touch.clientX - rect.left) * scaleX;
    
    setState(s => ({
      ...s,
      paddleX: Math.max(0, Math.min(WIDTH - PADDLE_W, touchX - PADDLE_W / 2))
    }));
  }, [state.isPlaying, state.isPaused]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cs = getComputedStyle(document.documentElement);
    const bgColor = cs.getPropertyValue('--bg').trim() || '#0A0D11';
    const textColor = cs.getPropertyValue('--text').trim() || '#E8EDF2';
    const blueColor = cs.getPropertyValue('--blue').trim() || '#5B9CFF';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Bricks
    state.bricks.forEach(b => {
      if (b.alive) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
      }
    });

    // Paddle
    ctx.fillStyle = blueColor;
    ctx.fillRect(state.paddleX, HEIGHT - 30, PADDLE_W, PADDLE_H);

    // Ball
    ctx.fillStyle = textColor;
    ctx.beginPath();
    ctx.arc(state.ballX, state.ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();

    // Lives & Score (always visible)
    ctx.fillStyle = '#E8EDF2';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Lives: ${state.lives}`, 10, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${state.score}`, WIDTH - 10, 25);

    // Overlays
    if (state.isGameOver || state.won) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.85)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#E8EDF2';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.won ? 'YOU WIN!' : 'GAME OVER', WIDTH / 2, HEIGHT / 2 - 20);
      ctx.font = '14px monospace';
      ctx.fillText(`Score: ${state.score}`, WIDTH / 2, HEIGHT / 2 + 10);
      ctx.fillText('SPACE to restart', WIDTH / 2, HEIGHT / 2 + 35);
    } else if (state.isPaused) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.85)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#E8EDF2';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', WIDTH / 2, HEIGHT / 2);
    } else if (!state.isPlaying) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.85)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#E8EDF2';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BREAKOUT', WIDTH / 2, HEIGHT / 2 - 20);
      ctx.font = '14px monospace';
      ctx.fillText('SPACE to start', WIDTH / 2, HEIGHT / 2 + 15);
      ctx.fillText('← → or A/D to move', WIDTH / 2, HEIGHT / 2 + 40);
    }
  }, [state]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.type === 'keydown') keysRef.current.add(e.key);
      else keysRef.current.delete(e.key);

      if (e.key === ' ' && e.type === 'keydown') {
        e.preventDefault();
        if (state.isGameOver || state.won) setState(getInitialState());
        else if (!state.isPlaying) setState(s => ({ ...s, isPlaying: true }));
        else setState(s => ({ ...s, isPaused: !s.isPaused }));
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, [state.isPlaying, state.isGameOver, state.won]);

  useEffect(() => {
    const loop = () => {
      if (state.isPlaying && !state.isPaused && !state.isGameOver && !state.won) {
        setState(s => {
          let { paddleX, ballX, ballY, ballVX, ballVY, bricks, score, lives } = s;

          // Paddle movement
          if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
            paddleX = Math.max(0, paddleX - 8);
          }
          if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
            paddleX = Math.min(WIDTH - PADDLE_W, paddleX + 8);
          }

          // Ball movement
          ballX += ballVX;
          ballY += ballVY;

          // Wall collisions
          if (ballX - BALL_R <= 0 || ballX + BALL_R >= WIDTH) {
            ballVX = -ballVX;
            playBounce();
          }
          if (ballY - BALL_R <= 0) {
            ballVY = -ballVY;
            playBounce();
          }

          // Paddle collision
          if (
            ballY + BALL_R >= HEIGHT - 30 &&
            ballY + BALL_R <= HEIGHT - 30 + PADDLE_H &&
            ballX >= paddleX &&
            ballX <= paddleX + PADDLE_W
          ) {
            ballVY = -Math.abs(ballVY);
            const hitPos = (ballX - paddleX) / PADDLE_W - 0.5;
            ballVX = hitPos * 8;
            playBounce();
          }

          // Brick collisions
          let hitBrick = false;
          bricks = bricks.map(b => {
            if (b.alive &&
              ballX + BALL_R > b.x &&
              ballX - BALL_R < b.x + BRICK_W &&
              ballY + BALL_R > b.y &&
              ballY - BALL_R < b.y + BRICK_H
            ) {
              hitBrick = true;
              score += 10;
              playScore();
              onScoreChange?.(score);
              return { ...b, alive: false };
            }
            return b;
          });
          if (hitBrick) ballVY = -ballVY;

          // Check win
          if (bricks.every(b => !b.alive)) {
            playScore();
            onGameOver?.(score);
            return { ...s, paddleX, ballX, ballY, ballVX, ballVY, bricks, score, won: true, isPlaying: false };
          }

          // Ball out
          if (ballY > HEIGHT) {
            lives--;
            if (lives <= 0) {
              playGameOver();
              onGameOver?.(score);
              return { ...s, paddleX, bricks, score, lives, isGameOver: true, isPlaying: false };
            }
            return { ...s, paddleX, ballX: WIDTH / 2, ballY: HEIGHT - 60, ballVX: 4, ballVY: -4, bricks, score, lives };
          }

          return { ...s, paddleX, ballX, ballY, ballVX, ballVY, bricks, score, lives };
        });
      }
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [state, draw, playBounce, playScore, playGameOver, onScoreChange, onGameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas 
        ref={canvasRef} 
        width={WIDTH} 
        height={HEIGHT} 
        className="border border-[var(--surface)] rounded-lg touch-none max-w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      />
      {/* Touch controls for mobile */}
      <div className="flex gap-4 sm:hidden">
        <button
          onTouchStart={() => keysRef.current.add('ArrowLeft')}
          onTouchEnd={() => keysRef.current.delete('ArrowLeft')}
          className="w-16 h-16 bg-[var(--surface)] rounded-lg flex items-center justify-center active:bg-[var(--muted)]/20"
        >
          <svg className="w-8 h-8 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => {
            if (state.isGameOver || state.won) setState(getInitialState());
            else if (!state.isPlaying) setState(s => ({ ...s, isPlaying: true }));
            else setState(s => ({ ...s, isPaused: !s.isPaused }));
          }}
          className="w-16 h-16 bg-[var(--blue)] rounded-lg flex items-center justify-center active:opacity-80"
        >
          {state.isPlaying && !state.isPaused ? (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button
          onTouchStart={() => keysRef.current.add('ArrowRight')}
          onTouchEnd={() => keysRef.current.delete('ArrowRight')}
          className="w-16 h-16 bg-[var(--surface)] rounded-lg flex items-center justify-center active:bg-[var(--muted)]/20"
        >
          <svg className="w-8 h-8 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="text-center text-sm text-[var(--muted)] font-mono">
        <p className="hidden sm:block">← → or A/D to move</p>
        <p className="hidden sm:block">SPACE to start/pause</p>
        <p className="sm:hidden">Drag or use buttons to move paddle</p>
        <p className="sm:hidden">Tap to start/pause</p>
      </div>
    </div>
  );
}
