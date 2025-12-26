'use client';

import { useEffect, useState } from 'react';

export function KeyboardHints() {
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const modKey = isMac ? 'Cmd+K' : 'Ctrl+K';

  return (
    <div className="bg-surface border border-muted/20 rounded-lg p-4">
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted mb-4">SYSTEM SHORTCUTS</h3>
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-bg border border-muted/20 rounded text-xs font-mono text-text min-w-[50px] text-center">
            {modKey}
          </kbd>
          <span className="text-muted font-mono">Palette</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-bg border border-muted/20 rounded text-xs font-mono text-text min-w-[30px] text-center">
            ~
          </kbd>
          <span className="text-muted font-mono">Terminal</span>
        </div>
      </div>
    </div>
  );
}
