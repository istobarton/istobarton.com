// Monthly Cloudflare Web Analytics report (cookie-free analytics).
// Needs env: CF_API_TOKEN (Account > Account Analytics: Read), CF_ACCOUNT_ID, CF_SITE_TAG.
// Downloads come from the Worker's Analytics Engine dataset (istobarton_downloads), same token.
const { CF_API_TOKEN, CF_ACCOUNT_ID, CF_SITE_TAG } = process.env;
if (!CF_API_TOKEN || !CF_ACCOUNT_ID || !CF_SITE_TAG) { console.error('Missing CF_API_TOKEN / CF_ACCOUNT_ID / CF_SITE_TAG'); process.exit(1); }

const now = new Date();
const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1));
const prevStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1));

const block = (alias, dim, limit = 10) => `
  ${alias}: rumPageloadEventsAdaptiveGroups(filter: $f, limit: ${limit}, orderBy: [count_DESC]) { count sum { visits } dimensions { ${dim} } }`;
const query = `query($account: string!, $f: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!, $fp: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
  viewer { accounts(filter: { accountTag: $account }) {
    total: rumPageloadEventsAdaptiveGroups(filter: $f, limit: 1) { count sum { visits } }
    prev: rumPageloadEventsAdaptiveGroups(filter: $fp, limit: 1) { count sum { visits } }
    ${block('pages', 'requestPath')}
    ${block('referrers', 'refererHost')}
    ${block('countries', 'countryName', 5)}
    ${block('devices', 'deviceType', 3)}
  } } }`;
const f = (a, b) => ({ siteTag: CF_SITE_TAG, datetime_geq: a.toISOString(), datetime_lt: b.toISOString() });

const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
  method: 'POST',
  headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { account: CF_ACCOUNT_ID, f: f(start, end), fp: f(prevStart, start) } }),
});
const json = await res.json();
if (json.errors) { console.error(JSON.stringify(json.errors, null, 2)); process.exit(1); }
const a = json.data.viewer.accounts[0];
const t = a.total[0] || { count: 0, sum: { visits: 0 } };
const p = a.prev[0] || { count: 0, sum: { visits: 0 } };
// Downloads (resume, headshot, gallery photos) recorded by src/worker.js
const ts = d => d.toISOString().slice(0, 19).replace('T', ' ');
let downloads = '- none';
try {
  const sql = `SELECT blob1 AS file, SUM(_sample_interval) AS n FROM istobarton_downloads
    WHERE timestamp >= toDateTime('${ts(start)}') AND timestamp < toDateTime('${ts(end)}')
    GROUP BY file ORDER BY n DESC LIMIT 20 FORMAT JSON`;
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql`, {
    method: 'POST', headers: { Authorization: `Bearer ${CF_API_TOKEN}` }, body: sql,
  });
  const d = await r.json();
  const nice = f => ({ '/downloads/Isto-Barton-Resume.pdf': 'Resume (PDF)', '/downloads/Isto-Barton-Headshot.jpg': 'Headshot (resume page button)' })[f] || f.replace('/assets/img/', 'Gallery: ');
  if (d.data && d.data.length) downloads = d.data.map(x => `- ${nice(x.file)}: ${Math.round(x.n)}`).join('\n');
} catch (e) { downloads = `- could not load (${e.message})`; }

const pct = (x, y) => (y ? `${x >= y ? '+' : ''}${Math.round(((x - y) / y) * 100)}%` : 'n/a');
const month = start.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const rows = (list, key, fallback) => list.map(r => `- ${r.dimensions[key] || fallback}: ${r.sum.visits} visits, ${r.count} page views`).join('\n') || '- none';

console.log(`# istobarton.com, ${month}

**Visits:** ${t.sum.visits} (${pct(t.sum.visits, p.sum.visits)} vs last month)
**Page views:** ${t.count} (${pct(t.count, p.count)})

## Downloads
${downloads}

## Top pages
${rows(a.pages, 'requestPath', '/')}

## Where people came from
${rows(a.referrers, 'refererHost', 'direct / typed in')}

## Countries
${rows(a.countries, 'countryName', 'unknown')}

## Devices
${rows(a.devices, 'deviceType', 'unknown')}

*Things to check:* casting-site referrers (Actors Access, Backstage) spiking after submissions; resume page share of views.`);
