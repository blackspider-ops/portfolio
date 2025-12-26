'use client';

interface NowPanelProps {
  items: string[];
}

export function NowPanel({ items }: NowPanelProps) {
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' }).toUpperCase();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface border border-muted/20 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted">CURRENT FOCUS</h3>
        <span className="text-xs text-muted font-mono">{currentMonth}</span>
      </div>
      
      {/* Items */}
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="mt-1.5 flex-shrink-0">
              <span className="block w-1.5 h-1.5 rounded-full bg-green" />
            </span>
            <span className="text-text text-sm leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-muted/10">
        <div className="flex items-center gap-2 text-xs text-muted font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-muted/40" />
          <span>ACTIVE_PROTOCOLS</span>
        </div>
      </div>
    </div>
  );
}
