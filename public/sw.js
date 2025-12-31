const CACHE_NAME = 'portfolio-v4';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/offline.html',
  '/icon.svg',
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache offline page first as it's critical
      await cache.addAll(PRECACHE_ASSETS);
    })()
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      // Take control of all clients immediately
      await self.clients.claim();
    })()
  );
});

// Fetch event - network first with offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Skip API routes
  if (url.pathname.startsWith('/api')) return;

  // Skip Supabase requests
  if (url.hostname.includes('supabase')) return;

  // Skip admin routes - always fetch fresh
  if (url.pathname.startsWith('/admin')) return;

  // Skip _next/webpack-hmr for dev hot reload
  if (url.pathname.includes('webpack-hmr')) return;

  // Skip Vercel analytics/insights scripts
  if (url.pathname.includes('_vercel/insights') || url.pathname.includes('_vercel/speed-insights')) return;

  // Skip external analytics scripts
  if (url.hostname.includes('vercel-scripts.com') || url.hostname.includes('cloudflareinsights.com')) return;

  event.respondWith(
    (async () => {
      // For navigation requests (page loads)
      if (request.mode === 'navigate') {
        try {
          // Try network first
          const networkResponse = await fetch(request);
          
          // Cache successful page responses
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          
          return networkResponse;
        } catch (error) {
          // Network failed, try cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // No cache, return offline page
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }

          // Last resort - return a basic offline response
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      }

      // For other requests (assets, etc.)
      try {
        const networkResponse = await fetch(request);
        
        // Cache static assets
        if (networkResponse.ok && shouldCache(url)) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // Try cache for failed requests
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        throw error;
      }
    })()
  );
});

// Determine if a URL should be cached
function shouldCache(url) {
  // Cache static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ico)$/)) {
    return true;
  }
  
  // Cache Next.js static chunks
  if (url.pathname.startsWith('/_next/static/')) {
    return true;
  }
  
  return false;
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
