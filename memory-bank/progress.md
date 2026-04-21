# Progress

## Was funktioniert

- ✅ Landing Page als Prototyp gebaut (HTML/CSS/JS, warm-sonniges Design, responsiv)
- ✅ Status-Anzeige liest `status.json` und zeigt heute/morgen + Zeitfenster
- ✅ Interesse-Button → Worker-Call → Telegram-Nachricht (Code vollständig)
- ✅ Optionales Kontaktformular mit separater Nachricht an Telegram
- ✅ Rate Limiting im Worker (optional via KV)
- ✅ Cloudflare Web Analytics eingebunden (Token-Platzhalter)
- ✅ README mit Setup-Anleitung

## Was noch zu bauen ist

### Bis zum ersten Go-Live
- [x] GitHub Actions Deployment-Workflow für GitHub Pages eingerichtet (`.github/workflows/deploy.yml`)
- [ ] GitHub Pages in Repo-Settings aktivieren (Source → „GitHub Actions")
- [ ] Worker deployen, Telegram-Secrets setzen
- [ ] KV Namespace anlegen
- [ ] Cloudflare Analytics Token holen und einsetzen
- [ ] Preis-Skript im bestehenden Repo erweitern, sodass es `status.json` im richtigen Format ausgibt
- [ ] Impressum + Datenschutzerklärung-Seite
- [ ] QR-Code generieren, Schild designen und drucken
- [ ] Rechtliche Situation Stromweitergabe klären (Netzbetreiber, Hauptzollamt, Versicherung)

### Nice-to-have später
- [ ] `updated_at` in der UI als "stale" markieren, wenn > 24h
- [ ] Telegram-Kanal als Benachrichtigungs-Abo für wiederkehrende Interessenten
- [ ] Mehrsprachigkeit (falls relevante Nachbarn kein Deutsch sprechen)
- [ ] Turnstile statt/zusätzlich zu Rate Limiting, falls Spam auftritt
- [ ] Auto-Antwort vom Telegram-Bot an Nachbarn mit Kontaktdaten ("Danke, ich melde mich")
- [ ] Simple Verlaufs-Historie: wie oft war Strom verfügbar in den letzten 30 Tagen

## Aktueller Status

**Phase:** MVP gebaut, noch nicht deployed. Keine realen Nutzer.

## Bekannte Issues

- **Footer-Link "Impressum / Datenschutz" ist tot** — muss vor Go-Live gefüllt werden, rechtlich notwendig
- **Worker hat keine Retry-Logik** für Telegram-Calls; wenn Telegram API kurzzeitig down ist, geht ein Ping verloren
- **Kein Dedup:** Wenn ein Nachbar dreimal klickt, bekomme ich drei Pings (Rate Limit greift erst ab 6. Klick)
- **Google Fonts** werden von Google geladen — datenschutzrechtlich diskutiert. Alternative: lokales Hosten der Schriftarten.
- **`status.json` muss noch aus dem bestehenden Skript heraus erzeugt werden** — Schema-Mapping vom EPEX-Output auf die erwartete Struktur steht noch aus

## Evolution der Projekt-Entscheidungen

- **Verworfen: Google Form** → zu wenig Kontrolle, keine Live-Benachrichtigung, hässlich
- **Verworfen: WhatsApp-Gruppe** → meine Nummer wäre für alle Mitglieder sichtbar, Moderations-Aufwand
- **Verworfen: Telegram-Kanal als alleinige Lösung** → weniger niederschwellig als ein Button; Kanal als spätere Erweiterung vorgemerkt
- **Entschieden: Cloudflare Worker statt eigener Server** → kein Maintenance, kostenlos, bestehender CF-Account
- **Entschieden: Telegram statt E-Mail für Benachrichtigung** → Bot existiert schon, Push aufs Handy ist instant
- **Entschieden: Zweistufiges Interesse** (Klick → optional Kontakt) → niedrigere Hürde beim Erstklick, trotzdem Kontakt-Kanal vorhanden
