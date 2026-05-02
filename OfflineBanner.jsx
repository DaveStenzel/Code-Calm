/**
 * OfflineBanner.jsx
 *
 * A non-intrusive status strip that appears at the top of the app when:
 *   – the device is offline (red-ish)
 *   – data was served from cache (amber, gentler)
 *   – a new app version is ready (blue)
 *
 * Design rules: minimal, warm, never alarming. One line. Tap to dismiss cached-data notice.
 */

import React from 'react';

export function OfflineBanner({ isOffline, isStale, pendingWrites, updateReady, applyUpdate }) {
  if (!isOffline && !isStale && !updateReady) return null;

  if (updateReady) {
    return (
      <div style={styles.banner('#E6F1FB', '#0C447C')}>
        <span style={styles.dot('#185FA5')} />
        <span style={styles.text}>A new version is ready.</span>
        <button onClick={applyUpdate} style={styles.action('#185FA5')}>Reload</button>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div style={styles.banner('#FFF3E0', '#633806')}>
        <span style={styles.dot('#854F0B')} />
        <span style={styles.text}>
          You're offline. Your activities are still available.
          {pendingWrites > 0 && ` ${pendingWrites} ${pendingWrites === 1 ? 'entry' : 'entries'} will sync when you reconnect.`}
        </span>
      </div>
    );
  }

  if (isStale) {
    return (
      <div style={styles.banner('#F1EFE8', '#444441')}>
        <span style={styles.dot('#888780')} />
        <span style={styles.text}>Showing saved data — some info may be out of date.</span>
      </div>
    );
  }

  return null;
}

const styles = {
  banner: (bg, color) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: bg,
    color,
    fontSize: '13px',
    lineHeight: 1.4,
    borderBottom: '0.5px solid rgba(0,0,0,0.08)',
  }),
  dot: color => ({
    display: 'inline-block',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }),
  text: {
    flex: 1,
  },
  action: color => ({
    background: 'none',
    border: `0.5px solid ${color}`,
    borderRadius: '999px',
    padding: '2px 10px',
    fontSize: '12px',
    color,
    cursor: 'pointer',
    flexShrink: 0,
  }),
};


/**
 * useFetchWithOffline(url, options)
 *
 * Drop-in replacement for fetch() calls in the app's data layer.
 * Detects the X-Served-From-Cache header the service worker sets
 * and calls markStale() so the banner appears.
 */
export function useFetchWithOffline(markStale) {
  return async function fetchWithOffline(url, options = {}) {
    const response = await fetch(url, options);
    if (response.headers.get('X-Served-From-Cache') === 'true') {
      markStale();
    }
    return response;
  };
}
