# Solar-Share Landing Page — Setup

Kleines Projekt: QR-Code → Landing Page mit Status („kostenloser Strom heute/morgen") → Button für Interessensbekundung → Telegram-Nachricht an dich.

## Dateien

- `index.html` — die Landing Page (Frontend)
- `status.json` — wird von deinem bestehenden Skript befüllt, Landing Page liest es
- `worker.js` — Cloudflare Worker, empfängt Klicks und pingt Telegram

## Setup-Schritte

### 1. Landing Page deployen

**Option A: Im bestehenden Repo über GitHub Pages**
- `index.html` + `status.json` ins Repo legen (z.B. in einen `/page/`-Ordner)
- In den Repo-Settings GitHub Pages aktivieren und auf diesen Ordner zeigen lassen
- Dein GitHub-Action-Skript muss `status.json` täglich committen/aktualisieren

**Option B: Cloudflare Pages** (persönliche Empfehlung, passt zum Worker)
- Im Cloudflare Dashboard → Pages → Connect to Git
- Repo verbinden, Output-Verzeichnis angeben
- Gratis, mit Custom Domain koppelbar

### 2. Telegram-Bot vorbereiten

Du hast schon einen Bot. Du brauchst:

- **Bot-Token** (hast du)
- **Chat-ID** (also die ID deines privaten Chats mit dem Bot):
  1. Schreib deinem Bot einmal eine beliebige Nachricht
  2. Öffne: `https://api.telegram.org/bot<DEIN_TOKEN>/getUpdates`
  3. In der JSON-Antwort steht `"chat":{"id": 123456789, ...}` — das ist deine Chat-ID

### 3. Cloudflare Worker deployen

**Über das Cloudflare Dashboard (einfachste Variante):**

1. Cloudflare Dashboard → Workers & Pages → Create Worker
2. Namen vergeben (z.B. `solar-share`)
3. Code aus `worker.js` reinkopieren, Deploy
4. Settings → Variables and Secrets:
   - `TELEGRAM_BOT_TOKEN` = dein Bot-Token (als Secret anlegen!)
   - `TELEGRAM_CHAT_ID` = deine Chat-ID
   - `ALLOWED_ORIGIN` = URL deiner Landing Page, z.B. `https://solar-share.pages.dev`
5. **Optional** Rate Limiting:
   - Workers & Pages → KV → Create namespace „RATE_LIMIT"
   - Im Worker → Settings → Variables → KV Namespace Bindings → Variable Name `RATE_LIMIT` → das Namespace verknüpfen

**Über Wrangler CLI (für Entwickler-Flow):**
```bash
npm install -g wrangler
wrangler login
wrangler deploy worker.js --name nachbarschaftsstrom --compatibility-date 2026-04-21
wrangler secret put TELEGRAM_BOT_TOKEN --name nachbarschaftsstrom
wrangler secret put TELEGRAM_CHAT_ID --name nachbarschaftsstrom
wrangler secret put ALLOWED_ORIGIN --name nachbarschaftsstrom
```

### 4. Cloudflare Web Analytics einrichten

1. Dashboard → Analytics & Logs → Web Analytics → Add a site
2. Hostname deiner Seite eintragen (z.B. `solar-share.pages.dev`)
3. Token kopieren
4. In `index.html` oben die Zeile `data-cf-beacon='{"token": "DEIN_CF_TOKEN_HIER"}'` ersetzen

### 5. Landing Page konfigurieren

In `index.html` unten im `<script>`-Block:
```js
const WORKER_URL = 'https://solar-share.DEIN-ACCOUNT.workers.dev';
```
an deine tatsächliche Worker-URL anpassen.

### 6. status.json aus deinem Skript befüllen

Dein GitHub-Action-Skript muss täglich diese Struktur produzieren:

```json
{
  "updated_at": "2026-04-21T14:30:00+02:00",
  "available_today": {
    "active": false,
    "windows": []
  },
  "available_tomorrow": {
    "active": true,
    "windows": ["11:00–14:00", "15:00–16:00"]
  }
}
```

Die Landing Page zeigt:
- „Heute kostenloser Strom" wenn `available_today.active = true`
- sonst „Morgen kostenloser Strom" wenn `available_tomorrow.active = true`
- sonst „Aktuell nicht verfügbar"

### 7. QR-Code erstellen

- Online-Generator deiner Wahl, z.B. qrcode.show, qr-code-generator.com
- URL = deine Landing-Page-URL
- Auf schönes Schild drucken, an den Zaun

## Was noch fehlt / später einbauen

- **Impressum/Datenschutz-Seite**: Der Link im Footer geht aktuell ins Leere. Du solltest eine kleine statische Seite dazu erstellen — zumindest mit deinem Namen, Adresse, Hinweis auf Cloudflare Analytics und den Worker.
- **Rechtliche Prüfung der Stromweitergabe**: wie im Chat besprochen, kurz mit Netzbetreiber oder Energieberater klären
- **Turnstile**: falls Spam/Missbrauch auftritt, Cloudflare Turnstile vor den Worker klemmen
- **Benachrichtigungs-Abo**: falls gewünscht später mit Telegram-Kanal oder E-Mail-Liste erweitern

## Testen

1. Landing Page lokal öffnen (`python -m http.server` im Ordner, dann `http://localhost:8000`)
2. Auf „Ich hab Interesse"-Button klicken → sollte Telegram-Nachricht bei dir auslösen
3. Nachricht eingeben und absenden → zweite Telegram-Nachricht
4. Mehrfach klicken → nach 5x sollte Rate Limit greifen (wenn KV konfiguriert)
