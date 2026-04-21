// Cloudflare Worker: empfängt Interessensbekundungen + optionale Nachricht
// und schickt sie dir via Telegram-Bot.
//
// ENV VARS (in Cloudflare Dashboard > Worker > Settings > Variables):
//   TELEGRAM_BOT_TOKEN   - dein Bot-Token von @BotFather
//   TELEGRAM_CHAT_ID     - deine Chat-ID (siehe Anleitung unten)
//   ALLOWED_ORIGIN       - z.B. "https://deine-seite.pages.dev" oder "*" zum Testen
//
// OPTIONAL (für Rate Limiting):
//   Eine KV Namespace Binding namens "RATE_LIMIT" anlegen und im Worker binden.

export default {
  async fetch(request, env, ctx) {
    // CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    const url = new URL(request.url);

    if (url.pathname !== '/interest' || request.method !== 'POST') {
      return new Response('Not found', { status: 404, headers: corsHeaders(env) });
    }

    // Rate Limit: max 5 Anfragen pro IP pro Stunde (nur wenn KV gebunden ist)
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.RATE_LIMIT) {
      const key = `rl:${ip}`;
      const current = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
      if (current >= 5) {
        return json({ ok: false, error: 'rate_limited' }, 429, env);
      }
      ctx.waitUntil(env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: 3600 }));
    }

    // Body parsen
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'bad_json' }, 400, env);
    }

    const type    = body.type === 'contact' ? 'contact' : 'click';
    const message = typeof body.message === 'string' ? body.message.slice(0, 1000) : '';

    // Telegram-Nachricht zusammenbauen
    const country = request.cf?.country || '??';
    const city    = request.cf?.city || '';
    const ua      = request.headers.get('User-Agent') || '';
    const now     = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

    let text;
    if (type === 'contact') {
      text =
        `🔔 *Neue Nachricht* (Solar-Share)\n\n` +
        `${escapeMd(message)}\n\n` +
        `_${now} · ${city} ${country}_`;
    } else {
      text =
        `👋 *Jemand hat Interesse geklickt*\n\n` +
        `Keine Nachricht hinterlassen.\n` +
        `_${now} · ${city} ${country}_`;
    }

    // Telegram API aufrufen
    try {
      const tgRes = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          })
        }
      );
      if (!tgRes.ok) {
        const errText = await tgRes.text();
        console.error('Telegram error:', errText);
        return json({ ok: false, error: 'telegram_failed' }, 502, env);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      return json({ ok: false, error: 'fetch_failed' }, 502, env);
    }

    return json({ ok: true }, 200, env);
  }
};

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin':  env?.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function json(obj, status, env) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env)
    }
  });
}

function escapeMd(s) {
  // für Markdown parse_mode (classic): *, _, `, [ müssen escaped werden
  return s.replace(/([_*`\[])/g, '\\$1');
}
