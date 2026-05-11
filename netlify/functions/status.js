/**
 * status.js — Netlify Function: GET /api/status
 * Zeigt Cache-Status und letzte Aktualisierung.
 */

import { getCached } from "./cache.js";

export const config = {
  path: "/api/status",
};

export default async function handler(req, context) {
  const { data, fetchedAt, isStale, error } = getCached();

  return new Response(
    JSON.stringify({
      status: data ? (isStale ? "stale" : "ok") : "empty",
      fetchedAt: fetchedAt?.toISOString() || null,
      isStale,
      itemCount: data?.items?.length || 0,
      error: error || null,
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    }
  );
}
