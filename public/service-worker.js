/**
 * service-worker.js
 * Offline-first service worker for First Responder Wellness App
 *
 * Strategy summary:
 *   - STATIC SHELL  → Cache First  (app UI, icons, fonts)
 *   - ACTIVITY DATA → Cache First  (pre-cached at install, updated in background)
 *   - API READS     → Network First with Cache Fallback
 *   - API WRITES    → Queue → Background Sync → replay when online
 */

const APP_VERSION = 'v1.0.0';
const STATIC_CACHE  = `wellness-static-${APP_VERSION}`;
const CONTENT_CACHE = `wellness-content-${APP_VERSION}`;
const API_CACHE     = `wellness-api-${APP_VERSION}`;
const SYNC_QUEUE    = 'wellness-sync-queue';

/* ─── Assets pre-cached at install ─────────────────────────────────────── */

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // CSS / JS bundles (Vite/CRA emit hashed filenames – update via build hook)
  '/assets/main.css',
  '/assets/main.js',
];

/**
 * All activity content is bundled as JSON so it is available offline
 * the very first time the app loads (no separate network round-trip needed).
 * The Base44 backend still serves the canonical copy; this is the fallback.
 */
const CONTENT_ASSETS = [
  '/data/activities.json',      // breathing, meditation, relaxation, journal prompts
  '/data/affirmations.json',    // post-session affirming messages
  '/data/support-resources.json', // crisis line numbers & URLs (no need to fetch at runtime)
];

/* ─── Install: pre-cache everything ────────────────────────────────────── */

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(CONTENT_CACHE).then(cache => cache.addAll(CONTENT_ASSETS)),
    ]).then(() => self.skipWaiting()) // activate immediately, don't wait for old SW to die
  );
});

/* ─── Activate: evict caches from previous versions ────────────────────── */

self.addEventListener('activate', event => {
  const KEEP = [STATIC_CACHE, CONTENT_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !KEEP.includes(k))
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

/* ─── Fetch: route by resource type ────────────────────────────────────── */

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests – they are handled by the sync queue below
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (analytics, CDN assets we don't control)
  if (url.origin !== self.location.origin &&
      !url.hostname.includes('base44.app')) return;

  // 1. Activity / affirmation content → Cache First
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(cacheFirst(request, CONTENT_CACHE));
    return;
  }

  // 2. Base44 API reads (journal entries, mood logs) → Network First
  if (url.hostname.includes('base44.app') || url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithFallback(request, API_CACHE));
    return;
  }

  // 3. Static shell (HTML, CSS, JS, icons) → Cache First
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

/* ─── Strategies ─────────────────────────────────────────────────────────*/

/**
 * Cache First — serve from cache; refresh cache in background if network available.
 * Used for static assets and bundled activity content.
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Stale-while-revalidate: update the cache entry quietly in the background
    fetchAndCache(request, cache).catch(() => {}); // fire-and-forget; never blocks
    return cached;
  }

  // Nothing in cache yet – try network, cache the result, or serve offline page
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // For navigation requests, show the offline shell
    if (request.mode === 'navigate') {
      const offline = await caches.match('/offline.html');
      if (offline) return offline;
    }
    return new Response('Offline – content not yet cached', { status: 503 });
  }
}

/**
 * Network First with Cache Fallback — always try the network first.
 * Used for API reads so users see fresh data when online.
 * If the network fails, serve the last-known cached response.
 */
async function networkFirstWithFallback(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request, { signal: AbortSignal.timeout(6000) });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      // Attach a custom header so the React app can show an "offline – viewing cached data" banner
      const headers = new Headers(cached.headers);
      headers.set('X-Served-From-Cache', 'true');
      return new Response(cached.body, { status: cached.status, headers });
    }
    return new Response(JSON.stringify({ error: 'offline', data: [] }), {
      status: 200, // return 200 so the app can degrade gracefully rather than error
      headers: { 'Content-Type': 'application/json', 'X-Served-From-Cache': 'true' },
    });
  }
}

/** Helper: fetch and update a cache entry silently. */
async function fetchAndCache(request, cache) {
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

/* ─── Background Sync: queue offline writes ─────────────────────────────*/

/**
 * The React app calls postMessage({ type: 'QUEUE_WRITE', payload }) when
 * saving a journal entry or mood log while offline.
 * We persist it to IndexedDB and register a sync tag.
 */
self.addEventListener('message', event => {
  if (event.data?.type === 'QUEUE_WRITE') {
    queueWrite(event.data.payload).then(() => {
      // Register a Background Sync so the write is replayed when connectivity returns.
      // Falls back to immediate retry if Background Sync API is unavailable.
      if ('SyncManager' in self) {
        self.registration.sync.register(SYNC_QUEUE).catch(() => replayQueue());
      } else {
        replayQueue();
      }
    });
  }
});

self.addEventListener('sync', event => {
  if (event.tag === SYNC_QUEUE) {
    event.waitUntil(replayQueue());
  }
});

/** Replay all queued writes against the Base44 API. */
async function replayQueue() {
  const db = await openDB();
  const items = await getAllQueued(db);

  const results = await Promise.allSettled(
    items.map(item =>
      fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json', ...item.headers },
        body: JSON.stringify(item.body),
      }).then(res => {
        if (res.ok) return deleteQueued(db, item.id);
        throw new Error(`HTTP ${res.status}`);
      })
    )
  );

  // Notify all open app tabs of the sync result so they can refresh their UI
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => client.postMessage({
    type: 'SYNC_COMPLETE',
    succeeded: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
  }));
}

/* ─── IndexedDB helpers for the offline write queue ─────────────────────*/

const DB_NAME    = 'wellness-sw-db';
const DB_VERSION = 1;
const STORE      = 'pending-writes';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function queueWrite(payload) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).add({
      ...payload,
      queuedAt: Date.now(),
    });
    req.onsuccess = resolve;
    req.onerror   = e => reject(e.target.error);
  }));
}

function getAllQueued(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function deleteQueued(db, id) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id);
    req.onsuccess = resolve;
    req.onerror   = e => reject(e.target.error);
  });
}
