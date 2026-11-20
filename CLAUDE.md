# istobarton.com

Actor website for Isto Barton (NYC, non-union screen actor). Static HTML/CSS/JS, no build step. Hosted on Cloudflare Workers (static assets, wrangler.jsonc; .assetsignore keeps repo files off the live site); every push to main deploys.

## Ground rules
- Sleek and professional: should read two to three career tiers up. No cutesy styling, no white backgrounds.
- Copy: no em dashes anywhere (use colons, commas, parentheses). Short and direct.
- No placeholder links or text. If a link is unknown, hide the element.
- Never put a phone number on the site or the resume PDF.

## Design system
- Colors (css/site.css :root): Slate #2A3236 (pages), Deep #232A2E, Iris #4D5964 (casting band, his eye color), Mustard #D4A73A (accent, primary buttons), Paper #F5F5F3.
- Fonts are self-hosted in /fonts: Jost 400/500 (UI), Cormorant Garamond 500 italic (titles, quotes). Do not add Google Fonts or other CDNs.
- Section headers: mustard, letterspaced caps, hairline rule (.rsec h2 / .msec h2).
- Home: split layout; four outfit-colored dots switch headshot + paired quote. Lands on Quiet Wound.
- Nav: Resume · Gallery · Media · Contact. Actors Access + Backstage are mustard buttons (.hbtn) in the header of every inner page and under the quote on home; casting matters more than social. Instagram is a text link in the footer only.

## Pages
- index.html, resume.html, gallery.html, media.html, contact.html, privacy.html, 404.html
- Images: assets/ as responsive picture elements (WebP + JPG at 480/800/1200/1600). First visible image eager, the rest lazy.
- Videos: media.html play buttons use data-video keys; URLs live in js/site.js VIDEOS (youtube-nocookie embeds, loaded only on click). Self-tape thumbnails come from i.ytimg.com.
- Downloads: downloads/Isto-Barton-Resume.pdf (2 pages) and downloads/Isto-Barton-Headshots.zip. If the resume page changes, regenerate the PDF: `npm run serve`, then `npm run resume-pdf` (builds it from resume.html).

## Security and quality bar
- _headers holds CSP, HSTS and caching. Any new third-party origin must be added to the CSP deliberately (and mentioned on privacy.html if it touches visitors).
- Target: Lighthouse mobile 100 on home and resume, 98+ elsewhere; 0 broken links; one H1 per page; no horizontal scroll at 390, 820, 1440 px.
- Before pushing: `npm install`, `npx playwright test`, `npm run links`. CI (.github/workflows/checks.yml) runs the same on Chromium, Firefox, WebKit and iPhone.
- Monthly analytics: .github/workflows/analytics-report.yml posts a GitHub issue on the 1st (needs CF_API_TOKEN, CF_ACCOUNT_ID, CF_SITE_TAG secrets).

## Project tracking
Isto tracks this in Notion: Isto HQ > Projects > "Acting website (istobarton.com)", including the launch checklist. Update it when launch items move.
