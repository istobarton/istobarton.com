# istobarton.com

Plain static site (HTML, CSS, a little JS). No build step: this folder **is** the site.
Anyone (human or AI) can edit it with a text editor and redeploy by pushing to `main`.

## What's here
| Path | What |
|---|---|
| `index.html` | Home: headshot + name; four colored dots swap headshot and quote |
| `resume.html`, `gallery.html`, `media.html`, `contact.html`, `privacy.html`, `404.html` | The other pages (Cloudflare serves `/resume` from `resume.html`) |
| `css/site.css` | All styling. Colors are variables at the top |
| `js/site.js` | Dots, photo viewer, video players. **Video links live at the top of this file** |
| `assets/img/` | Photos, each in 2 formats (WebP + JPG) and several widths |
| `fonts/` | Jost + Cormorant Garamond, self-hosted (SIL Open Font License) |
| `icons/` | Official social icons from Simple Icons (CC0) |
| `downloads/` | Resume PDF (no phone number) + headshot zip |
| `_headers` | Security + caching headers for Cloudflare |
| `tests/`, `playwright.config.mjs`, `package.json` | Automated checks (not needed to run the site) |
| `.github/workflows/` | Checks on every push + quarterly; monthly analytics report |

## Launch checklist (one evening)
**Accounts, all in your name, 2FA on each:** GitHub, Cloudflare, Squarespace Domains (registrar), Gmail.

1. **GitHub:** new private repo `istobarton-site`, push this folder to `main`.
   Settings → Code security: turn on Dependabot alerts, secret scanning, push protection.
2. **Cloudflare Pages:** Workers & Pages → Create → Pages → Connect to Git → pick the repo.
   Framework: None. Build command: blank. Output directory: `/`. Every push to `main` now deploys;
   every other branch gets its own preview URL.
3. **Domain:** Cloudflare → Add a site → `istobarton.com` (Free). At Squarespace Domains → DNS → Nameservers →
   switch to the two Cloudflare gives you. Then Pages project → Custom domains → add `istobarton.com` + `www`.
   Squarespace: confirm auto-renew ON and domain lock ON.
4. **HTTPS:** Cloudflare → SSL/TLS → Full (strict); Edge Certificates → Always Use HTTPS ON, HSTS ON.
5. **Email:** Cloudflare → Email → Email Routing → `hello@istobarton.com` → your Gmail.
   Email Routing adds SPF + DKIM automatically. Add DMARC: DNS → TXT `_dmarc` = `v=DMARC1; p=quarantine; rua=mailto:hello@istobarton.com`.
   To send *as* hello@: Gmail → Settings → Accounts → Send mail as.
6. **Analytics (cookie-free, no banner needed):** Pages project → Metrics → Web Analytics → Enable.
7. **Monthly report:** Cloudflare → My Profile → API Tokens → Create → *Account Analytics: Read*.
   GitHub repo → Settings → Secrets → Actions → add `CF_API_TOKEN`, `CF_ACCOUNT_ID` (Cloudflare dashboard sidebar),
   `CF_SITE_TAG` (Web Analytics → your site → "Manage site" shows the site tag).
   On the 1st of each month a GitHub issue with last month's numbers appears and GitHub emails it to you.
   Run it any time: Actions → monthly analytics report → Run workflow.
8. **Search:** Google Search Console + Bing Webmaster Tools → add `istobarton.com` (DNS verification works through Cloudflare) → submit `https://istobarton.com/sitemap.xml`.
9. **Uptime:** UptimeRobot (free) → HTTP monitor on `https://istobarton.com` → alert to your email.
10. **Test on the live URL:** your iPhone (Safari) + one Android, then securityheaders.com and observatory.mozilla.org (both should grade A).
11. Cancel the Squarespace *website* plan (keep the domain registration).

## Fill-ins (anything blank is hidden, nothing shows a placeholder)
Edit the HTML directly:
- TikTok, YouTube, IMDb links: add to the social icon rows (copy the Instagram `<a>` and swap the icon file).
- Sub/Urban Photography website: wrap their name in a link in `gallery.html`.
- Video embed URLs in `js/site.js` (`VIDEOS`). Until filled, the clips show as stills.

## Everyday edits
- **Text:** open the page's `.html`, change the words, commit, push. Live in about a minute.
- **A credit:** in `resume.html` each credit is one `<div class="row3">…</div>`; copy a line, edit it.
  Then rebuild the PDF: `npm run serve`, and in another tab `npm run resume-pdf`.
- **A photo:** export it as `name-800.jpg` and `name-800.webp` (plus 480 and 1200/1600 if you have them) into
  `assets/img/`, then copy an existing `<picture>` block and change the name. Or ask Claude to do it.
- **Roll back:** Cloudflare → Pages project → Deployments → pick the last good one → "Rollback to this deployment".
  (Or `git revert` the bad commit and push.)

## Checks
- On every push and once a quarter, GitHub runs smoke tests in Chrome, Firefox, Safari and iPhone emulation,
  plus a broken-link scan (`.github/workflows/checks.yml`).
- Locally: `npm install && npx playwright install && npm test`; links: `npm run serve` then `npm run links`.
- Last local results (Oct 30, 2026): Lighthouse mobile 100/100/100/100 on home + resume, 98+ everywhere;
  0 broken links across 186; one H1 per page; no horizontal scroll at 390, 820, 1440 px.

## Costs
| Item | Cost |
|---|---|
| Domain (Squarespace Domains, renew yearly) | ~$20/yr |
| Cloudflare Pages, DNS, Email Routing, Web Analytics | $0 |
| GitHub (private repo + Actions minutes used here) | $0 |
| UptimeRobot (free tier) | $0 |

## Quarterly check (put it on the calendar: first Monday of Jan / Apr / Jul / Oct)
- GitHub Actions "checks" green? Merge any Dependabot PRs.
- Lighthouse on the live site (Chrome DevTools → Lighthouse → Mobile).
- Domain renewal date and auto-renew still on.
- Anything stale: newest credits, headshots, quotes.
