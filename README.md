# Ströer Intelligence Dashboard

Ein iPhone-optimiertes News-Dashboard für Ströer SE – täglich automatisch aktualisiert, gehostet auf Netlify.

---

## Architektur (Kurz)

```
Browser / iPhone
       ↓ GET /api/news
Netlify Function (news.js)
  ├─ In-Memory Cache (30 min gültig)
  ├─ Fresh Fetch → 13 RSS-Quellen parallel
  └─ Fallback → /public/data/fallback.json

Scheduled Function (fetch-news.js)
  └─ Mo–Fr 10:00 + 14:00 UTC
     = 12:00 + 16:00 MEZ (Winter)
```

**Warum kein JSON-File schreiben?**
Netlify Functions können keine Dateien in den statischen `public`-Ordner schreiben. Der Cache lebt deshalb in der Lambda-Instanz (in-memory). Bei Cold Starts wird sofort neu gefetcht. Der Scheduled Job sorgt dafür, dass der Cache zu den Hauptzeiten warm ist.

---

## Voraussetzungen

- Netlify-Account (kostenlos ausreichend)
- Node.js ≥ 18 lokal (nur zum Testen)
- Git + GitHub/GitLab Repo (für Netlify-Deployment)

---

## Setup: Schritt für Schritt

### 1. Repo anlegen

```bash
git init stroeer-dashboard
cd stroeer-dashboard
# Alle Dateien aus diesem Projekt reinkopieren
git add .
git commit -m "Initial: Ströer Intelligence Dashboard"
```

### 2. GitHub-Repo erstellen und pushen

```bash
git remote add origin https://github.com/DEIN_USER/stroeer-dashboard.git
git push -u origin main
```

### 3. Netlify verbinden

