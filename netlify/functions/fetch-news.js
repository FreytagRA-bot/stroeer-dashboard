/**
 * fetch-news.js — Netlify Scheduled Function
 *
 * Läuft automatisch Mo–Fr um 10:00 + 14:00 UTC
 * = 12:00 + 16:00 MEZ (Winter) / 12:00 + 16:00 MESZ (Sommer)
 *
 * Cron: "0 10,14 * * 1-5"
 *
 * Diese Function wärmt den Cache, sodass der erste User-Request
 * danach sofort gecachte Daten bekommt.
 *
 * Netlify Scheduled Functions müssen einen default export
 * mit dem Argument { next_run } haben.
 */

import { SOURCES } from "./sources.js";
import { fetchRSSSource, deduplicateItems, sortItems } from "./fetcher.js";
import { setCached, setCacheError } from "./cache.js";

export const config = {
  schedule: "0 10,14 * * 1-5",
};

export default async function handler() {
  const runStart = new Date().toISOString();
  console.log(`[scheduled] Run started at ${runStart} (UTC)`);

  const rssSources = SOURCES.filter((s) => s.method === "rss" && s.rssUrl);
  let totalFetched = 0;
  let errors = [];

  const results = await Promise.allSettled(
    rssSources.map(async (source) => {
      const items = await fetchRSSSource(source);
      return { source: source.id, count: items.length, items };
    })
  );

  const allItems = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value.items);
      totalFetched += result.value.count;
      console.log(`[scheduled] ${result.value.source}: ${result.value.count} items`);
    } else {
      errors.push(result.reason?.message || "unknown error");
      console.error(`[scheduled] source error:`, result.reason);
    }
  }

  const processed = sortItems(deduplicateItems(allItems));

  if (processed.length > 0) {
    setCached({
      items: processed,
      fetchedAt: new Date().toISOString(),
      totalSources: rssSources.length,
      successfulSources: results.filter((r) => r.status === "fulfilled" && r.value.count > 0).length,
    });
    console.log(`[scheduled] Cache updated. Total: ${processed.length} unique items`);
  } else {
    setCacheError("Scheduled run produced 0 items");
    console.warn("[scheduled] No items fetched. Cache not updated.");
  }

  const summary = {
    runAt: runStart,
    totalFetched,
    uniqueItems: processed.length,
    sources: rssSources.length,
    errors: errors.length,
    errorMessages: errors,
  };

  console.log("[scheduled] Summary:", JSON.stringify(summary));
  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
