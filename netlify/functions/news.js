/**
 * news.js — Netlify Function: GET /api/news
 *
 * Gibt aktuelle News als JSON zurück.
 * Nutzt In-Memory-Cache + Fallback auf statisches JSON.
 */

import { SOURCES } from "./sources.js";
import { fetchRSSSource, deduplicateItems, sortItems } from "./fetcher.js";
import { getCached, setCached, setCacheError, isCacheValid } from "./cache.js";
import fallbackData from "../../public/data/fallback.json" assert { type: "json" };

export const config = {
  path: "/api/news",
};

async function fetchAllNews() {
  console.log("[news] Starting full fetch...");
  const start = Date.now();

  const rssSources = SOURCES.filter((s) => s.method === "rss" && s.rssUrl);

  // Parallel fetchen mit individuellem Fehlerhandling
  const results = await Promise.allSettled(
    rssSources.map((source) => fetchRSSSource(source))
  );

  const allItems = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  const processed = sortItems(deduplicateItems(allItems));

  console.log(
    `[news] Fetch complete: ${processed.length} items in ${Date.now() - start}ms`
  );

  return {
    items: processed,
    fetchedAt: new Date().toISOString(),
    totalSources: rssSources.length,
    successfulSources: results.filter((r) => r.status === "fulfilled" && r.value.length > 0).length,
  };
}

export default async function handler(req, context) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=900, stale-while-revalidate=1800",
  };

  // Cache-Hit
  if (isCacheValid()) {
    const { data } = getCached();
    console.log("[news] Serving from cache");
    return new Response(
      JSON.stringify({ ...data, source: "cache" }),
      { headers }
    );
  }

  // Fresh fetch
  try {
    const data = await fetchAllNews();

    if (data.items.length > 0) {
      setCached(data);
      return new Response(
        JSON.stringify({ ...data, source: "fresh" }),
        { headers }
      );
    }

    // Fetch erfolgreich aber keine Items → Fallback
    console.warn("[news] No items fetched, using fallback");
    return new Response(
      JSON.stringify({ ...fallbackData, source: "fallback", warning: "No live data available" }),
      { headers }
    );
  } catch (err) {
    setCacheError(err.message);
    console.error("[news] Critical fetch error:", err);

    // Stale cache verwenden wenn vorhanden
    const { data: staleData } = getCached();
    if (staleData) {
      return new Response(
        JSON.stringify({ ...staleData, source: "stale", warning: "Using stale data due to fetch error" }),
        { headers }
      );
    }

    // Ultimativer Fallback: statisches JSON
    return new Response(
      JSON.stringify({ ...fallbackData, source: "fallback", warning: err.message }),
      { status: 200, headers } // 200 damit Frontend nicht crasht
    );
  }
}
