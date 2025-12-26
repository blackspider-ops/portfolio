'use client';

/**
 * Snake Game Component
 * Classic snake game for the arcade
 * Requirements: 9.2 - Implement Snake game
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameSound } from './useGameSound';
import type { Position, Direction, GameProps } from './types';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;
const MIN_SPEED = 50;

interface SnakeGameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  speed: number;
}

const getInitialState = (): SnakeGameState => ({
  snake: [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ],
  food: { x: 15, y: 10 },
  direction: 'RIGHT',
  nextDirection: 'RIGHT',
  score: 0,
  isPlaying: false,
  isGameOver: false,
  isPaused: false,
  speed: INITIAL_SPEED,
});

const generateFood = (snake: Position[]): Position => {
  let newFood: Position;
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
  return newFood;
};

export function SnakeGame({ soundEnabled, onScoreChange, onGameOver }: GameProps) {
  const [state, setState] = useState<SnakeGameState>(getInitialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const { playScore, playGameOver } = useGameSound({ enabled: soundEnabled, isPlaying: state.isPlaying && !state.isPaused });

  // Report score changes via useEffect to avoid setState during render
  const prevScoreRef = useRef(state.score);
  useEffect(() => {
    if (state.score !== prevScoreRef.current) {
      prevScoreRef.current = state.score;
      onScoreChange?.(state.score);
    }
  }, [state.score, onScoreChange]);

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
    const greenColor = computedStyle.getPropertyValue('--green').trim() || '#28F07B';
    const blueColor = computedStyle.getPropertyValue('--blue').trim() || '#5B9CFF';
    const violetColor = computedStyle.getPropertyValue('--violet').trim() || '#A78BFA';

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = surfaceColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = greenColor;
    ctx.beginPath();
    ctx.arc(
      state.food.x * CELL_SIZE + CELL_SIZE / 2,
      state.food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw snake
    state.snake.forEach((segment, index) => {
      const isHead = index === 0;
      const isTail = index === state.snake.length - 1;
      
      if (isHead) {
        // Draw head as a rounded rectangle with eyes
        ctx.fillStyle = blueColor;
        const x = segment.x * CELL_SIZE + 1;
        const y = segment.y * CELL_SIZE + 1;
        const w = CELL_SIZE - 2;
        const h = CELL_SIZE - 2;
        const r = 6;
        
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
        
        // Draw eyes based on direction
        ctx.fillStyle = bgColor;
        const eyeSize = 3;
        const eyeOffset = 5;
        
        if (state.direction === 'RIGHT') {
          ctx.beginPath();
          ctx.arc(x + w - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.arc(x + w - eyeOffset, y + h - eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        } else if (state.direction === 'LEFT') {
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.arc(x + eyeOffset, y + h - eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        } else if (state.direction === 'UP') {
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.arc(x + w - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + h - eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.arc(x + w - eyeOffset, y + h - eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Draw body segments as connected rounded pieces
        const prevSegment = state.snake[index - 1];
        const nextSegment = state.snake[index + 1];
        
        // Gradient from violet to a darker shade towards tail
        const alpha = 1 - (index / state.snake.length) * 0.4;
        ctx.fillStyle = violetColor;
        ctx.globalAlpha = alpha;
        
        const cx = segment.x * CELL_SIZE + CELL_SIZE / 2;
        const cy = segment.y * CELL_SIZE + CELL_SIZE / 2;
        const radius = isTail ? (CELL_SIZE / 2 - 4) : (CELL_SIZE / 2 - 2);
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Connect to previous segment
        if (prevSegment) {
          const pcx = prevSegment.x * CELL_SIZE + CELL_SIZE / 2;
          const pcy = prevSegment.y * CELL_SIZE + CELL_SIZE / 2;
          
          ctx.fillStyle = violetColor;
          ctx.beginPath();
          
          if (prevSegment.x !== segment.x) {
            // Horizontal connection
            const minX = Math.min(cx, pcx);
            const maxX = Math.max(cx, pcx);
            ctx.fillRect(minX, cy - radius, maxX - minX, radius * 2);
          } else {
            // Vertical connection
            const minY = Math.min(cy, pcy);
            const maxY = Math.max(cy, pcy);
            ctx.fillRect(cx - radius, minY, radius * 2, maxY - minY);
          }
        }
        
        ctx.globalAlpha = 1;
      }
    });

    // Draw game over overlay
    if (state.isGameOver) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = textColor;
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '16px monospace';
      ctx.fillText(`Score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 40);
    }

    // Draw paused overlay
    if (state.isPaused && !state.isGameOver) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = textColor;
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }

    // Draw start screen
    if (!state.isPlaying && !state.isGameOver) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = textColor;
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SNAKE', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '14px monospace';
      ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText('Arrow keys to move', canvas.width / 2, canvas.height / 2 + 45);
    }
  }, [state]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!state.isPlaying || state.isPaused || state.isGameOver) return;

    setState(prev => {
      const newDirection = prev.nextDirection;
      const head = prev.snake[0];
      let newHead: Position;

      switch (newDirection) {
        case 'UP':
          newHead = { x: head.x, y: head.y - 1 };
          break;
        case 'DOWN':
          newHead = { x: head.x, y: head.y + 1 };
          break;
        case 'LEFT':
          newHead = { x: head.x - 1, y: head.y };
          break;
        case 'RIGHT':
          newHead = { x: head.x + 1, y: head.y };
          break;
      }

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        playGameOver();
        onGameOver?.(prev.score);
        return { ...prev, isGameOver: true, isPlaying: false };
      }

      // Check self collision
      if (prev.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        playGameOver();
        onGameOver?.(prev.score);
        return { ...prev, isGameOver: true, isPlaying: false };
      }

      const newSnake = [newHead, ...prev.snake];
      let newFood = prev.food;
      let newScore = prev.score;
      let newSpeed = prev.speed;

      // Check food collision
      if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
        newFood = generateFood(newSnake);
        newScore = prev.score + 10;
        newSpeed = Math.max(MIN_SPEED, prev.speed - SPEED_INCREMENT);
        playScore();
      } else {
        newSnake.pop();
      }

      return {
        ...prev,
        snake: newSnake,
        food: newFood,
        direction: newDirection,
        score: newScore,
        speed: newSpeed,
      };
    });
  }, [state.isPlaying, state.isPaused, state.isGameOver, playScore, playGameOver, onGameOver]);

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

      if (!state.isPlaying || state.isPaused || state.isGameOver) return;

      const directionMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
      };

      const newDirection = directionMap[e.key];
      if (!newDirection) return;

      // Prevent 180-degree turns
      const opposites: Record<Direction, Direction> = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT',
      };

      setState(prev => {
        if (opposites[newDirection] === prev.direction) return prev;
        return { ...prev, nextDirection: newDirection };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPlaying, state.isPaused, state.isGameOver]);

  // Game loop interval
  useEffect(() => {
    if (state.isPlaying && !state.isPaused && !state.isGameOver) {
      gameLoopRef.current = window.setInterval(gameLoop, state.speed);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [state.isPlaying, state.isPaused, state.isGameOver, state.speed, gameLoop]);

  // Draw on state change
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[400px] px-2">
        <span className="font-mono text-sm text-[var(--muted)]">Score: {state.score}</span>
        <span className="font-mono text-sm text-[var(--muted)]">
          {state.isPaused ? 'PAUSED' : state.isPlaying ? 'PLAYING' : 'READY'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        className="border border-[var(--surface)] rounded-lg"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="text-center text-sm text-[var(--muted)] font-mono">
        <p>Arrow keys or WASD to move</p>
        <p>SPACE to start/pause</p>
      </div>
    </div>
  );
}
