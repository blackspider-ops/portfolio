export default function ProjectsLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-10 w-40 bg-[var(--surface)] rounded-lg animate-pulse mb-4" />
          <div className="h-5 w-80 bg-[var(--surface)] rounded animate-pulse" />
        </div>

        {/* Featured project skeleton */}
        <div className="phantom-panel p-6 mb-8 animate-pulse">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2 h-64 bg-[var(--surface)] rounded-lg" />
            <div className="flex-1 space-y-4">
              <div className="h-4 w-20 bg-[var(--blue)]/20 rounded" />
              <div className="h-8 w-3/4 bg-[var(--surface)] rounded" />
              <div className="h-4 w-full bg-[var(--surface)] rounded" />
              <div className="h-4 w-2/3 bg-[var(--surface)] rounded" />
              <div className="flex gap-2 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 w-16 bg-[var(--surface)] rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Project grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <article
              key={i}
              className="phantom-panel overflow-hidden animate-pulse"
            >
              {/* Cover */}
              <div className="h-40 bg-[var(--surface)]" />
              
              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="h-6 w-3/4 bg-[var(--surface)] rounded" />
                <div className="h-4 w-full bg-[var(--surface)] rounded" />
                <div className="flex gap-2">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-5 w-14 bg-[var(--surface)] rounded-full" />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
