/* Bump this version whenever a precached file changes. A new worker takes over right away (skipWaiting) but
   never reloads or messages a page, so a running game is untouched; it only answers the next fetch.
   v2: v1 cached Cloudflare's 308 redirect (/lift-and-shift.html -> /lift-and-shift) and served it back, which
   Safari refuses ("Response served by service worker has redirections"), so the game wouldn't open. */
const CACHE = 'lift-shift-shell-v2';
const GAME = '/lift-and-shift.html';
const ASSETS = [GAME, '/pwa.js', '/manifest.webmanifest',
  '/assets/lift-and-shift-logo.png', '/assets/icon-192.png',
  '/assets/icon-512.png', '/assets/icon-maskable-512.png', '/assets/apple-touch-icon.png'];
const GAME_PATHS = new Set(['/', '/index', '/index.html', '/lift-and-shift', GAME]);
// Safari won't show a response that went through a redirect if a service worker hands it over, so anything cached
// is stored as a plain copy without the redirect history.
const clean = async response => response.redirected
  ? new Response(await response.blob(), {status: response.status, statusText: response.statusText, headers: response.headers})
  : response;
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(ASSETS.map(async path => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    await cache.put(path, await clean(response));
  }))));
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
      // A server redirect (Cloudflare's /lift-and-shift.html -> /lift-and-shift): let the browser follow it.
      if (response.type === 'opaqueredirect') return response;
      if (response.ok && response.type !== 'opaque') {
        // A root/index response is a redirect page on a static server, not the game.
        if (!game || url.pathname === GAME || url.pathname === '/lift-and-shift') {
          event.waitUntil(clean(response.clone()).then(copy => cache.put(key, copy)).catch(() => {}));
        }
        return response;
      }
      const cached = await cache.match(key);
      return cached ? clean(cached) : response;
    } catch (error) {
      const cached = await cache.match(key);
      if (cached) return clean(cached);
      throw error;
    }
  })());
});
