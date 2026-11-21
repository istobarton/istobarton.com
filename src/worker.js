// istobarton.com Worker. Everything is served as static assets; this code only runs for downloads
// (wrangler.jsonc run_worker_first: /downloads/* and /dl/*). For each real download it:
//   1. records a data point in Workers Analytics Engine (dataset istobarton_downloads) for the monthly report
//   2. emails Isto (address lives in the NOTIFY_TO secret, never in this public repo)
// No IPs, cookies or personal data are stored. The IP is only hashed in memory to skip repeat hits.
import { EmailMessage } from 'cloudflare:email';

const BOT = /bot|crawl|spider|slurp|preview|fetch|curl|wget|python|httpclient|headless|lighthouse|linkinator|playwright|facebookexternalhit|whatsapp|slack|discord|telegram|monitor|uptime|scan/i;
const IMAGE = /^\/dl(\/assets\/img\/[a-z0-9-]+\.jpg)$/;
const LABELS = {
  '/downloads/Isto-Barton-Resume.pdf': 'your resume',
  '/downloads/Isto-Barton-Headshot.jpg': 'your headshot (Quiet Wound)',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let res, file, label;

    if (url.pathname.startsWith('/dl/')) {
      // Gallery "Download" button: /dl/assets/img/<name>.jpg?name=<nice filename>
      const m = url.pathname.match(IMAGE);
      if (!m) { const nf = await env.ASSETS.fetch(new Request(new URL('/404', url), request)); return new Response(nf.body, { status: 404, headers: nf.headers }); }
      file = m[1];
      const asset = await env.ASSETS.fetch(new Request(new URL(file, url), request));
      const name = (url.searchParams.get('name') || file.split('/').pop()).replace(/[^A-Za-z0-9.-]/g, '');
      res = new Response(asset.body, asset);
      if (asset.ok) res.headers.set('Content-Disposition', `attachment; filename="${name}"`);
      label = describe(file);
    } else {
      res = await env.ASSETS.fetch(request);
      file = url.pathname;
      label = LABELS[file] || file;
    }

    if (res.ok && isRealDownload(request)) ctx.waitUntil(record(request, env, file, label));
    return res;
  },
};

function isRealDownload(request) {
  if (request.method !== 'GET') return false;
  if (BOT.test(request.headers.get('user-agent') || '')) return false;
  const range = request.headers.get('range');
  if (range && !/^bytes=0-/.test(range)) return false; // PDF viewers re-request chunks; count the first only
  return true;
}

async function record(request, env, file, label) {
  // Skip repeats from the same visitor + file for 30 minutes (hash only, kept in Cloudflare's cache)
  const ip = request.headers.get('cf-connecting-ip') || '';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + '|' + file + '|' + (env.SALT || 'istobarton')));
  const key = new Request('https://istobarton.com/__seen/' + [...new Uint8Array(digest)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join(''));
  const cache = caches.default;
  if (await cache.match(key)) return;
  await cache.put(key, new Response('1', { headers: { 'Cache-Control': 'max-age=1800' } }));

  const cf = request.cf || {};
  const ref = request.headers.get('referer') || '';
  let from = 'a direct link';
  try { if (ref) { const r = new URL(ref); from = r.hostname === 'istobarton.com' || r.hostname === 'www.istobarton.com' ? `your ${r.pathname === '/' ? 'home' : r.pathname.slice(1)} page` : r.hostname; } } catch {}
  const where = [cf.city, cf.region, cf.country].filter(Boolean).join(', ') || 'somewhere';
  const device = deviceOf(request.headers.get('user-agent') || '');

  env.DOWNLOADS?.writeDataPoint({ indexes: [file], blobs: [file, cf.country || '', cf.city || '', from, device], doubles: [1] });

  if (env.MAILER && env.NOTIFY_TO) {
    const when = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });
    const subject = `Someone downloaded ${label}`;
    const body = [`Someone just downloaded ${label} from istobarton.com.`, '', `When: ${when} (New York time)`, `Where: ${where}`, `Came from: ${from}`, `Device: ${device}`, '', 'This is an automatic note from your website. Monthly totals arrive with the analytics report on the 1st.'].join('\r\n');
    const from_ = 'downloads@istobarton.com';
    const raw = [
      `From: istobarton.com <${from_}>`, `To: ${env.NOTIFY_TO}`, `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`, `Message-ID: <${crypto.randomUUID()}@istobarton.com>`,
      'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: 8bit', '', body,
    ].join('\r\n');
    try { await env.MAILER.send(new EmailMessage(from_, env.NOTIFY_TO, raw)); } catch (e) { console.log('email failed', e && e.message); }
  }
}

// Human labels for the email subject, e.g. "a gallery photo from The Maids"
const SHOWS = { maids: 'The Maids', isaacs: "Isaac's Eye", henry4: 'Henry IV, Part 1', twelfth: 'Twelfth Night', miracle: 'Miracle on 34th Street',
  mucedorus: 'Mucedorus', arden: 'Arden of Faversham', tarot: 'Tarot Tales', live: 'a live show' };
const LOOKS = { quiet: 'Quiet Wound', warm: 'warm, mustard jacket', smart: 'navy blazer', playful: 'patterned shirt', commercial: 'commercial, navy blazer',
  plaid: 'red plaid', denim: 'denim jacket', cozy: 'plaid fleece', femme: 'clean-shaven, red shirt', masc: 'clean-shaven, paisley shirt' };
function describe(file) {
  const base = file.split('/').pop().replace(/-\d+\.jpg$/, '');
  if (base.startsWith('hs-')) { const look = base.slice(3); return `a headshot (${LOOKS[look] || look})`; }
  const show = SHOWS[base.split('-')[0]];
  return show ? `a gallery photo from ${show}` : `a gallery photo (${base})`;
}

function deviceOf(ua) {
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/CrOS/.test(ua)) return 'Chromebook';
  if (/Linux/.test(ua)) return 'Linux';
  return 'unknown device';
}
