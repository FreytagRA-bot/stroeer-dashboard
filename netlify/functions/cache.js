/**
 * cache.js — In-Memory Cache für Netlify Functions
 *
 * Netlify Functions können zwischen Invokations cachen (warm Lambda).
 * Der Cache ist kein persistenter Store – er lebt in der Lambda-Instanz.
 * Bei Cold Starts wird er neu befüllt.
 *
 * Strategie:
 * - Cache ist gültig für MAX_AGE_MS Millisekunden
 * - Bei Fehler: letzter bekannter Stand wird zurückgegeben (stale-while-revalidate)
 */

const MAX_AGE_MS = 30 * 60 * 1000; // 30 Minuten

let cache = {
  data: null,
  fetchedAt: null,
  error: null,
};

export function getCached() {
  return {
    data: cache.data,
    fetchedAt: cache.fetchedAt,
    isStale: cache.fetchedAt
      ? Date.now() - cache.fetchedAt.getTime() > MAX_AGE_MS
      : true,
    error: cache.error,
  };
}

export function setCached(data) {
  cache = {
    data,
    fetchedAt: new Date(),
    error: null,
  };
}

export function setCacheError(err) {
  cache.error = err;
  // data + fetchedAt bleiben unverändert für Fallback
}

export function isCacheValid() {
  if (!cache.data || !cache.fetchedAt) return false;
  return Date.now() - cache.fetchedAt.getTime() < MAX_AGE_MS;
}
