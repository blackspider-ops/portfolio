'use client';

import { useEffect, useRef } from 'react';

interface MatrixRainProps {
  isActive: boolean;
  onClose: () => void;
}

export function MatrixRain({ isActive, onClose }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Matrix characters (katakana + numbers + symbols)
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*()';
    const charArray = chars.split('');

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Array to track y position of each column
    const drops: number[] = Array(columns).fill(1);
    
    // Randomize initial positions
    for (let i = 0; i < drops.length; i++) {
      drops[i] = Math.random() * -100;
    }

    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Brighter green for the head of the stream
        if (Math.random() > 0.98) {
          ctx.fillStyle = '#FFF';
        } else {
          ctx.fillStyle = `rgba(0, 255, 65, ${0.8 + Math.random() * 0.2})`;
        }
        
        ctx.fillText(char, x, y);

        // Reset drop to top with random delay
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        drops[i]++;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Auto-close after 10 seconds
    const timeout = setTimeout(() => {
      onClose();
    }, 10000);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(timeout);
    };
  }, [isActive, onClose]);

  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] cursor-pointer"
      onClick={onClose}
      role="button"
      aria-label="Close matrix effect"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-black"
      />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-green-500 font-mono text-sm animate-pulse">
        Click anywhere or wait to exit the Matrix...
      </div>
    </div>
  );
}
