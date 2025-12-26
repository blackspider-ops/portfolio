export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-[var(--accent-border)] rounded-full" />
          <div className="absolute inset-0 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-[var(--muted)] text-sm font-mono">Loading...</p>
      </div>
    </div>
  );
}
