# RUTUJA PUBLICATION — HANDOVER

Give this file and **RUTUJA-v12x.zip** to a new conversation. Everything
needed to continue is in one or the other. Nothing depends on remembering
the previous chat.

---

## WHAT THIS IS

A bilingual website for ऋतुजा पब्लिकेशन, a primary-education publisher in
Padhegaon, Shrirampur, Ahilyanagar. Books for Std 1–5 in three mediums.

**Live at** `https://rutujapublication-in.github.io`
**Current version** v12x
**Stack** plain HTML, CSS and JavaScript. No framework, no build step.
GitHub Pages for hosting. Google Sheets and Apps Script for the backend.

---

## HOW TO PICK THIS UP

1. Read this file.
2. Read `data/story.json` — the nine slides, with all their settings.
3. Read `UPLOAD-ME-FIRST.txt` for the upload routine.
4. Do not read the whole stylesheet or app.js unless a task needs it.
   They are 117KB and 92KB. Search them for what you need.

---

## TWO SECTIONS ARE LOCKED

**Locked means locked against the assistant, not against Sumit.**
He can change anything at any time by asking. The assistant must not
touch these while working on anything else.

### Section 1 — the nine story slides (v11y)

    data/story.json
    checksum  b9268d0e72fbc9a2b186b83208e68a6b

Nine slides between the header and the buttons. 244px band, fixed height
so nothing below moves. Both languages complete.

    slide  chapter      sec   text mr/en    box mr/en
      1    ओळख          4.0   14.5 / 14.5   auto / auto
      2    वारसा        5.5   13.0 / 13.5   12.6 / 16
      3    दारं         5.0   14.5 / 12.0   11.5 / 17
      4    दिशा         5.5   14.5 / 13.5     13 / 16
      5    तीन विचार    5.0   14.5 / 14.5   auto / auto
      6    पाया         5.5   14.5 / 12.8   auto / auto
      7    सुरुवात      5.5   14.5 / 14.5   auto / auto
      8    म्हणूनच      4.0   14.5 / 13.5   auto / 17
      9    विश्वास      5.0   14.5 / 12.5   auto / auto

45-second cycle. Colours from a band Sumit supplied: plum, violet-slate,
slate blue, petrol, teal, deep teal, teal-green, forest, and a ninth
derived one step further into green.

### Section 2 — the three action buttons (v12x)

    the CSS block beginning  /* THREE ACTIONS — compact keys */
    checksum  da870d52dd16
    labels    b3225f88d54a

    grid            1fr 72px 1fr, gap 6px
    outer buttons   130px each, middle 72px, padding 5px
    arrow           11px, gap 2px, indent 13px

    button 1 main   पुस्तके पाहा                See Books
    button 1 sub    दर व विशेष सवलती            Rates with Its Offers
    button 2        व्हिडिओ / बघा               Watch / Videos
    button 3 main   चौकशी करा / मागणी नोंदवा    Enquire / Place an Order
    button 3 sub    थेट व्हॉट्सॲपवर बोला        Talk to us on WhatsApp

    sizes           marathi    english
    main            17.5px     13px
    secondary        9.3px      7.7px
    video           12.5px     11.5px

Eleven effects, all required: key breathes · sheen left to right ·
top edge light · silver rim turns clockwise · arrow breathes and flashes ·
raised base edge · press sinks · lift on hover · video plate pulses ·
video ring turns · video text glows.

The middle button opens the videos page, filtered to book videos only.
Advertisement and experience videos added later will not appear there.

---

## HOW SUMIT WORKS

He is a civil engineer who does quantity surveying, and he reviews like
one. He will spot a two-pixel misalignment and he will be right about it.

**He wants exactness.** Say what was done and what was not. If something
is only partly done, say which part.

**He does not want unrequested changes.** Fixing his slide 4 does not
license touching slide 5. This has been the single biggest source of
friction in the project.

**He wants the reason, not just the fix.** "The media query at 389px was
overriding it" is more useful to him than "fixed".

**He tests on a real phone**, usually a 360px Android in Chrome. His
screenshots are the ground truth. If a calculation disagrees with what
he sees, the calculation is wrong.

---

## MISTAKES ALREADY MADE — DO NOT REPEAT

**Never delete CSS rules with a regex.** Doing so left fourteen dangling
selectors and forty-seven duplicate rules across several builds. A
selector with no braces silently swallows the rule after it. Several
slide and button effects stopped working and nobody could see why.
Edit named blocks in place.

**Check the cascade, not just the file.** A change can be written
correctly and still never render, because a later rule or a media query
overrides it. This happened three separate times. Verify what applies at
360px, not what is in the file.

**Version-stamp every build.** index.html footer, the app.js VERSION
constant, and the `?v=` tags must all match. A mismatch produces
"my changes are not showing" and wastes a round.

**Cache-bust the data files.** They are fetched with `?v=` + VERSION.
Without it the browser serves a cached story.json forever and edits
never appear. This cost several rounds before it was found.

