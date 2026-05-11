/**
 * fetcher.js — Robuster RSS/HTML Fetcher mit Timeout + Fallback
 */

import Parser from "rss-parser";

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "StroeerDashboard/1.0 (news aggregator; contact: admin@example.com)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: ["media:content", "enclosure", "dc:creator"],
  },
});

/**
 * Normalisiert ein RSS-Item in das interne NewsItem-Schema.
 */
function normalizeItem(item, source) {
  const publishedAt = item.pubDate
    ? new Date(item.pubDate).toISOString()
    : item.isoDate || new Date().toISOString();

  const summary = item.contentSnippet
    ? item.contentSnippet.slice(0, 280)
    : item.content
    ? stripHtml(item.content).slice(0, 280)
    : "";

  return {
    id: generateId(item.link || item.title || ""),
    title: (item.title || "").trim(),
    source: source.label,
    sourceType: source.type,
    url: item.link || item.guid || "",
    published_at: publishedAt,
    category: source.category,
    summary: summary,
    priority: source.priority,
    is_rumor: source.type === "rumor",
    fetched_at: new Date().toISOString(),
  };
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function generateId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Prüft ob ein Item Keywords enthält (case-insensitive).
 * Wenn keine Keywords definiert: alle Items durchlassen.
 */
function matchesKeywords(item, keywords) {
  if (!keywords || keywords.length === 0) return true;
  const text = `${item.title || ""} ${item.contentSnippet || ""} ${item.content || ""}`.toLowerCase();
  return keywords.some((kw) => text.includes(kw.toLowerCase()));
}

/**
 * Fetcht einen einzelnen RSS-Feed mit Timeout-Schutz.
 * Gibt leeres Array zurück bei Fehler (defensiv).
 */
export async function fetchRSSSource(source) {
  if (!source.rssUrl) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    let feed;
    try {
      feed = await parser.parseURL(source.rssUrl);
    } finally {
      clearTimeout(timeout);
    }

    const items = (feed.items || [])
      .filter((item) => matchesKeywords(item, source.keywords))
      .slice(0, 15)
      .map((item) => normalizeItem(item, source));

    console.log(`[${source.id}] fetched ${items.length} items`);
    return items;
  } catch (err) {
    console.error(`[${source.id}] fetch error:`, err.message);
    return [];
  }
}

/**
 * Dedupliziert News-Items nach URL + Titel.
 */
export function deduplicateItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.url || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Sortiert: nach Priorität, dann Datum.
 */
export function sortItems(items) {
  return items.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return new Date(b.published_at) - new Date(a.published_at);
  });
}
