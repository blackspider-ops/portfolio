'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameSound } from './useGameSound';
import type { GameProps } from './types';

const WIDTH = 400;
const HEIGHT = 500;
const BIRD_SIZE = 24;
const PIPE_W = 50;
const PIPE_GAP = 140;
const GRAVITY = 0.5;
const JUMP = -8;
const PIPE_SPEED = 3;

interface Pipe { x: number; gapY: number; passed: boolean; }

interface FlappyState {
  birdY: number;
  birdVY: number;
  pipes: Pipe[];
  score: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
}

const getInitialState = (): FlappyState => ({
  birdY: HEIGHT / 2,
  birdVY: 0,
  pipes: [],
  score: 0,
  isPlaying: false,
  isGameOver: false,
  isPaused: false,
});

export function FlappyGame({ soundEnabled, onScoreChange, onGameOver }: GameProps) {
  const [state, setState] = useState<FlappyState>(getInitialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const { playBounce, playScore, playGameOver } = useGameSound({ 
    enabled: soundEnabled, 
    isPlaying: state.isPlaying && !state.isPaused 
  });

  const jump = useCallback(() => {
    if (state.isGameOver) {
      setState(getInitialState());
      return;
    }
    if (!state.isPlaying) {
      setState(s => ({ ...s, isPlaying: true }));
      return;
    }
    if (state.isPaused) return;
    setState(s => ({ ...s, birdVY: JUMP }));
    playBounce();
  }, [state.isPlaying, state.isGameOver, state.isPaused, playBounce]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cs = getComputedStyle(document.documentElement);
    const bgColor = cs.getPropertyValue('--bg').trim() || '#0A0D11';
    const greenColor = cs.getPropertyValue('--green').trim() || '#28F07B';
    const blueColor = cs.getPropertyValue('--blue').trim() || '#5B9CFF';
    const violetColor = cs.getPropertyValue('--violet').trim() || '#A78BFA';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Pipes
    ctx.fillStyle = greenColor;
    state.pipes.forEach(p => {
      // Top pipe
      ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
      // Bottom pipe
      ctx.fillRect(p.x, p.gapY + PIPE_GAP, PIPE_W, HEIGHT - p.gapY - PIPE_GAP);
    });

    // Bird
    const birdX = 80;
    ctx.fillStyle = blueColor;
    ctx.beginPath();
    ctx.arc(birdX, state.birdY, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(birdX + 6, state.birdY - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    // Wing
    ctx.fillStyle = violetColor;
    ctx.beginPath();
    ctx.ellipse(birdX - 8, state.birdY + 2, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Score (always visible)
    ctx.fillStyle = '#E8EDF2';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.score.toString(), WIDTH / 2, 40);

    // Overlays
    if (state.isGameOver) {
      ctx.fillStyle = 'rgba(10, 13, 17, 0.85)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#E8EDF2';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 20);
      ctx.font = '14px monospace';
      ctx.fillText(`Score: ${state.score}`, WIDTH / 2, HEIGHT / 2 + 10);
      ctx.fillText('SPACE or Click to restart', WIDTH / 2, HEIGHT / 2 + 35);
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
      ctx.fillText('FLAPPY', WIDTH / 2, HEIGHT / 2 - 30);
      ctx.font = '14px monospace';
      ctx.fillText('SPACE or Click to start', WIDTH / 2, HEIGHT / 2 + 10);
      ctx.fillText('Press P to pause', WIDTH / 2, HEIGHT / 2 + 35);
    }
  }, [state]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        jump();
      }
      if (e.key === 'p' || e.key === 'P') {
        if (state.isPlaying && !state.isGameOver) {
          setState(s => ({ ...s, isPaused: !s.isPaused }));
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [jump, state.isPlaying, state.isGameOver]);

  useEffect(() => {
    const loop = () => {
      frameRef.current++;
      
      if (state.isPlaying && !state.isPaused && !state.isGameOver) {
        setState(s => {
          let { birdY, birdVY, pipes, score } = s;
          const birdX = 80;

          // Gravity
          birdVY += GRAVITY;
          birdY += birdVY;

          // Spawn pipes
          if (frameRef.current % 90 === 0) {
            const gapY = 80 + Math.random() * (HEIGHT - PIPE_GAP - 160);
            pipes = [...pipes, { x: WIDTH, gapY, passed: false }];
          }

          // Move pipes
          pipes = pipes.map(p => ({ ...p, x: p.x - PIPE_SPEED })).filter(p => p.x > -PIPE_W);

          // Score
          pipes = pipes.map(p => {
            if (!p.passed && p.x + PIPE_W < birdX) {
              score++;
              playScore();
              onScoreChange?.(score);
              return { ...p, passed: true };
            }
            return p;
          });

          // Collision detection
          const hitGround = birdY + BIRD_SIZE / 2 > HEIGHT || birdY - BIRD_SIZE / 2 < 0;
          const hitPipe = pipes.some(p => {
            const inPipeX = birdX + BIRD_SIZE / 2 > p.x && birdX - BIRD_SIZE / 2 < p.x + PIPE_W;
            const inGap = birdY - BIRD_SIZE / 2 > p.gapY && birdY + BIRD_SIZE / 2 < p.gapY + PIPE_GAP;
            return inPipeX && !inGap;
          });

          if (hitGround || hitPipe) {
            playGameOver();
            onGameOver?.(score);
            return { ...s, birdY, birdVY, pipes, score, isGameOver: true, isPlaying: false };
          }

          return { ...s, birdY, birdVY, pipes, score };
        });
      }
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [state, draw, playScore, playGameOver, onScoreChange, onGameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas 
        ref={canvasRef} 
        width={WIDTH} 
        height={HEIGHT} 
        className="border border-[var(--surface)] rounded-lg cursor-pointer"
        onClick={jump}
      />
      <div className="text-center text-sm text-[var(--muted)] font-mono">
        <p>SPACE or Click to flap</p>
        <p>P to pause</p>
      </div>
    </div>
  );
}
