# ACES Compliance Systems — Website

Marketing website for ACES Compliance Systems LLC — "Buying your time back." Multi-page since 2026-11-22.

- **Live:** https://acescompliancesystems.com
- **Stack:** Static HTML pages, hosted on Netlify (each page is a folder with its own index.html, so URLs look like /program/)
- **Form:** /contact/ submits to Supabase `website_consultation_requests` (source = `website_readiness_form`)
- **Deploy:** run "Push Website.bat" in the parent folder — Netlify auto-deploys from `main`

## Pages

- `/` (index.html) — hero, the readiness gap (Manufacturing Institute and PwC 2026 figures), Pilot callout, links to each page
- `/program/` — the 14-Day Pilot, the thirty-day Frontline AI Readiness Program, and the work that moves to the tool
- `/who-we-work-with/` — the operations, the sponsor, the first task
- `/about/` — Nour Alsharife, Founder
- `/faq/` — questions and answers (also published as FAQ structured data)
- `/contact/` — the form and Calendly
- `styles.css` and `site.js` are shared by every page. Old one-page links such as /#faq forward to the new pages.
- `archive/` — v1 OSHA-era site (not linked, blocked in robots.txt)

No prices on the site until the client agreement has been reviewed by a lawyer.
