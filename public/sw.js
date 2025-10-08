// Minimal service worker placeholder. You can expand this later.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Cleanups for old caches can go here
  self.clients.claim();
});

// Optional: cache-first for navigation fallback (very basic)
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests optionally here or leave noop.
});
