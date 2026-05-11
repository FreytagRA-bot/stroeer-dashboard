/**
 * sources.js — Modulare Quellenarchitektur
 * Jede Quelle ist klar nach Typ getaggt.
 * 
 * Typen:
 *   official   – Direkte Ströer-Quellen
 *   industry   – OOH/DOOH Branchenmedien
 *   financial  – Markt- und Finanzquellen
 *   jobs       – Karriere/Kultur
 *   rumor      – Gerüchte / M&A-Signale
 */

export const SOURCES = [
  // ─── OFFICIAL ────────────────────────────────────────────────
  {
    id: "stroeer-ir",
    label: "Ströer Investor Relations",
    type: "official",
    method: "rss",
    url: "https://www.stroeer.com/investor-relations/news-events/pressemitteilungen/",
    rssUrl: null, // kein RSS → HTML-Parsing-Fallback
    category: "Unternehmensnews",
    priority: 1,
  },
  {
    id: "stroeer-press",
    label: "Ströer Pressemitteilungen",
    type: "official",
    method: "rss",
    url: "https://www.stroeer.com/presse/",
    rssUrl: null,
    category: "Unternehmensnews",
    priority: 1,
  },

  // ─── INDUSTRY ────────────────────────────────────────────────
  {
    id: "horizont",
    label: "Horizont – OOH/DOOH",
    type: "industry",
    method: "rss",
    rssUrl: "https://www.horizont.net/rss/news.rss",
    keywords: ["Ströer", "Out-of-Home", "OOH", "DOOH", "Außenwerbung", "Digital Out"],
    category: "OOH / DOOH",
    priority: 2,
  },
  {
    id: "w-und-v",
    label: "W&V",
    type: "industry",
    method: "rss",
    rssUrl: "https://www.wuv.de/rss",
    keywords: ["Ströer", "OOH", "DOOH", "Außenwerbung"],
    category: "OOH / DOOH",
    priority: 2,
  },
  {
    id: "oohmag",
    label: "OOH! Magazine",
    type: "industry",
    method: "rss",
    rssUrl: "https://www.oohmag.com/feed/",
    keywords: ["Stroeer", "Ströer", "Germany", "Deutsche"],
    category: "OOH / DOOH",
    priority: 2,
  },
  {
    id: "om-report",
    label: "out of home today",
    type: "industry",
    method: "rss",
    rssUrl: "https://outofhometoday.com/feed/",
    keywords: ["Stroeer", "Ströer", "Germany"],
    category: "OOH / DOOH",
    priority: 3,
  },

  // ─── FINANCIAL ───────────────────────────────────────────────
  {
    id: "finanzen-net",
    label: "finanzen.net – SAX",
    type: "financial",
    method: "rss",
    rssUrl: "https://www.finanzen.net/rss/news/aktie/SAX",
    keywords: ["Ströer", "SAX"],
    category: "Aktie / Markt",
    priority: 2,
  },
  {
    id: "boersenblatt",
    label: "Handelsblatt",
    type: "financial",
    method: "rss",
    rssUrl: "https://www.handelsblatt.com/contentexport/feed/top-themen",
    keywords: ["Ströer"],
    category: "Aktie / Markt",
    priority: 2,
  },
  {
    id: "seeking-alpha",
    label: "Reuters",
    type: "financial",
    method: "rss",
    rssUrl: "https://feeds.reuters.com/reuters/businessNews",
    keywords: ["Stroeer", "Ströer", "SAX"],
    category: "Aktie / Markt",
    priority: 3,
  },

  // ─── JOBS ────────────────────────────────────────────────────
  {
    id: "stroeer-jobs",
    label: "Ströer Karriere",
    type: "jobs",
    method: "rss",
    rssUrl: null,
    url: "https://www.stroeer.com/karriere/",
    category: "Jobs / Kultur",
    priority: 3,
  },
  {
    id: "kununu",
    label: "kununu – Ströer",
    type: "jobs",
    method: "static",
    url: "https://www.kununu.com/de/stroeer",
    category: "Jobs / Kultur",
    priority: 4,
    note: "Kein RSS – manuell ergänzen oder über kununu-Widget einbinden",
  },

  // ─── RUMOR / M&A ─────────────────────────────────────────────
  {
    id: "dealreporter",
    label: "Bloomberg / Übernahme-Signale",
    type: "rumor",
    method: "rss",
    rssUrl: "https://feeds.bloomberg.com/markets/news.rss",
    keywords: ["Stroeer", "Ströer", "I Squared", "Blackstone", "outdoor advertising acquisition"],
    category: "Übernahme / Gerüchte",
    priority: 1,
  },
  {
    id: "manager-magazin",
    label: "manager magazin",
    type: "rumor",
    method: "rss",
    rssUrl: "https://www.manager-magazin.de/rss/thema/uebernahme/",
    keywords: ["Ströer", "SAX", "Außenwerbung"],
    category: "Übernahme / Gerüchte",
    priority: 1,
  },
  {
    id: "spiegel-wirtschaft",
    label: "Spiegel Wirtschaft",
    type: "rumor",
    method: "rss",
    rssUrl: "https://www.spiegel.de/wirtschaft/index.rss",
    keywords: ["Ströer"],
    category: "Übernahme / Gerüchte",
    priority: 2,
  },
];

export const CATEGORIES = [
  { id: "takeover",   label: "Übernahme / Gerüchte", icon: "⚡", color: "#f59e0b" },
  { id: "company",    label: "Unternehmensnews",      icon: "🏢", color: "#3b82f6" },
  { id: "oohdooh",   label: "OOH / DOOH",            icon: "📺", color: "#8b5cf6" },
  { id: "market",    label: "Aktie / Markt",          icon: "📈", color: "#10b981" },
  { id: "jobs",      label: "Jobs / Kultur",           icon: "👥", color: "#ec4899" },
];
