const https = require("https");

const SOURCES = [
  { url: "https://www.horizont.net/rss/news.rss", label: "Horizont", category: "OOH / DOOH", type: "industry", keywords: ["ströer","stroeer","ooh","dooh","außenwerbung"] },
  { url: "https://www.wuv.de/rss", label: "W&V", category: "OOH / DOOH", type: "industry", keywords: ["ströer","stroeer","ooh","dooh"] },
  { url: "https://www.manager-magazin.de/rss/thema/uebernahme/", label: "manager magazin", category: "Übernahme / Gerüchte", type: "rumor", keywords: ["ströer","stroeer"] },
  { url: "https://www.spiegel.de/wirtschaft/index.rss", label: "Spiegel Wirtschaft", category: "Übernahme / Gerüchte", type: "rumor", keywords: ["ströer","stroeer"] },
  { url: "https://www.finanzen.net/rss/news/aktie/SAX", label: "finanzen.net", category: "Aktie / Markt", type: "financial", keywords: ["ströer","stroeer","sax"] },
  { url: "https://www.handelsblatt.com/contentexport/feed/top-themen", label: "Handelsblatt", category: "Aktie / Markt", type: "financial", keywords: ["ströer","stroeer"] },
  { url: "https://feeds.reuters.com/reuters/businessNews", label: "Reuters", category: "Aktie / Markt", type: "financial", keywords: ["stroeer","ströer"] },
];

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; StroeerBot/1.0)" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchURL(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    });
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("Timeout")); });
    req.on("error", reject);
  });
}

function parseRSS(xml) {
  const items = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const match of itemMatches) {
    const block = match[1];
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
      return m ? (m[1] || m[2] || "").trim() : "";
    };
    items.push({
      title: get("title"),
      link: get("link"),
      pubDate: get("pubDate"),
      description: get("description"),
    });
  }
  return items;
}

exports.handler = async function() {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=900",
  };

  const allItems = [];

  for (const source of SOURCES) {
    try {
      const xml = await fetchURL(source.url);
      const items = parseRSS(xml);
      for (const item of items) {
        const text = `${item.title} ${item.description}`.toLowerCase();
        if (!source.keywords.some(kw => text.includes(kw))) continue;
        if (!item.link) continue;
        allItems.push({
          id: Math.abs([...item.link].reduce((h,c) => Math.imul(31,h)+c.charCodeAt(0)|0, 0)).toString(36),
          title: item.title || "Kein Titel",
          source: source.label,
          sourceType: source.type,
          url: item.link,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          category: source.category,
          summary: item.description.replace(/<[^>]*>/g,"").slice(0,280),
          priority: source.type === "rumor" ? 1 : 2,
          is_rumor: source.type === "rumor",
        });
      }
    } catch(e) {
      console.error(`[${source.label}]:`, e.message);
    }
  }

  const seen = new Set();
  const unique = allItems.filter(i => {
    if (seen.has(i.url)) return false;
    seen.add(i.url);
    return true;
  }).sort((a,b) => new Date(b.published_at) - new Date(a.published_at));

  console.log(`Fetched ${unique.length} unique items`);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      items: unique,
      fetchedAt: new Date().toISOString(),
      source: unique.length > 0 ? "fresh" : "empty",
      warning: unique.length === 0 ? "Keine passenden News
