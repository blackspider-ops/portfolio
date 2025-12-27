'use client';

/**
 * Phone Share Button
 * Requirements: 8.4
 * - Generate 1080×1920 PNG with cover and title for sharing to story
 */

import { useState, useCallback } from 'react';

interface PhoneShareButtonProps {
  title: string;
  coverUrl?: string | null;
  type: 'project' | 'blog';
}

export function PhoneShareButton({ title, coverUrl, type }: PhoneShareButtonProps) {
  const [generating, setGenerating] = useState(false);

  const generateStoryImage = useCallback(async () => {
    setGenerating(true);

    try {
      // Create a canvas for the story image (1080x1920 - Instagram story dimensions)
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
      gradient.addColorStop(0, '#0A0D11');
      gradient.addColorStop(0.5, '#0E1319');
      gradient.addColorStop(1, '#0A0D11');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Add subtle grid pattern
      ctx.strokeStyle = 'rgba(91, 156, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1080; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1920);
        ctx.stroke();
      }
      for (let y = 0; y < 1920; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1080, y);
        ctx.stroke();
      }

      // Load and draw cover image if available
      if (coverUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = coverUrl;
          });

          // Draw cover image with rounded corners and shadow
          const imgX = 90;
          const imgY = 400;
          const imgWidth = 900;
          const imgHeight = 600;
          const radius = 24;

          // Shadow
          ctx.shadowColor = 'rgba(91, 156, 255, 0.3)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 10;

          // Rounded rectangle clip
          ctx.beginPath();
          ctx.moveTo(imgX + radius, imgY);
          ctx.lineTo(imgX + imgWidth - radius, imgY);
          ctx.quadraticCurveTo(imgX + imgWidth, imgY, imgX + imgWidth, imgY + radius);
          ctx.lineTo(imgX + imgWidth, imgY + imgHeight - radius);
          ctx.quadraticCurveTo(imgX + imgWidth, imgY + imgHeight, imgX + imgWidth - radius, imgY + imgHeight);
          ctx.lineTo(imgX + radius, imgY + imgHeight);
          ctx.quadraticCurveTo(imgX, imgY + imgHeight, imgX, imgY + imgHeight - radius);
          ctx.lineTo(imgX, imgY + radius);
          ctx.quadraticCurveTo(imgX, imgY, imgX + radius, imgY);
          ctx.closePath();
          ctx.save();
          ctx.clip();

          // Draw image to fill the clipped area
          const scale = Math.max(imgWidth / img.width, imgHeight / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const offsetX = imgX + (imgWidth - scaledWidth) / 2;
          const offsetY = imgY + (imgHeight - scaledHeight) / 2;
          ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
          ctx.restore();

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        } catch {
          // Continue without cover image
        }
      }

      // Type badge
      const badgeY = coverUrl ? 1100 : 700;
      ctx.fillStyle = type === 'project' ? '#5B9CFF' : '#A78BFA';
      ctx.font = 'bold 32px Inter, sans-serif';
      const badgeText = type === 'project' ? 'PROJECT' : 'BLOG POST';
      const badgeWidth = ctx.measureText(badgeText).width + 40;
      
      // Badge background
      ctx.beginPath();
      ctx.roundRect(540 - badgeWidth / 2, badgeY, badgeWidth, 50, 25);
      ctx.fill();
      
      // Badge text
      ctx.fillStyle = '#0A0D11';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, 540, badgeY + 35);

      // Title
      ctx.fillStyle = '#E8EDF2';
      ctx.font = 'bold 64px Fraunces, Playfair Display, serif';
      ctx.textAlign = 'center';
      
      // Word wrap title
      const maxWidth = 900;
      const words = title.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      // Draw title lines
      const titleY = badgeY + 120;
      const lineHeight = 80;
      lines.forEach((line, index) => {
        ctx.fillText(line, 540, titleY + index * lineHeight);
      });

      // Branding - use site URL from window location
      ctx.fillStyle = '#A1ACB7';
      ctx.font = '28px Inter, sans-serif';
      ctx.fillText(window.location.hostname || 'portfolio', 540, 1800);

      // Accent line
      const accentGradient = ctx.createLinearGradient(340, 1840, 740, 1840);
      accentGradient.addColorStop(0, '#A78BFA');
      accentGradient.addColorStop(1, '#5B9CFF');
      ctx.strokeStyle = accentGradient;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(340, 1840);
      ctx.lineTo(740, 1840);
      ctx.stroke();

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-story.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Error generating story image:', err);
    } finally {
      setGenerating(false);
    }
  }, [title, coverUrl, type]);

  return (
    <button
      onClick={generateStoryImage}
      disabled={generating}
      className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--violet)] transition-colors disabled:opacity-50"
      aria-label="Share to Story"
    >
      <ShareIcon className="w-3.5 h-3.5" />
      {generating ? 'Generating...' : 'Share'}
    </button>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}
