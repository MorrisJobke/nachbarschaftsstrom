# Tech Context

## Stack

| Schicht | Tech | Warum |
|---------|------|-------|
| Frontend | Plain HTML/CSS/JS | Zero-Build, zero-deps, minimal surface area |
| Fonts | Google Fonts: Fraunces + IBM Plex Mono | Charakter, DSGVO-kritisch aber akzeptabel für diesen Use Case |
| Hosting Frontend | GitHub Pages (entschieden) | Gratis, Git-gekoppelt, via GitHub Actions Workflow |
| Serverless | Cloudflare Workers | Gratis bis 100k req/day, low latency |
| State | Cloudflare KV (optional) | Nur für Rate Limiting |
| Push-Benachrichtigung | Telegram Bot API | Existierender Bot, gratis, zuverlässig |
| Analytics | Cloudflare Web Analytics | Cookielos, kein Consent-Banner nötig |
| Daten-Quelle | EPEX Day-Ahead via awattar API oder Energy-Charts API | Öffentlich, gratis, kein Auth |
| Cron | GitHub Actions (bereits vorhanden) | Existiert schon fürs Preis-Skript |

## Setup & Entwicklung

### Lokales Testen
```bash
cd solar-share
python -m http.server 8000
# → http://localhost:8000
```

### Worker-Deployment (Dashboard)
1. Cloudflare → Workers & Pages → Create Worker
2. `worker.js` reinkopieren, Deploy
3. Settings → Variables:
   - `TELEGRAM_BOT_TOKEN` (Secret)
   - `TELEGRAM_CHAT_ID` (Secret)
   - `ALLOWED_ORIGIN` (Plain text, z.B. `https://solar-share.pages.dev`)
4. KV Namespace "RATE_LIMIT" erstellen und binden

### Worker-Deployment (Wrangler)
```bash
npm install -g wrangler
wrangler login
wrangler deploy worker.js --name solar-share
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

## Constraints

- **Keine Build-Pipeline fürs Frontend.** Direkt editierbar, direkt deploybar.
- **Keine Cookies.** Weder technisch nötig noch erwünscht (Consent-Banner-frei).
- **Kein User-Account-System.** Keine Datenbank mit Nutzerdaten.
- **Keine automatische Statusmeldung an Nachbarn.** Das passiert manuell, zumindest in V1.

## Abhängigkeiten / externe Dienste

| Dienst | Kritikalität | Ausfall-Impact |
|--------|--------------|----------------|
| GitHub | hoch | Status veraltet, Page down |
| Cloudflare | hoch | Worker down = keine Pings, Page evtl. down |
| Telegram | mittel | Pings werden ggf. nicht zugestellt, UX nicht betroffen |
| awattar / Energy-Charts | mittel | GitHub Action schlägt fehl, Status wird stale |
| Google Fonts | niedrig | Fallback auf serif/monospace, Design leidet |

## Konfig-Stellen im Code

| Datei | Stelle | Was |
|-------|--------|-----|
| `index.html` | `<script defer src=...data-cf-beacon=...>` | CF Analytics Token |
| `index.html` | `const WORKER_URL = ...` | URL des deployten Workers |
| `index.html` | `const STATUS_URL = './status.json'` | Pfad zur Status-Datei |
| `worker.js` | ENV | Telegram-Token, Chat-ID, Allowed Origin |

## Tool Usage Patterns

- **GitHub Actions** zieht EPEX-Daten und committet `status.json` in's Repo — das ist der einzige "dynamische" Teil der Seite
- **Cloudflare Dashboard** für alles Ops-mäßige (Deploy, Secrets, Analytics-Einsicht)
- **Telegram** als Notification-Channel und indirekt als Response-Channel (ich antworte Nachbarn auch über Telegram-Kontakte, wenn sie ihre Nummer hinterlassen)
