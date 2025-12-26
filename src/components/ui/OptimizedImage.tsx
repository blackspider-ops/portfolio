'use client';

/**
 * Optimized Image Component
 * Wrapper around Next.js Image for consistent optimization
 * Requirements: 14.4 - Serve images in WebP/AVIF format with srcset
 */

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage component that uses Next.js Image optimization
 * - Automatically serves WebP/AVIF formats
 * - Generates responsive srcset
 * - Lazy loads by default
 * - Handles loading and error states
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // If there's an error, show a placeholder
  if (hasError) {
    return (
      <div 
        className={`bg-[var(--surface)] flex items-center justify-center ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <span className="text-[var(--muted)] text-sm">Failed to load image</span>
      </div>
    );
  }

  // Common props for the Image component
  const imageProps = {
    src,
    alt,
    quality,
    sizes,
    priority,
    onLoad: handleLoad,
    onError: handleError,
    className: `${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`,
    ...(placeholder === 'blur' && blurDataURL ? { placeholder, blurDataURL } : {}),
  };

  if (fill) {
    return (
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 bg-[var(--surface)] animate-pulse" />
        )}
        <Image
          {...imageProps}
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-[var(--surface)] animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      <Image
        {...imageProps}
        width={width || 800}
        height={height || 600}
      />
    </div>
  );
}

/**
 * Cover image component optimized for blog posts and projects
 * Uses fill mode with aspect ratio container
 */
export function CoverImage({
  src,
  alt,
  aspectRatio = '16/9',
  priority = false,
  className = '',
}: {
  src: string;
  alt: string;
  aspectRatio?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div 
      className={`relative w-full overflow-hidden rounded-xl ${className}`}
      style={{ aspectRatio }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
      />
    </div>
  );
}
