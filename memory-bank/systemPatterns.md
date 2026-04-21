# System Patterns

## Architektur-Überblick

```
┌──────────────┐     scan      ┌──────────────────┐
│  QR-Code am  │ ────────────▶ │  Landing Page    │
│  Zaun        │               │  (GitHub Pages   │
└──────────────┘               │   oder CF Pages) │
                               └────────┬─────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
            ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
            │ status.json  │   │   Button     │   │  CF Web          │
            │ (aus Repo,   │   │   Klick      │   │  Analytics       │
            │  täglich     │   └──────┬───────┘   │  (Scan-Zahlen)   │
            │  aktualisiert│          │           └──────────────────┘
            └──────────────┘          │
                  ▲                   ▼
                  │           ┌──────────────────┐
                  │           │ Cloudflare       │
            ┌─────┴──────┐    │ Worker           │
            │ GitHub     │    │ /interest        │
            │ Action     │    │ + KV Rate Limit  │
            │ (EPEX API) │    └────────┬─────────┘
            └────────────┘             │
                                       ▼
                              ┌──────────────────┐
                              │ Telegram Bot API │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Mein Telegram    │
                              └──────────────────┘
```

## Kern-Patterns

### Static Frontend + Serverless Backend
Die Landing Page ist rein statisch (HTML/CSS/JS, keine Build-Tools). Der einzige Server-Anteil ist der Cloudflare Worker. Gesamte Infrastruktur ist versionierbar und deklarativ.

### Asymmetric Data Flow
- **Status** fließt "pull": Browser lädt `status.json` beim Seitenaufruf
- **Interesse** fließt "push": Browser → Worker → Telegram
Beide Richtungen sind entkoppelt; der Status-Pfad braucht keinen Worker, der Worker-Pfad braucht kein JSON.

### Two-Stage Interest Capture
1. Erster Klick: anonymes "Jemand hat Interesse" — Worker wird sofort gefeuert
2. Optionale zweite Stufe: Kontaktdaten in Textfeld — separater Worker-Call
So wird das Hemmschwellen-Problem umgangen: Klick ist commitment-frei, Kontakt ist ein bewusster zweiter Schritt.

### Status-JSON als Vertrag
Das GitHub-Action-Skript und die Landing Page sprechen nur über die JSON-Struktur miteinander. Kein shared code, keine API. Schema:

```json
{
  "updated_at": "ISO8601",
  "available_today":    { "active": bool, "windows": ["HH:MM–HH:MM"] },
  "available_tomorrow": { "active": bool, "windows": ["HH:MM–HH:MM"] }
}
```

### Rate Limiting via Cloudflare KV
Pro IP max. 5 Requests/Stunde gegen `/interest`. Implementiert als Counter in KV mit TTL von 3600s. Wenn KV nicht gebunden ist, läuft der Worker ohne Rate Limit (Fallback).

## Komponenten-Beziehungen

| Komponente | Abhängigkeiten | Gehosted bei |
|------------|----------------|--------------|
| Landing Page | `status.json`, Worker | GitHub Pages / CF Pages |
| `status.json` | EPEX Day-Ahead API (awattar/Energy-Charts) | GitHub Repo |
| GitHub Action | EPEX API | GitHub Actions |
| Worker | Telegram Bot API, KV | Cloudflare |
| Web Analytics | Keine | Cloudflare |

## Kritische Implementierungs-Pfade

- **QR-Scan zum Telegram-Ping:** Landing Page muss laden (GitHub/CF Pages up), Worker muss erreichbar sein (CF up), Telegram API muss antworten. Alle drei sind hoch verfügbar; Ausfall einzelner Komponenten degradiert die UX, macht sie aber nicht kaputt (außer Worker-Ausfall → kein Ping).
- **Täglicher Status-Update:** GitHub Action läuft nach EPEX-Veröffentlichung (~ 14 Uhr), committet `status.json`. Wenn die Action versagt, zeigt die Seite veraltete Daten — hier evtl. `updated_at` in der UI zeigen als Warnung bei Alter > 24h.
