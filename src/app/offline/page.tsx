import type { Metadata } from 'next';

// Static metadata - no database calls for offline page
export const metadata: Metadata = {
  title: 'Offline',
  description: 'You are currently offline',
};

// Force static generation so this page can be cached
export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#1e1e2e] flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[#6b7280]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          You&apos;re Offline
        </h1>
        
        <p className="text-[#6b7280] mb-6">
          It looks like you&apos;ve lost your internet connection. Some features may be unavailable until you&apos;re back online.
        </p>

        <div className="space-y-3">
          <a
            href="/"
            className="block w-full px-4 py-2 bg-[#3b82f6] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Try Again
          </a>
          
          <p className="text-xs text-[#6b7280]">
            Cached pages may still be available
          </p>
        </div>
      </div>
    </div>
  );
}
