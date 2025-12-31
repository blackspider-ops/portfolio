'use client';

interface Signal {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SignalsRowProps {
  signals?: Signal[];
}

export function SignalsRow({ signals }: SignalsRowProps) {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" data-nosnippet>
      {signals.map((signal) => (
        <div
          key={signal.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 
                     bg-transparent border border-muted/20 rounded 
                     text-[11px] text-muted font-mono uppercase tracking-wide
                     hover:border-muted/40 hover:text-text 
                     transition-all duration-200 cursor-default"
        >
          {signal.icon && <span>{signal.icon}</span>}
          <span>{signal.label}</span>
        </div>
      ))}
    </div>
  );
}
