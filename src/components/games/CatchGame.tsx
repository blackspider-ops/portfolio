'use client';

/**
 * Catch Game Component
 * Mini-game for the 404 page
 * Requirements: 9.3 - Render a playable mini-game on the 404 page
 * Requirements: 9.4 - Use the missing route hash as a score seed
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 300;
const PADDLE_WIDTH = 60;
const PADDLE_HEIGHT = 10;
const BLOCK_SIZE = 20;
const PADDLE_SPEED = 10;
const INITIAL_FALL_SPEED = 2;
const SPEED_INCREMENT = 0.1;
const MAX_FALL_SPEED = 8;

interface Block {
  x: number;
  y: number;
  color: string;
}

interface CatchGameState {
  paddleX: number;
  blocks: Block[];
  score: number;
  lives: number;
  isPlaying: boolean;
  isGameOver: boolean;
  fallSpeed: number;
  spawnTimer: number;
}

interface CatchGameProps {
  seed?: string;
  onScoreChange?: (score: number) => void;
}

// Simple seeded random number generator
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return () => {
    hash = Math.sin(hash) * 10000;
    return hash - Math.floor(hash);
  };
}

const COLORS = [
  'var(--blue, #5B9CFF)',
  'var(--violet, #A78BFA)',
  'var(--green, #28F07B)',
];

const getInitialState = (): CatchGameState => ({
  paddleX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
  blocks: [],
  score: 0,
  lives: 3,
  isPlaying: false,
  isGameOver: false,
  fallSpeed: INITIAL_FALL_SPEED,
  spawnTimer: 0,
});

export function CatchGame({ seed = '404', onScoreChange }: CatchGameProps) {
  const [state, setState] = useState<CatchGameState>(getInitialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number | null>(null);
  const randomRef = useRef(seededRandom(seed));

  // Reset random generator when seed changes
  useEffect(() => {
    randomRef.current = seededRandom(seed);
  }, [seed]);

  // Draw the game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'var(--bg, #0A0D11)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw paddle
    ctx.fillStyle = 'var(--blue, #5B9CFF)';
    ctx.fillRect(state.paddleX, CANVAS_HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw blocks
    state.blocks.forEach(block => {
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x, block.y, BLOCK_SIZE, BLOCK_SIZE);
    });

    // Draw UI
    ctx.fillStyle = 'var(--text, #E8EDF2)';
    ctx.font = '14px var(--font-mono, monospace)';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${state.score}`, 10, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`Lives: ${'❤️'.repeat(state.lives)}`, CANVAS_WIDTH - 10, 25);

    // Draw game over overlay
    if (state.isGameOver) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.85)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'var(--text, #E8EDF2)';
      ctx.font = '24px var(--font-mono, monospace)';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.font = '16px var(--font-mono, monospace)';
      ctx.fillText(`Final Score: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
      ctx.font = '12px var(--font-mono, monospace)';
      ctx.fillStyle = 'var(--muted, #A1ACB7)';
      ctx.fillText(`Seed: ${seed}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.fillText('Press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
    }

    // Draw start screen
    if (!state.isPlaying && !state.isGameOver) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.85)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'var(--text, #E8EDF2)';
      ctx.font = '20px var(--font-mono, monospace)';
      ctx.textAlign = 'center';
      ctx.fillText('CATCH THE BLOCKS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      ctx.font = '12px var(--font-mono, monospace)';
      ctx.fillStyle = 'var(--muted, #A1ACB7)';
      ctx.fillText('Use ← → or A/D to move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText('Catch blocks to score', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }
  }, [state, seed]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!state.isPlaying || state.isGameOver) {
      draw();
      return;
    }

    setState(prev => {
      let { paddleX, blocks, score, lives, fallSpeed, spawnTimer } = prev;

      // Handle player input
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        paddleX = Math.max(0, paddleX - PADDLE_SPEED);
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        paddleX = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, paddleX + PADDLE_SPEED);
      }

      // Spawn new blocks
      spawnTimer++;
      const spawnRate = Math.max(30, 60 - Math.floor(score / 5)); // Spawn faster as score increases
      if (spawnTimer >= spawnRate) {
        spawnTimer = 0;
        const newBlock: Block = {
          x: Math.floor(randomRef.current() * (CANVAS_WIDTH - BLOCK_SIZE)),
          y: -BLOCK_SIZE,
          color: COLORS[Math.floor(randomRef.current() * COLORS.length)],
        };
        blocks = [...blocks, newBlock];
      }

      // Update blocks
      const paddleTop = CANVAS_HEIGHT - PADDLE_HEIGHT - 10;
      const paddleBottom = paddleTop + PADDLE_HEIGHT;
      const paddleLeft = paddleX;
      const paddleRight = paddleX + PADDLE_WIDTH;

      let newScore = score;
      let newLives = lives;
      const newBlocks: Block[] = [];

      for (const block of blocks) {
        const newY = block.y + fallSpeed;
        const blockBottom = newY + BLOCK_SIZE;
        const blockLeft = block.x;
        const blockRight = block.x + BLOCK_SIZE;

        // Check if caught by paddle
        if (
          blockBottom >= paddleTop &&
          newY <= paddleBottom &&
          blockRight >= paddleLeft &&
          blockLeft <= paddleRight
        ) {
          newScore += 10;
          onScoreChange?.(newScore);
          continue; // Block is caught, don't add to newBlocks
        }

        // Check if missed (fell below screen)
        if (newY > CANVAS_HEIGHT) {
          newLives--;
          continue; // Block is missed, don't add to newBlocks
        }

        // Block is still in play
        newBlocks.push({ ...block, y: newY });
      }

      // Increase speed over time
      const newFallSpeed = Math.min(MAX_FALL_SPEED, INITIAL_FALL_SPEED + (newScore / 100) * SPEED_INCREMENT);

      // Check game over
      if (newLives <= 0) {
        return {
          ...prev,
          paddleX,
          blocks: newBlocks,
          score: newScore,
          lives: 0,
          isGameOver: true,
          isPlaying: false,
          fallSpeed: newFallSpeed,
          spawnTimer,
        };
      }

      return {
        ...prev,
        paddleX,
        blocks: newBlocks,
        score: newScore,
        lives: newLives,
        fallSpeed: newFallSpeed,
        spawnTimer,
      };
    });
  }, [state.isPlaying, state.isGameOver, draw, onScoreChange]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent arrow keys from scrolling the page when game is active
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (state.isGameOver) {
          randomRef.current = seededRandom(seed); // Reset random with same seed
          setState(getInitialState());
        } else if (!state.isPlaying) {
          setState(prev => ({ ...prev, isPlaying: true }));
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
  }, [state.isPlaying, state.isGameOver, seed]);

  // Touch controls
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!state.isPlaying || state.isGameOver) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const scaleX = CANVAS_WIDTH / rect.width;
    const targetX = touchX * scaleX - PADDLE_WIDTH / 2;
    
    setState(prev => ({
      ...prev,
      paddleX: Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, targetX)),
    }));
  }, [state.isPlaying, state.isGameOver]);

  const handleCanvasTap = useCallback(() => {
    if (state.isGameOver) {
      randomRef.current = seededRandom(seed);
      setState(getInitialState());
    } else if (!state.isPlaying) {
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [state.isPlaying, state.isGameOver, seed]);

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
        className="border border-[var(--surface)] rounded-lg touch-none"
        style={{ imageRendering: 'pixelated' }}
        onTouchMove={handleTouchMove}
        onTouchStart={(e) => {
          e.preventDefault();
          const startX = e.touches[0].clientX;
          const timeout = setTimeout(() => {}, 200);
          const handleTouchEnd = (endEvent: TouchEvent) => {
            clearTimeout(timeout);
            const endX = endEvent.changedTouches[0].clientX;
            if (Math.abs(endX - startX) < 10) {
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
          onTouchStart={() => keysRef.current.add('ArrowLeft')}
          onTouchEnd={() => keysRef.current.delete('ArrowLeft')}
          className="w-16 h-16 bg-[var(--surface)] rounded-lg flex items-center justify-center active:bg-[var(--muted)]/20"
        >
          <svg className="w-8 h-8 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleCanvasTap}
          className="w-16 h-16 bg-[var(--blue)] rounded-lg flex items-center justify-center active:opacity-80"
        >
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
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
      <div className="text-center text-sm text-[var(--muted)] font-mono sm:hidden">
        <p>Drag on screen or use buttons</p>
        <p>Tap to start</p>
      </div>
    </div>
  );
}
