# Rutuja Publication — Website

Bilingual (Marathi / English) educational publication website.
Built as plain HTML + CSS + JavaScript. No build step, no framework, no dependencies.

## Folder structure

```
index.html              main page
assets/css/style.css    all styling; colours are at the top of the file
assets/js/app.js        language, routing, top strip, contact
assets/img/             book covers, author photos, advertisements
data/sitetext.json      all bilingual interface text (127 keys)
data/locations.json     36 districts, 359 talukas, 35 other states
```

## How to change things

| To change | Edit |
|---|---|
| Colours | `assets/css/style.css` — the `:root` block at the top |
| Button and label text | `data/sitetext.json` |
| Contact numbers, address, top strip | `defaultConfig()` in `assets/js/app.js` |

From Phase 12 onward, content comes from Google Sheets instead of these files.

## Phases still to come

- Phase 6 — visitor gateway and registration backend
- Phase 7 — books, filters, price calculator
- Phase 8 — video and advertisement carousels
- Phase 9 — real experiences and submissions
- Phase 10 — Q&A, authors, publication pages
- Phase 11 — contextual WhatsApp links
- Phase 12 — Google Sheets as content manager
