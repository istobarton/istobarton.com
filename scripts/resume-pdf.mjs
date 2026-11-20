// Rebuilds downloads/Isto-Barton-Resume.pdf from resume.html so the two never drift.
// Usage: npm run serve (in another tab), then: npm run resume-pdf
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = new URL('../downloads/Isto-Barton-Resume.pdf', import.meta.url).pathname;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE + '/resume');

const data = await page.evaluate(() => {
  const txt = el => (el ? el.textContent.trim() : '');
  const stats = [...document.querySelectorAll('.side .stat')].map(s => [txt(s.children[0]), txt(s.children[1])]);
  const sections = [...document.querySelectorAll('.rsec')].map(sec => ({
    title: txt(sec.querySelector('h2')),
    sub: txt(sec.querySelector('.sub')),
    row3: [...sec.querySelectorAll('.row3')].map(r => ({
      t: txt(r.querySelector('.t')), r: txt(r.children[1]), c: txt(r.querySelector('.c')), n: txt(r.querySelector('.n')),
    })),
    row2: [...sec.querySelectorAll('.row2')].map(r => ({ k: txt(r.querySelector('.k')), v: txt(r.children[1]) })),
  }));
  return { stats, sections };
});

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const statLine = data.stats
  .filter(([k]) => !['BASED'].includes(k))
  .map(([k, v]) => (k === 'UNION' ? v : `${k[0]}${k.slice(1).toLowerCase()} ${v}`))
  .join(' · ');

const sectionHtml = data.sections.map(s => `
  <section><h2>${esc(s.title)}</h2>
  ${s.sub ? `<p class="sub">${esc(s.sub)}</p>` : ''}
  ${s.row3.map(r => `<div class="r3"><i>${esc(r.t)}</i><span>${esc(r.r)}</span><span class="c">${esc(r.c)}${r.n ? `<small>${esc(r.n)}</small>` : ''}</span></div>`).join('')}
  ${s.row2.map(r => `<div class="r2"><span class="k">${esc(r.k)}</span><span>${esc(r.v)}</span></div>`).join('')}
  </section>`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: Letter; margin: 0.55in 0.6in; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 10.5pt; color: #1d2326; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #D4A73A; padding-bottom: 8px; }
  h1 { margin: 0; font-weight: 400; font-size: 28pt; letter-spacing: .32em; }
  .contact { text-align: right; font-size: 10pt; line-height: 1.5; }
  .stats { margin: 10px 0 4px; font-size: 10pt; letter-spacing: .04em; color: #3a4246; }
  section { margin-top: 14px; }
  h2 { margin: 0 0 6px; font-size: 10pt; font-weight: 600; letter-spacing: .35em; border-bottom: 1px solid #c9cdcf; padding-bottom: 3px; break-after: avoid; }
  .sub { margin: 0 0 4px; font-size: 9pt; color: #5b6468; }
  .r3 { display: grid; grid-template-columns: 40% 31% 29%; padding: 2px 0; break-inside: avoid; }
  .r3 i { padding-right: 10px; }
  .r3 .c { color: #5b6468; }
  .r3 small { display: block; font-size: 8.5pt; line-height: 1.45; }
  .r2 { display: grid; grid-template-columns: 34% 66%; padding: 2px 0; break-inside: avoid; }
  .r2 .k { font-size: 8.5pt; letter-spacing: .14em; text-transform: uppercase; color: #5b6468; padding-top: 1px; }
</style></head><body>
  <header><h1>ISTO BARTON</h1><div class="contact">hello@istobarton.com<br>istobarton.com · New York, NY</div></header>
  <p class="stats">${esc(statLine)}</p>
  ${sectionHtml}
</body></html>`;

await page.setContent(html, { waitUntil: 'load' });
await page.pdf({ path: OUT, format: 'Letter', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('Wrote', OUT);
