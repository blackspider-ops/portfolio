'use client';

/**
 * Pong Game Component
 * Classic pong game for the arcade
 * Requirements: 9.2 - Implement Pong game
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameSound } from './useGameSound';
import type { GameProps } from './types';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 8;
const INITIAL_BALL_SPEED = 5;
const BALL_SPEED_INCREMENT = 0.5;
const MAX_BALL_SPEED = 12;
const WINNING_SCORE = 5;

interface PongState {
  playerY: number;
  aiY: number;
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  playerScore: number;
  aiScore: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  winner: 'player' | 'ai' | null;
}

const getInitialState = (): PongState => ({
  playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  aiY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  ballX: CANVAS_WIDTH / 2,
  ballY: CANVAS_HEIGHT / 2,
  ballVX: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
  ballVY: INITIAL_BALL_SPEED * (Math.random() - 0.5) * 2,
  playerScore: 0,
  aiScore: 0,
  isPlaying: false,
  isGameOver: false,
  isPaused: false,
  winner: null,
});

export function PongGame({ soundEnabled, onScoreChange, onGameOver }: GameProps) {
  const [state, setState] = useState<PongState>(getInitialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number | null>(null);
  const { playBounce, playScore, playGameOver } = useGameSound({ enabled: soundEnabled, isPlaying: state.isPlaying && !state.isPaused });

  // Draw the game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get computed CSS variable values
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColor = computedStyle.getPropertyValue('--bg').trim() || '#0A0D11';
    const surfaceColor = computedStyle.getPropertyValue('--surface').trim() || '#0E1319';
    const textColor = computedStyle.getPropertyValue('--text').trim() || '#E8EDF2';
    const blueColor = computedStyle.getPropertyValue('--blue').trim() || '#5B9CFF';
    const violetColor = computedStyle.getPropertyValue('--violet').trim() || '#A78BFA';

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.strokeStyle = surfaceColor;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = blueColor;
    ctx.fillRect(20, state.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
    
    ctx.fillStyle = violetColor;
    ctx.fillRect(CANVAS_WIDTH - 30, state.aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball
    ctx.fillStyle = textColor;
    ctx.beginPath();
    ctx.arc(state.ballX, state.ballY, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw scores
    ctx.fillStyle = textColor;
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.playerScore.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(state.aiScore.toString(), (CANVAS_WIDTH * 3) / 4, 60);

    // Draw game over overlay
    if (state.isGameOver) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = textColor;
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        state.winner === 'player' ? 'YOU WIN!' : 'AI WINS!',
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 - 20
      );
      ctx.font = '16px monospace';
      ctx.fillText('Press SPACE to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }

    // Draw paused overlay
    if (state.isPaused && !state.isGameOver) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = textColor;
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    // Draw start screen
    if (!state.isPlaying && !state.isGameOver) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = textColor;
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PONG', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.font = '14px monospace';
      ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      ctx.fillText('W/S or Arrow keys to move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      ctx.fillText(`First to ${WINNING_SCORE} wins!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    }
  }, [state]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!state.isPlaying || state.isPaused || state.isGameOver) {
      draw();
      return;
    }

    setState(prev => {
      let { playerY, aiY, ballX, ballY, ballVX, ballVY, playerScore, aiScore } = prev;

      // Handle player input
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
        playerY = Math.max(0, playerY - PADDLE_SPEED);
      }
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
        playerY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, playerY + PADDLE_SPEED);
      }

      // AI movement (follows ball with some delay)
      const aiCenter = aiY + PADDLE_HEIGHT / 2;
      const aiSpeed = PADDLE_SPEED * 0.7; // AI is slightly slower
      if (ballY < aiCenter - 10) {
        aiY = Math.max(0, aiY - aiSpeed);
      } else if (ballY > aiCenter + 10) {
        aiY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, aiY + aiSpeed);
      }

      // Move ball
      ballX += ballVX;
      ballY += ballVY;

      // Ball collision with top/bottom walls
      if (ballY <= BALL_SIZE / 2 || ballY >= CANVAS_HEIGHT - BALL_SIZE / 2) {
        ballVY = -ballVY;
        ballY = ballY <= BALL_SIZE / 2 ? BALL_SIZE / 2 : CANVAS_HEIGHT - BALL_SIZE / 2;
        playBounce();
      }

      // Ball collision with player paddle
      if (
        ballX - BALL_SIZE / 2 <= 30 &&
        ballX - BALL_SIZE / 2 >= 20 &&
        ballY >= playerY &&
        ballY <= playerY + PADDLE_HEIGHT
      ) {
        const hitPos = (ballY - playerY) / PADDLE_HEIGHT;
        const angle = (hitPos - 0.5) * Math.PI * 0.5;
        const speed = Math.min(MAX_BALL_SPEED, Math.abs(ballVX) + BALL_SPEED_INCREMENT);
        ballVX = Math.abs(speed * Math.cos(angle));
        ballVY = speed * Math.sin(angle);
        ballX = 31;
        playBounce();
      }

      // Ball collision with AI paddle
      if (
        ballX + BALL_SIZE / 2 >= CANVAS_WIDTH - 30 &&
        ballX + BALL_SIZE / 2 <= CANVAS_WIDTH - 20 &&
        ballY >= aiY &&
        ballY <= aiY + PADDLE_HEIGHT
      ) {
        const hitPos = (ballY - aiY) / PADDLE_HEIGHT;
        const angle = (hitPos - 0.5) * Math.PI * 0.5;
        const speed = Math.min(MAX_BALL_SPEED, Math.abs(ballVX) + BALL_SPEED_INCREMENT);
        ballVX = -Math.abs(speed * Math.cos(angle));
        ballVY = speed * Math.sin(angle);
        ballX = CANVAS_WIDTH - 31;
        playBounce();
      }

      // Score detection
      let newPlayerScore = playerScore;
      let newAiScore = aiScore;
      let isGameOver = false;
      let winner: 'player' | 'ai' | null = null;

      if (ballX < 0) {
        // AI scores
        newAiScore = aiScore + 1;
        playScore();
        onScoreChange?.(newPlayerScore);
        
        if (newAiScore >= WINNING_SCORE) {
          isGameOver = true;
          winner = 'ai';
          playGameOver();
          onGameOver?.(newPlayerScore);
        } else {
          // Reset ball
          ballX = CANVAS_WIDTH / 2;
          ballY = CANVAS_HEIGHT / 2;
          ballVX = INITIAL_BALL_SPEED;
          ballVY = INITIAL_BALL_SPEED * (Math.random() - 0.5) * 2;
        }
      } else if (ballX > CANVAS_WIDTH) {
        // Player scores
        newPlayerScore = playerScore + 1;
        playScore();
        onScoreChange?.(newPlayerScore);
        
        if (newPlayerScore >= WINNING_SCORE) {
          isGameOver = true;
          winner = 'player';
          playGameOver();
          onGameOver?.(newPlayerScore);
        } else {
          // Reset ball
          ballX = CANVAS_WIDTH / 2;
          ballY = CANVAS_HEIGHT / 2;
          ballVX = -INITIAL_BALL_SPEED;
          ballVY = INITIAL_BALL_SPEED * (Math.random() - 0.5) * 2;
        }
      }

      return {
        ...prev,
        playerY,
        aiY,
        ballX,
        ballY,
        ballVX,
        ballVY,
        playerScore: newPlayerScore,
        aiScore: newAiScore,
        isGameOver,
        isPlaying: !isGameOver,
        winner,
      };
    });
  }, [state.isPlaying, state.isPaused, state.isGameOver, draw, playBounce, playScore, playGameOver, onScoreChange, onGameOver]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (state.isGameOver) {
          setState(getInitialState());
        } else if (!state.isPlaying) {
          setState(prev => ({ ...prev, isPlaying: true }));
        } else {
          setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
        }
        return;
      }

      keysRef.current.add(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.isPlaying, state.isGameOver]);

  // Touch controls for mobile
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!state.isPlaying || state.isPaused || state.isGameOver) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchY = touch.clientY - rect.top;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const targetY = touchY * scaleY - PADDLE_HEIGHT / 2;
    
    setState(prev => ({
      ...prev,
      playerY: Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, targetY)),
    }));
  }, [state.isPlaying, state.isPaused, state.isGameOver]);

  const handleCanvasTap = useCallback(() => {
    if (state.isGameOver) {
      setState(getInitialState());
    } else if (!state.isPlaying) {
      setState(prev => ({ ...prev, isPlaying: true }));
    } else {
      setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    }
  }, [state.isPlaying, state.isGameOver]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      gameLoop();
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop, draw]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-[var(--surface)] rounded-lg max-w-full touch-none"
        style={{ imageRendering: 'pixelated' }}
        onTouchMove={handleTouchMove}
        onTouchStart={(e) => {
          // Prevent scrolling
          e.preventDefault();
          // Check if it's a tap (not a drag)
          const startY = e.touches[0].clientY;
          const timeout = setTimeout(() => {
            // If still touching after 200ms, it's a drag not a tap
          }, 200);
          const handleTouchEnd = (endEvent: TouchEvent) => {
            clearTimeout(timeout);
            const endY = endEvent.changedTouches[0].clientY;
            if (Math.abs(endY - startY) < 10) {
              handleCanvasTap();
            }
            document.removeEventListener('touchend', handleTouchEnd);
          };
          document.addEventListener('touchend', handleTouchEnd, { once: true });
        }}
      />
      {/* Mobile controls */}
      <div className="flex gap-4 sm:hidden">
        <button
          onTouchStart={() => keysRef.current.add('ArrowUp')}
          onTouchEnd={() => keysRef.current.delete('ArrowUp')}
          className="w-16 h-16 bg-[var(--surface)] rounded-lg flex items-center justify-center active:bg-[var(--muted)]/20"
        >
          <svg className="w-8 h-8 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={handleCanvasTap}
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
          onTouchStart={() => keysRef.current.add('ArrowDown')}
          onTouchEnd={() => keysRef.current.delete('ArrowDown')}
          className="w-16 h-16 bg-[var(--surface)] rounded-lg flex items-center justify-center active:bg-[var(--muted)]/20"
        >
          <svg className="w-8 h-8 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <div className="text-center text-sm text-[var(--muted)] font-mono">
        <p className="hidden sm:block">W/S or Arrow keys to move</p>
        <p className="hidden sm:block">SPACE to start/pause</p>
        <p className="sm:hidden">Drag on screen or use buttons</p>
        <p className="sm:hidden">Tap to start/pause</p>
      </div>
    </div>
  );
}
