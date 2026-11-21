// Builds the one-page casting resume (downloads/Isto-Barton-Resume.pdf) from resume.html.
// Credits are pulled from the live page so they never drift; ONE_SHEET below picks which ones fit on one page.
// Never add a phone number here.
// Usage: npm run serve (in another tab), then: npm run resume-pdf
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = new URL('../downloads/Isto-Barton-Resume.pdf', import.meta.url).pathname;

// Which rows go on the one-sheet. Match by title (and role when a title repeats).
// `as` overrides how a row prints; `skip` hides it.
const ONE_SHEET = [
  { section: 'FILM / NEW MEDIA', rows: 'all' },
  {
    section: 'THEATRE', note: 'selected',
    rows: [
      "Isaac's Eye", 'The Maids', 'Henry IV, Part 1', 'Much Ado About Nothing', "A Midsummer Night's Dream",
      'Mucedorus', 'Arden of Faversham', "Charley's Aunt", 'Miracle on 34th Street: A Radiocast',
      { t: 'Henry VI, Part 3', as: { t: 'Henry VI, Parts 1 to 3', r: 'Richard Plantagenet / Gloucester' } },
      'Hamlet', 'As You Like It', 'Twelfth Night',
    ],
  },
  {
    section: 'TRAINING',
    rows: [
      'The Self Tape Gym', { t: 'Stella Adler Studio', r: 'Acting for TV and Film' }, { t: 'Stella Adler Studio', r: 'Voice Acting' },
      'CM Studios', 'Manhattan Comedy School', 'ColdTowne Conservatory',
      { t: 'Royal Shakespeare Company', as: { r: 'Lizz Ketterer Scholar' } }, { t: 'UT Austin', r: 'Shakespeare Studies' },
    ],
  },
];
const SKILLS = [
  ['Comedy + Hosting', 'improv, stand-up, host / emcee, voiceover'],
  ['Music', 'singer (baritone), guitar, saxophone (alto, baritone, soprano), whistling'],
  ['Physical', 'stage combat, Kajukenbo, tap (basic), distance running, cycling, yoga'],
  ['Other', 'tarot reading, marionette puppetry, Russian (conversational), driver’s license, valid passport'],
  ['Dialects', 'Standard American, New York, Southern, Texan, British RP, Cockney, Irish, Scottish, Australian, Russian'],
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE + '/resume');

const data = await page.evaluate(() => {
  const txt = el => (el ? el.textContent.trim() : '');
  return {
    stats: [...document.querySelectorAll('.side .stat')].map(s => [txt(s.children[0]), txt(s.children[1])]),
    sections: Object.fromEntries([...document.querySelectorAll('.rsec')].map(sec => [
      txt(sec.querySelector('h2')),
      [...sec.querySelectorAll('.row3')].map(r => ({ t: txt(r.querySelector('.t')), r: txt(r.children[1]), c: txt(r.querySelector('.c')) })),
    ])),
  };
});

const missing = [];
const sections = ONE_SHEET.map(({ section, note, rows }) => {
  const all = data.sections[section] || [];
  const picked = rows === 'all' ? all : rows.map(sel => {
    const want = typeof sel === 'string' ? { t: sel } : sel;
    const row = all.find(x => x.t === want.t && (!want.r || x.r === want.r));
    if (!row) { missing.push(`${section}: ${want.t}`); return null; }
    return { ...row, ...(want.as || {}) };
  }).filter(Boolean);
  return { title: section, note, rows: picked };
});
if (missing.length) { console.error('Not found on resume page:\n  ' + missing.join('\n  ')); process.exit(1); }

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stat = k => (data.stats.find(([key]) => key === k) || [])[1];
const statLine = [`Height ${stat('HEIGHT')}`, `Hair ${stat('HAIR')}`, `Eyes ${stat('EYES')}`, `Voice ${stat('VOICE')}`, stat('UNION')].join(' · ');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: Letter; margin: 0.5in 0.6in; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 10pt; color: #1d2326; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #D4A73A; padding-bottom: 8px; }
  h1 { margin: 0; font-weight: 400; font-size: 28pt; letter-spacing: .32em; }
  .contact { text-align: right; font-size: 9.5pt; line-height: 1.5; }
  .stats { margin: 9px 0 0; font-size: 9.5pt; letter-spacing: .04em; color: #3a4246; }
  section { margin-top: 13px; }
  h2 { margin: 0 0 5px; font-size: 9.5pt; font-weight: 600; letter-spacing: .35em; border-bottom: 1px solid #c9cdcf; padding-bottom: 3px; }
  h2 em { font-weight: 400; letter-spacing: 0; text-transform: none; }
  .r3 { display: grid; grid-template-columns: 38% 33% 29%; padding: 1.5px 0; }
  .r3 i { padding-right: 10px; }
  .r3 .c { color: #5b6468; }
  .r2 { display: grid; grid-template-columns: 22% 78%; padding: 1.5px 0; }
  .r2 .k { font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: #5b6468; padding-top: 1.5px; }
</style></head><body>
  <header><h1>ISTO BARTON</h1><div class="contact">hello@istobarton.com<br>istobarton.com · New York, NY</div></header>
  <p class="stats">${esc(statLine)}</p>
  ${sections.map(s => `<section><h2>${esc(s.title)}${s.note ? ` <em>(${esc(s.note)})</em>` : ''}</h2>${s.rows.map(r =>
    `<div class="r3"><i>${esc(r.t)}</i><span>${esc(r.r)}</span><span class="c">${esc(r.c)}</span></div>`).join('')}</section>`).join('')}
  <section><h2>SPECIAL SKILLS</h2>${SKILLS.map(([k, v]) => `<div class="r2"><span class="k">${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}</section>
</body></html>`;

await page.setContent(html, { waitUntil: 'load' });
await page.pdf({ path: OUT, format: 'Letter', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('Wrote', OUT);
