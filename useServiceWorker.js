/**
 * useServiceWorker.js
 *
 * Registers the service worker and exposes:
 *   isOffline      – true when the device has no network
 *   isStale        – true when the current view was served from cache
 *   pendingWrites  – count of journal/mood entries queued but not yet synced
 *   queueWrite()   – save a write for later sync
 *   updateReady    – true when a new SW version is waiting
 *   applyUpdate()  – reload to apply the new version
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useServiceWorker() {
  const [isOffline, setIsOffline]       = useState(!navigator.onLine);
  const [isStale, setIsStale]           = useState(false);
  const [pendingWrites, setPendingWrites] = useState(0);
  const [updateReady, setUpdateReady]   = useState(false);
  const swReg = useRef(null);

  /* ── Register SW on mount ── */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}service-worker.js`)
      .then(reg => {
        swReg.current = reg;

        // A new SW version has been downloaded and is waiting to activate
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.statechange === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      })
      .catch(err => console.warn('[SW] Registration failed:', err));

    // Listen for messages from the service worker
    const onMessage = ({ data }) => {
      if (!data) return;
      if (data.type === 'SYNC_COMPLETE') {
        // Writes were flushed – decrement pending count
        setPendingWrites(prev => Math.max(0, prev - (data.succeeded ?? 0)));
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);

  /* ── Track online / offline state ── */
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => {
      setIsOffline(false);
      setIsStale(false);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  /* ── Queue an offline write (journal entry, mood log) ── */
  const queueWrite = useCallback(({ url, method = 'POST', headers = {}, body }) => {
    if (!navigator.serviceWorker.controller) {
      // SW not controlling page yet – fall through to normal fetch
      return fetch(url, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    }

    // Send to SW for queuing
    navigator.serviceWorker.controller.postMessage({
      type: 'QUEUE_WRITE',
      payload: { url, method, headers, body },
    });
    setPendingWrites(prev => prev + 1);
    // Resolve immediately so the UI can optimistically update
    return Promise.resolve({ ok: true, queued: true });
  }, []);

  /* ── Mark current data as stale (called by data-fetching layer) ── */
  const markStale = useCallback(() => setIsStale(true), []);

  /* ── Apply a waiting update ── */
  const applyUpdate = useCallback(() => {
    swReg.current?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }, []);

  return { isOffline, isStale, pendingWrites, queueWrite, markStale, updateReady, applyUpdate };
}
