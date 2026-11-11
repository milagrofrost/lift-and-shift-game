/* Bump this version whenever a precached file changes. No forced activation:
   updates wait until all windows using the old worker have closed. */
const CACHE = 'lift-shift-shell-v1';
const GAME = '/lift-and-shift.html';
const ASSETS = [GAME, '/pwa.js', '/manifest.webmanifest',
  '/assets/lift-and-shift-logo.png', '/assets/icon-192.png',
  '/assets/icon-512.png', '/assets/icon-maskable-512.png', '/assets/apple-touch-icon.png'];
const GAME_PATHS = new Set(['/', '/index', '/index.html', '/lift-and-shift', GAME]);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('lift-shift-shell-') && key !== CACHE)
    .map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const game = request.mode === 'navigate' && GAME_PATHS.has(url.pathname);
  // Never intercept reports, Functions, tests, external fonts, or unknown routes.
  if (!game && !ASSETS.includes(url.pathname)) return;
  const key = game ? GAME : url.pathname;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Network first: an online launch sees the current deployment.
      const response = await fetch(request);
      if (response.ok && response.type !== 'opaque') {
        // A root/index response is a redirect page on a static server, not the game.
        if (!game || url.pathname === GAME || url.pathname === '/lift-and-shift') {
          event.waitUntil(cache.put(key, response.clone()).catch(() => {}));
        }
        return response;
      }
      return (await cache.match(key)) || response;
    } catch (error) {
      const cached = await cache.match(key);
      if (cached) return cached;
      throw error;
    }
  })());
});
