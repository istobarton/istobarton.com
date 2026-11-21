// Builds the one-page casting resume (downloads/Isto-Barton-Resume.pdf).
// Layout and wording copy Isto's own one-sheet (plain serif, black on white) on purpose: it reads more professional bare.
// Only change from that file: contact is hello@istobarton.com. Never add a phone number here.
// Usage: npm run resume-pdf
import { chromium } from '@playwright/test';

const OUT = new URL('../downloads/Isto-Barton-Resume.pdf', import.meta.url).pathname;

const CONTACT = ['hello@istobarton.com', 'istobarton.com', 'New York, NY'];
const STATS = ['Height: 5\'11"', 'Hair: Brown', 'Eyes: Blue', 'Voice: Baritone'];

const SECTIONS = [
  ['FILM / NEW MEDIA', '', [
    ['Cue to Cue', 'Actor 2', "Kasey O'Brien"],
    ['Untitled Horror Project', 'Foster', 'Robert Moncrieff'],
    ['Hyde Park', 'Suave Sven', 'Robert Moncrieff'],
    ['Tarot Tales', 'Creator / Host', 'Storytime with Isto'],
    ['Ashes Ashes (video game)', 'Radio Host', 'Paper Rook'],
  ]],
  ['THEATRE', 'selected', [
    ["Isaac's Eye", 'Robert Hooke', 'The Garret Theatre'],
    ['The Maids', 'Madame', 'The Garret Theatre'],
    ['Henry IV, Part 1', 'Douglas / Poins', 'The Hidden Room'],
    ['Much Ado About Nothing', 'Benedick', 'Magnificent Bastards'],
    ["A Midsummer Night's Dream", 'Lysander / Compere', 'Magnificent Bastards'],
    ['Mucedorus', 'Amadine', 'The Hidden Room'],
    ['Arden of Faversham', 'Michael', 'The Hidden Room'],
    ["Charley's Aunt", 'Lord Fancourt Babberly', 'Different Stages'],
    ['Miracle on 34th Street: A Radiocast', 'Fred Gailey', 'Penfold Theatre'],
    ['Henry VI, Parts 1 to 3', 'Richard Plantagenet / Gloucester', 'Shakespeare at Winedale'],
    ['Hamlet', 'Laertes', 'Shakespeare at Winedale'],
    ['As You Like It', 'Silvius', 'Shakespeare at Winedale'],
    ['Twelfth Night', 'Malvolio', 'Shakespeare at Winedale'],
  ]],
  ['TRAINING', '', [
    ['The Self Tape Gym', 'On-Camera Coaching', 'Julian Moore-Cook, Daniel Fathers'],
    ['Stella Adler Studio', 'Acting for TV and Film', 'Alberto Bonilla'],
    ['Stella Adler Studio', 'Voice Acting', 'Bruce Kronenberg'],
    ['CM Studios', 'Voice', 'Cooper McGuire'],
    ['Manhattan Comedy School', 'Stand-Up Comedy', 'Gibran Saleem'],
    ['ColdTowne Conservatory', 'Improv 1 to 6', 'Will Cleveland, Dave Buckman'],
    ['Royal Shakespeare Company', 'Lizz Ketterer Scholar', 'Michael Dobson'],
    ['UT Austin', 'Early Modern Drama', 'James Loehlin'],
  ]],
];
const SKILLS = [
  ['Comedy & Hosting', 'improv, stand-up, host / emcee, voiceover'],
  ['Music', 'singer, guitar, saxophone (alto, baritone, soprano), whistler'],
  ['Physical', 'stage combat, Kajukenbo, tap (basic), distance running, cycling, yoga'],
  ['Other', "tarot reading, puppetry (marionette), Russian, driver's license, valid passport"],
  ['Dialects', 'Standard American, New York, Southern, Texan, British RP, Cockney, Irish, Scottish, Australian, Russian'],
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const dot = ' &nbsp;·&nbsp; ';

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: Letter; margin: 0.5in 0.7in; }
  body { margin: 0; font-family: "Times New Roman", Times, serif; font-size: 11pt; color: #000; }
  h1 { margin: 0; text-align: center; font-size: 26pt; font-weight: 700; border-bottom: 1px solid #000; padding-bottom: 4px; }
  .info { text-align: center; margin: 8px 0 0; line-height: 1.45; }
  section { margin-top: 15px; }
  h2 { margin: 0 0 6px; font-size: 12.5pt; font-weight: 700; border-bottom: 1px solid #000; padding-bottom: 2px; }
  h2 em { font-weight: 400; font-size: 11.5pt; }
  .r { display: grid; grid-template-columns: 36% 32% 32%; line-height: 1.48; }
  .r span:last-child { text-align: right; }
  .s { line-height: 1.48; }
</style></head><body>
  <h1>ISTO BARTON</h1>
  <p class="info">${CONTACT.map(esc).join(dot)}<br>${STATS.map(esc).join(dot)}</p>
  ${SECTIONS.map(([title, note, rows]) => `<section><h2>${esc(title)}${note ? ` <em>(${esc(note)})</em>` : ''}</h2>${rows.map(r =>
    `<div class="r">${r.map(x => `<span>${esc(x)}</span>`).join('')}</div>`).join('')}</section>`).join('')}
  <section><h2>SPECIAL SKILLS</h2>${SKILLS.map(([k, v]) => `<div class="s"><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')}</section>
</body></html>`;

if (/\(\d{3}\)|\d{3}[-. ]\d{3}[-. ]\d{4}/.test(html)) { console.error('Refusing to build: phone number found.'); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.pdf({ path: OUT, format: 'Letter', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('Wrote', OUT);
