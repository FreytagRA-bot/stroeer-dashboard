const https = require("https");

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 6000,
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function parseRSS(xml) {
  const items = [];
  const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  for (const m of matches) {
    const b = m[1];
    const get = (tag) => {
      const r = b.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "s"));
      return r ? r[1].trim() : "";
    };
    items.push({ title: get("title"), link: get("link"), pubDate: get("pubDate"), description: get("description") });
  }
  return items;
}

exports.handler = async function() {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const xml = await fetchURL("https://www.finanzen.net/rss/news/aktie/SAX");
    const raw = parseRSS(xml);
    const items = raw.slice(0, 10).map((item, i) => ({
      id: String(i),
      title: item.title || "Kein Titel",
      source: "finanzen.net",
      sourceType: "financial",
      url: item.link || "",
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      category: "Aktie / Markt",
      summary: item.description.replace(/<[^>]*>/g, "").slice(0, 200),
      priority: 2,
      is_rumor: false,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items,
        fetchedAt:
