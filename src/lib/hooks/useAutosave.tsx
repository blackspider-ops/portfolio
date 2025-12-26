import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  interval?: number; // Default: 5000ms (5 seconds)
  enabled?: boolean;
}

interface UseAutosaveReturn {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  save: () => Promise<void>;
}

export function useAutosave<T>({
  data,
  onSave,
  interval = 5000,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveReturn {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const previousDataRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;

    const currentDataString = JSON.stringify(data);
    
    // Don't save if data hasn't changed
    if (currentDataString === previousDataRef.current) {
      return;
    }

    isSavingRef.current = true;
    setStatus('saving');

    try {
      await onSave(data);
      previousDataRef.current = currentDataString;
      setLastSaved(new Date());
      setStatus('saved');
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Autosave error:', error);
      setStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave]);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for autosave
    timeoutRef.current = setTimeout(() => {
      save();
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, interval, enabled, save]);

  // Initialize previous data on mount
  useEffect(() => {
    previousDataRef.current = JSON.stringify(data);
  }, []);

  return {
    status,
    lastSaved,
    save,
  };
}

// Autosave status indicator component
export function AutosaveIndicator({
  status,
  lastSaved,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
}) {
  if (status === 'idle' && !lastSaved) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'saving' && (
        <>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-[var(--muted)]">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-green-400">Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-2 h-2 bg-red-400 rounded-full" />
          <span className="text-red-400">Error saving</span>
        </>
      )}
      {status === 'idle' && lastSaved && (
        <span className="text-[var(--muted)]">
          Last saved {formatRelativeTime(lastSaved)}
        </span>
      )}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);

  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  return date.toLocaleTimeString();
}
