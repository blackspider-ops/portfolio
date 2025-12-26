export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-[var(--surface)] rounded-lg animate-pulse mb-4" />
          <div className="h-5 w-72 bg-[var(--surface)] rounded animate-pulse" />
        </div>

        {/* Blog post cards skeleton */}
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <article
              key={i}
              className="phantom-panel p-6 animate-pulse"
            >
              <div className="flex gap-4">
                {/* Cover image skeleton */}
                <div className="hidden sm:block w-32 h-24 bg-[var(--surface)] rounded-lg flex-shrink-0" />
                
                <div className="flex-1 space-y-3">
                  {/* Title */}
                  <div className="h-6 w-3/4 bg-[var(--surface)] rounded" />
                  
                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-[var(--surface)] rounded" />
                    <div className="h-4 w-2/3 bg-[var(--surface)] rounded" />
                  </div>
                  
                  {/* Meta */}
                  <div className="flex gap-4">
                    <div className="h-4 w-24 bg-[var(--surface)] rounded" />
                    <div className="h-4 w-20 bg-[var(--surface)] rounded" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
