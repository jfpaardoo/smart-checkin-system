import { lazy } from 'react';

/**
 * Wraps dynamic component imports with automatic reload/retry logic.
 * Solves the Webpack "Loading chunk XX failed" (ChunkLoadError) that occurs
 * when new versions are deployed to the server and client holds stale chunks.
 */
export const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const hasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('retry-lazy-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('retry-lazy-refreshed', 'false');
      return component;
    } catch (error) {
      console.warn("Chunk loading error detected, attempting auto-recovery:", error);
      if (!hasBeenForceRefreshed) {
        // Mark that we are reloading to avoid an infinite reload loop
        window.sessionStorage.setItem('retry-lazy-refreshed', 'true');
        if ('caches' in window) {
          try {
            const keys = await window.caches.keys();
            await Promise.all(keys.map(key => window.caches.delete(key)));
          } catch (e) {
            console.warn("Could not purge caches during recovery:", e);
          }
        }
        window.location.reload();
        return { default: () => null };
      }
      // If already reloaded once and still failing, propagate to ErrorBoundary
      throw error;
    }
  });

export default lazyWithRetry;