**A number that worked in one font will not work in another.** Copying
15.4px from a Mukta build into a Lora build broke two slides.

**Measure before promising.** The height model in this project
underestimates Lora's width and does not account for box line-breaks or
chip wrapping. Treat it as a guide. His screenshots decide.

---

## THE ROUTINE BEFORE EVERY PACKAGE

    node --check assets/js/app.js
    every data-t key exists in sitetext.json
    every class used has a CSS rule
    braces balanced
    no dangling selectors, no empty rules, no lists ending in a comma
    Section 1 checksum matches
    Section 2 checksum matches
    version stamps agree
    boot test, render test, form prefill test

Then zip, then present. Always give the upload steps.

---

## WHAT IS BUILT

**Phase 3** design system · Baloo 2 and Mukta for Marathi, Lora and Mukta
for English · five standard colours · 282 bilingual labels.

**Phase 4** locations · 36 Maharashtra districts, 359 talukas, 35 other
states, all bilingual.

**Phase 5** shell · moving gold ribbon with a silver sweep · sticky
header · nine pages · language switch · mobile menu.

**Phase 6** visitor gateway · welcome screen · registration writing to a
private Google Sheet · honeypot · four offer cards.

**Phase 7** books · five real titles with covers and retina variants ·
filters by standard, medium, subject · slab pricing · 3D book treatment ·
discount shown in six places.

**Phase 8** media · four YouTube videos · separate video and ad carousels
· swipe, arrows, dots.

**Phase 9** ordering · माझी पुस्तके · order window with book picker ·
live rate and discount as quantity changes · one shared buyer profile
across all forms · duplicate-row prevention · input rules · Look Inside.

**Phase 10–11** the story band and the three buttons, both locked.

**Site-wide** no text selection except form fields and order numbers ·
no image drag, long-press menu or right-click · everything cache-busted.

---

## WHAT IS NOT BUILT

Four pages a visitor can reach and find empty:

    Experiences    Q&A    Authors    About Us

Plus a News section, never started.

**Waiting on Sumit:** author photograph of सौ. मीना सुनिल गिरमे · the
publication story and founding year · Facebook, Instagram, email · book
page counts · sample inside pages, which keep आत पाहा hidden until they
exist · school and teacher photographs · real Q&A content ·
advertisement images.

**Waiting on his Drive:** the newer RUTUJA_MASTER_DATA.xlsx.

**Deferred:** the domain rutujapublication.in · Google Sheets as a live
CMS · a possible row of book covers below the buttons.

---

## FONTS — SETTLED, DO NOT REOPEN

    Marathi   Baloo 2 display · Mukta reading and pressing
    English   Lora reading · Mukta pressing

Tiro Devanagari Marathi was considered for Marathi reading and rejected
for now: it has only one weight and cannot go bold, so it fails on the
slides. It belongs on the About Us page later, on long passages against
a light background.

Rule: below 16px, on a dark background, or on anything tappable — Mukta,
both languages.

---

## FILES

    index.html                  the whole page, all nine sections
    assets/css/style.css        117KB
    assets/js/app.js            92KB
    data/sitetext.json          282 bilingual labels
    data/content.json           books, offers, videos, ads, config
    data/locations.json         districts and talukas
    data/story.json             the nine slides — Sumit edits this himself
    assets/img/rutuja-logo.png  1200×1043, transparent, name intact
    UPLOAD-ME-FIRST.txt         the upload routine
    EDIT-THE-SLIDES.txt         how to edit story.json
    HANDOVER.md                 this file

**The logo is a trademark and must never be altered.** It was once
cropped to remove the name; that was wrong and was reverted. Use it
whole, resized only.

---

## JAVASCRIPT MODULES

    RUTUJA    core — language, routing, rendering
    ENTRY     welcome screen and offer modals
    FORM      one shared form instance, prefilled everywhere
    RULE      input constraints applied at the keyboard
    BUYER     shared profile, prevents duplicate sheet rows
    BOOKS     grid, filters, detail page, price calculator
    MEDIA     video and ad carousels
    CART      माझी पुस्तके
    ORDER     the order window and book picker
    ORDERFORM buyer details inside the order window
    PEEK      Look Inside
    STORY     the nine slides

Initialisation order matters:
BOOKS → MEDIA → STORY → CART → ORDERFORM → ORDER → ENTRY

---

## BACKEND

Apps Script web app writing three tabs to a private Google Sheet named
RUTUJA_VISITOR_DATA: **Visitors** (15 columns), **Orders** (21), and
**Order_Items** (26, one row per book so it can be pivoted).

Endpoint is in app.js. Phone numbers are stored as text with the country
code. IDs are permanent — set status to DRAFT to hide a row, never delete.

---

## UPLOADING

    extract the zip
    GitHub → the repository → Add file → Upload files
    open the site folder → Ctrl+A → drag everything in
    Commit changes → wait 2 minutes → Ctrl+Shift+R
    confirm the footer shows the expected version

Delete old extracted folders first. Windows creates site (1), site (2)
and so on, and uploading the wrong one produces "GitHub sees no changes".
