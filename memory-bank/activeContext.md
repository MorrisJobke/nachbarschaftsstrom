# Active Context

## Aktueller Stand

Erster MVP ist gebaut:

- `index.html` — Landing Page mit Status-Anzeige, Interesse-Button, optionalem Formular
- `worker.js` — Cloudflare Worker, empfängt POSTs auf `/interest`, schickt Telegram-Nachrichten
- `status.json` — Beispiel-Datei, die von einem externen Skript befüllt wird

Noch nicht deployed.

## Nächste Schritte (in Reihenfolge)

1. **Landing Page hosten** — vermutlich GitHub Pages im bestehenden Repo mit dem Preis-Skript
2. **Worker deployen** — im Cloudflare Dashboard, Telegram-Token und Chat-ID als Secrets setzen
3. **KV Namespace "RATE_LIMIT"** anlegen und an den Worker binden
4. **Cloudflare Web Analytics** aktivieren, Token in index.html eintragen
5. **Bestehendes Preis-Skript erweitern**, sodass es `status.json` im erwarteten Format ausgibt und täglich nach dem EPEX-Fetch committet
6. **Impressum-/Datenschutzseite** ergänzen (aktuell nur ein toter Link im Footer)
7. **QR-Code erzeugen** und auf Schild drucken
8. **Rechtliche Seite klären** — Netzbetreiber / Energieberater fragen, ob/wie Stromweitergabe an Nachbarn zulässig ist, Stromsteuer-Meldung

## Offene Entscheidungen

- **Domain?** Subdomain auf bestehender Domain oder `*.pages.dev` als Start?
- **Rechtlich:** Schenkung vs. Verkauf zum Selbstkostenpreis — was ist sauberer?
- **Später erweitern:** Telegram- oder WhatsApp-Kanal als Benachrichtigungs-Abo für interessierte Nachbarn?

## Wichtige Präferenzen & Patterns

- **Keine Telefonnummer öffentlich.** Alles läuft über die Landing Page + Worker.
- **Datenschutz-Light-Ansatz:** Cloudflare Analytics (cookielos), keine Consent-Banner. Telegram-Nachrichten enthalten City/Country aus Cloudflare CF-Headers, keine IP-Speicherung.
- **Fire-and-forget.** Der Button-Klick blockiert nicht — Worker-Call läuft im Hintergrund, UI reagiert sofort.
- **Privacy by design:** Das Formular ist explizit optional und im initial collapsed state.

## Was ich diese Woche gelernt habe

- Cloudflare Workers mit KV sind für diesen Use Case komplett kostenlos und perfekt skaliert
- Telegram Bot API reicht für Push-Benachrichtigung, kein separater Notification-Service nötig
- Cloudflare Web Analytics ist DSGVO-konformer als GA und braucht keinen Banner