1. Geh auf [app.netlify.com](https://app.netlify.com)
2. "Add new site" → "Import an existing project"
3. GitHub verbinden → Repo auswählen
4. Build-Einstellungen werden automatisch aus `netlify.toml` gelesen
5. "Deploy site" klicken

**Wichtig:** Netlify erkennt die `netlify.toml` automatisch. Keine zusätzlichen Build-Einstellungen nötig.

### 4. Scheduled Functions aktivieren

Scheduled Functions sind ab dem Netlify Starter (kostenlos) verfügbar.

Prüfen: Site Settings → Functions → du solltest `fetch-news` sehen.

Falls nicht: In Netlify Dashboard → Plugins → "@netlify/plugin-scheduled-functions" installieren.

### 5. Custom Domain (optional)

Site Settings → Domain Management → "Add custom domain"

---

## Lokales Testen

```bash
npm install
npm install -g netlify-cli

# Netlify Dev starten (emuliert Functions + Scheduled)
netlify dev
```

Dashboard öffnen: http://localhost:8888

Scheduled Function manuell triggern:
```bash
netlify functions:invoke fetch-news
```

API manuell aufrufen:
```bash
curl http://localhost:8888/api/news | jq .
curl http://localhost:8888/api/status | jq .
```

---

## iPhone-Installation (Add to Home Screen)

1. Netlify-URL im Safari öffnen (z. B. `dein-projekt.netlify.app`)
2. Teilen-Icon (mittig unten) tippen
3. "Zum Home-Bildschirm" wählen
4. Name bestätigen → "Hinzufügen"

Das Dashboard verhält sich danach wie eine App (Fullscreen, kein Safari-Chrome).

---

## Zwei Personen, eine URL

Beide greifen auf dieselbe öffentliche Netlify-URL zu. Kein Login nötig. Kein Session-State. Beide sehen identische Daten, weil `/api/news` dieselbe Function aufruft.

---

## Automatischer Update-Zeitplan

| Tag       | Zeit (UTC) | Zeit (MEZ/Winter) | Zeit (MESZ/Sommer) |
|-----------|------------|-------------------|---------------------|
| Mo–Fr     | 10:00      | 12:00             | 12:00               |
| Mo–Fr     | 14:00      | 16:00             | 16:00               |

Cron-Expression: `0 10,14 * * 1-5`

Manuelles Refresh: Button oben rechts im Dashboard (↻)

---

## Quellen-Architektur

| Typ       | Farbe     | Quellen                                            |
|-----------|-----------|----------------------------------------------------|
| official  | blau      | Ströer IR, Ströer Presse                           |
| industry  | violett   | Horizont, W&V, OOH! Magazine, out of home today   |
| financial | grün      | finanzen.net, Handelsblatt, Reuters                |
| jobs      | pink      | Ströer Karriere, kununu                            |
| rumor     | amber     | Bloomberg, manager magazin, Spiegel Wirtschaft     |

Gerüchte werden im Dashboard immer mit gelbem Balken + "Gerücht"-Badge markiert.

---

## Projektstruktur

```
stroeer-dashboard/
├── netlify.toml                    # Netlify-Konfiguration + Cron
├── package.json
├── public/
│   ├── index.html                  # Das komplette Dashboard
│   ├── manifest.json               # PWA-Manifest für iPhone
│   ├── data/
│   │   └── fallback.json           # Statische Fallback-Daten
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
└── netlify/
    └── functions/
        ├── news.js                 # GET /api/news
        ├── status.js               # GET /api/status
        ├── fetch-news.js           # Scheduled Function (Cron)
        ├── sources.js              # Quellenarchitektur (modular)
        ├── fetcher.js              # RSS-Fetching + Normalisierung
        └── cache.js                # In-Memory Cache
```

---

## Fehlerhandling

Das Dashboard fällt nie komplett aus:

1. Live-Fetch schlägt fehl → In-Memory Cache (stale)
2. Kein Cache → `fallback.json` aus Public-Ordner
3. Alles schlägt fehl → Leerer State mit Fehlermeldung

Die Fehlerquelle wird im Status-Tab angezeigt.

---

## Annahmen & Grenzen

- **RSS-Verfügbarkeit:** Nicht alle Quellen bieten stabiles RSS. Horizont, W&V und finanzen.net sind die verlässlichsten Quellen.
- **Keyword-Filterung:** Quellen wie Bloomberg und Reuters liefern viele allgemeine News – Keywords filtern auf Ströer-Relevanz. Bei sehr wenig Ströer-Berichterstattung können Kategorien leer sein.
- **Gerüchte:** Bloomberg-RSS ist öffentlich limitiert. Alternativ: Paid Alerts oder Google Alerts RSS einbinden.
- **kununu:** Hat kein RSS – nur als statischer Link hinterlegt.
- **In-Memory Cache:** Fällt bei Netlify Cold Starts zurück. Scheduled Function wärmt den Cache zu den Kernzeiten.
- **Zeitzone:** UTC-Cron kann um 1h abweichen bei Sommerzeit-Wechsel. Netlify unterstützt aktuell keine native TZ-Option für Crons.

---

## Was als Nächstes verbessert werden kann

1. **Google Alerts RSS** für Ströer-Übernahmegerüchte einbinden (kostenfrei, sehr aktuell)
2. **Netlify Blob Storage** nutzen (neue Beta-Feature) um Daten wirklich persistent zu speichern
3. **Push Notifications** über Web Push API bei neuen Gerüchten
4. **Aktien-Widget** direkt im Dashboard (z.B. über Yahoo Finance API)
5. **kununu-Score** manuell aktualisierbar über Admin-Endpoint
6. **Passwortschutz** über Netlify Identity (Basic Auth) wenn privater Zugang gewünscht
7. **E-Mail-Alert** bei Gerüchten über Netlify Function + SendGrid
8. **Suchfunktion** innerhalb der geladenen News

---

## Support & Wartung

Bei dauerhaftem Ausfall: `public/data/fallback.json` manuell mit aktuellen Daten updaten und re-deployen.

Neue Quellen hinzufügen: `netlify/functions/sources.js` bearbeiten → Commit → Netlify deployed automatisch.
