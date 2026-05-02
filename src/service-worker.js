/**
 * service-worker.js  (source — processed by vite-plugin-pwa)
 *
 * self.__WB_MANIFEST is replaced at build time with the full list of
 * Vite-built assets including their hashed filenames, so the cache
 * never goes stale after a deploy.
 */

const APP_VERSION = 'v1.0.1';
const STATIC_CACHE  = `wellness-static-${APP_VERSION}`;
const CONTENT_CACHE = `wellness-content-${APP_VERSION}`;
const API_CACHE     = `wellness-api-${APP_VERSION}`;
const SYNC_QUEUE    = 'wellness-sync-queue';

// Injected by vite-plugin-pwa: all hashed JS/CSS/HTML from the Vite build
const STATIC_ASSETS = (self.__WB_MANIFEST || []).map(e => e.url);

const CONTENT_ASSETS = [
  '/data/activities.json',
  '/data/affirmations.json',
  '/data/support-resources.json',
];

/* ─── Install ───────────────────────────────────────────────────────────── */

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(CONTENT_CACHE).then(cache => cache.addAll(CONTENT_ASSETS)),
    ]).then(() => self.skipWaiting())
  );
});

/* ─── Activate ──────────────────────────────────────────────────────────── */

self.addEventListener('activate', event => {
  const KEEP = [STATIC_CACHE, CONTENT_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !KEEP.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ─── Fetch ─────────────────────────────────────────────────────────────── */

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin !== self.location.origin &&
      !url.hostname.includes('base44.app')) return;

  if (url.pathname.startsWith('/data/')) {
    event.respondWith(cacheFirst(request, CONTENT_CACHE));
    return;
  }

  if (url.hostname.includes('base44.app') || url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithFallback(request, API_CACHE));
    return;
  }

  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

/* ─── Strategies ────────────────────────────────────────────────────────── */

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    fetchAndCache(request, cache).catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    if (request.mode === 'navigate') {
      const offline = await caches.match('/offline.html');
      if (offline) return offline;
    }
    return new Response('Offline – content not yet cached', { status: 503 });
  }
}

async function networkFirstWithFallback(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request, { signal: AbortSignal.timeout(6000) });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set('X-Served-From-Cache', 'true');
      return new Response(cached.body, { status: cached.status, headers });
    }
    return new Response(JSON.stringify({ error: 'offline', data: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Served-From-Cache': 'true' },
    });
  }
}

async function fetchAndCache(request, cache) {
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

/* ─── Background Sync ───────────────────────────────────────────────────── */

self.addEventListener('message', event => {
  if (event.data?.type === 'QUEUE_WRITE') {
    queueWrite(event.data.payload).then(() => {
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

  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => client.postMessage({
    type: 'SYNC_COMPLETE',
    succeeded: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
  }));
}

/* ─── IndexedDB ─────────────────────────────────────────────────────────── */

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
    const req = tx.objectStore(STORE).add({ ...payload, queuedAt: Date.now() });
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
