'use client';

import { useEffect, useState, useRef } from 'react';

interface GitHubStats {
  stars: number;
  lastCommit: string | null;
}

interface LiveStatsCardProps {
  githubUsername?: string;
}

function useCountUp(target: number, duration: number = 1500): number {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [target, duration]);

  return count;
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function LiveStatsCard({ githubUsername }: LiveStatsCardProps) {
  const [stats, setStats] = useState<GitHubStats>({ stars: 0, lastCommit: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const animatedStars = useCountUp(stats.stars);

  useEffect(() => {
    async function fetchStats() {
      if (!githubUsername) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/github-stats?username=${githubUsername}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError('Unable to load stats');
        setStats({ stars: 0, lastCommit: null });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [githubUsername]);

  return (
    <div className="bg-surface border border-muted/20 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted">LIVE STATS</h3>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green" />
          <span className="text-xs text-green font-mono">ONLINE</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {/* GitHub Stars */}
        <div className="flex items-center justify-between py-2 border-b border-muted/10">
          <span className="text-muted flex items-center gap-2 text-sm font-mono">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            STARS
          </span>
          <span className="font-mono text-lg text-text tabular-nums">
            {loading ? '--' : animatedStars}
          </span>
        </div>

        {/* Last Commit */}
        <div className="flex items-center justify-between py-2">
          <span className="text-muted flex items-center gap-2 text-sm font-mono">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            LAST_COMMIT
          </span>
          <span className="font-mono text-sm text-text">
            {loading ? '--' : formatRelativeTime(stats.lastCommit)}
          </span>
        </div>
      </div>
    </div>
  );
}
