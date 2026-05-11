const fallbackData = require("../../public/data/fallback.json");

exports.handler = async function(event, context) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=900",
  };

  try {
    const Parser = require("rss-parser");
    const parser = new Parser({ timeout: 8000 });

    const SOURCES = [
      { url: "https://www.horizont.net/rss/news.rss", label: "Horizont", category: "OOH / DOOH", type: "industry", keywords: ["Ströer","Stroeer","OOH","DOOH","Außenwerbung"] },
      { url: "https://www.wuv.de/rss", label: "W&V", category: "OOH / DOOH", type: "industry", keywords: ["Ströer","Stroeer","OOH","DOOH"] },
      { url: "https://www.manager-magazin.de/rss/thema/uebernahme/", label: "manager magazin", category: "Übernahme / Gerüchte", type: "rumor", keywords: ["Ströer","Stroeer","Außenwerbung"] },
      { url: "https://www.spiegel.de/wirtschaft/index.rss", label: "Spiegel Wirtschaft", category: "Übernahme / Gerüchte", type: "rumor", keywords: ["Ströer","Stroeer"] },
      { url: "https://www.finanzen.net/rss/news/aktie/SAX", label: "finanzen.net", category: "Aktie / Markt", type: "financial", keywords: ["Ströer","Stroeer","SAX"] },
      { url: "https://www.handelsblatt.com/contentexport/feed/top-themen", label: "Handelsblatt", category: "Aktie / Markt", type: "financial", keywords: ["Ströer","Stroeer"] },
    ];

    const allItems = [];

    for (const source of SOURCES) {
      try {
        const feed = await parser.parseURL(source.url);
        const items = (feed.items || [])
          .filter(item => {
            const text = `${item.title||""} ${item.contentSnippet||""}`.toLowerCase();
            return source.keywords.some(kw => text.includes(kw.toLowerCase()));
          })
          .slice(0, 10)
          .map(item => ({
            id: Math.abs(Array.from(item.link||"").reduce((h,c) => (h<<5)-h+c.charCodeAt(0),0)).toString(36),
            title: (item.title||"").trim(),
            source: source.label,
            sourceType: source.type,
            url: item.link || "",
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            category: source.category,
            summary: (item.contentSnippet||"").slice(0,280),
            priority: source.type === "rumor" ? 1 : 2,
            is_rumor: source.type === "rumor",
          }));
        allItems.push(...items);
      } catch(e) {
        console.error(`[${source.label}] error:`, e.message);
      }
    }

    // Deduplizieren
    const seen = new Set();
    const unique = allItems.filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });

    // Sortieren
    unique.sort((a,b) => new Date(b.published_at) - new Date(a.published_at));

    if (unique.length > 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          items: unique,
          fetchedAt: new Date().toISOString(),
          source: "fresh",
        }),
      };
    }

    // Fallback
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ...fallbackData, source: "fallback", warning: "Keine Live-Daten verfügbar" }),
    };

  } catch(err) {
    console.error("Critical error:", err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ...fallbackData, source: "fallback", warning: err.message }),
    };
  }
};
