# PROMPT FOR A NEW CONVERSATION

Copy everything below the line into a new chat, with
`RUTUJA-v12x.zip` and `HANDOVER.md` attached.

---

I am continuing a website build already in progress. Read this whole
message before doing anything, then read the attached HANDOVER.md.

## WHAT THIS IS

**ऋतुजा पब्लिकेशन** — a primary-education publisher in Padhegaon,
Shrirampur, Ahilyanagar, Maharashtra. Books for Std 1 to 5 in Marathi,
Semi-English and English medium. The buyers are schools, retailers and
parents in rural and semi-urban Maharashtra.

Live at `rutujapublication-in.github.io`. Current version **v12x**.

Plain HTML, CSS and vanilla JavaScript. No framework, no build step.
GitHub Pages hosting, Google Sheets and Apps Script backend. Everything
must keep working on a **360px Android phone on slow rural 4G**. That
constraint decides most design arguments.

## ATTACHED

- `RUTUJA-v12x.zip` — the complete site, 40 files
- `HANDOVER.md` — the full context, also inside the zip at `site/`

## READ IN THIS ORDER

1. `HANDOVER.md`
2. `data/story.json` — the nine slides and every per-slide setting
3. `UPLOAD-ME-FIRST.txt`

Do not read the whole stylesheet or app.js up front. They are 117KB and
92KB. Search them for what a task actually needs.

## TWO SECTIONS ARE LOCKED

**Section 1 — the nine story slides**
`data/story.json`, checksum `b9268d0e72fbc9a2b186b83208e68a6b`

    slide  chapter      sec   background   settings
      1    ओळख          4.0   #4B2A45      defaults
      2    वारसा        5.5   #3C354B      mr 13.0 / en 13.5, boxes 12.6 / 16, both one line
      3    दारं         5.0   #2E4051      mr 14.5 / en 12.0, boxes 11.5 / 17, mr one line
      4    दिशा         5.5   #1F4A57      mr 14.5 / en 13.5, boxes 13 / 16, mr one line
      5    तीन विचार    5.0   #10555C      big_boxes
      6    पाया         5.5   #184E52      en 12.8
      7    सुरुवात      5.5   #1F4848      defaults
      8    म्हणूनच      4.0   #27413E      en 13.5, box en 17, wraps
      9    विश्वास      5.0   #2F3A34      en 12.5, box wraps

45-second cycle. 244px band, fixed height so the buttons below never
move. Colours came from a band I supplied, walking plum to forest.

**Section 2 — the three action buttons**
the CSS block beginning `/* THREE ACTIONS`, checksum `da870d52dd16`

    grid            1fr 72px 1fr, gap 6px
    outer 130px, middle 72px, padding 5px
    arrow 11px, gap 2px, indent 13px

    button 1   पुस्तके पाहा              See Books
               दर व विशेष सवलती          Rates with Its Offers
    button 2   व्हिडिओ / बघा             Watch / Videos
    button 3   चौकशी करा / मागणी नोंदवा  Enquire / Place an Order
               थेट व्हॉट्सॲपवर बोला      Talk to us on WhatsApp

    marathi 17.5px main, 9.3px secondary
    english 13px main, 7.7px secondary

Eleven effects, all required and all verifiable in the CSS: key breathes,
sheen left to right, top edge light, silver rim turning clockwise, arrow
breathing and flashing, raised base edge, press sinks, lift on hover,
video plate pulses, video ring turns, video text glows.

## WHAT LOCKED MEANS

Locked against **you**, not against me. I can ask for changes to either
section at any time and you should make them, then re-lock at the new
state.

But while working on anything else — a new page, a bug, an improvement
somewhere else entirely — **do not touch them.** Not the Marathi, not
the English, not layout, sizes, colours, effects or spacing. Not to
tidy. Not because something could be better.

**And do not make global changes that could reach them.** No font
changes, no shared padding trims, no media query edits, no regex
cleanups. If a fix genuinely requires touching something shared, **tell
me first and wait for my answer** rather than doing it and reporting
afterwards. This has been the single largest source of wasted work.

## HOW I WORK

**I test on a real 360px Android phone in Chrome.** My screenshots are
the ground truth. If your calculation says something fits and my
screenshot shows it does not, your calculation is wrong.

**I review like a quantity surveyor**, because I am one. I will spot a
two-pixel misalignment and I will be right about it.

**I want exactness.** Say what was done and what was not. If something is
only partly done, say which part and why.

**I want the reason.** "The media query at 389px was overriding it" is
worth more to me than "fixed".

**I do not want unrequested changes.** Fixing slide 4 does not license
touching slide 5.

**When I say something is wrong, investigate before defending.** Several
times you were technically right that the file contained the fix, and
still wrong, because the cascade meant it never rendered.

## MISTAKES ALREADY MADE — DO NOT REPEAT

**Never delete CSS rules with a regex.** This left fourteen dangling
selectors and forty-seven duplicate rules across several builds. A
selector with no braces silently swallows the rule after it. Several
slide and button effects stopped working and neither of us could see
why. Edit named blocks in place.

**Verify the cascade, not the file.** A change can be written correctly
and never render because a later rule or a media query overrides it.
This happened three separate times. Check what applies at 360px.

**Version-stamp every build.** The index.html footer, the app.js VERSION
constant and every `?v=` tag must agree. A mismatch produces "my changes
are not showing" and wastes a round.

**Cache-bust the data files.** They are fetched with `?v=` + VERSION.
Without it the browser serves a cached story.json forever.

**A size that worked in one font will not work in another.** Copying
15.4px from a Mukta build into a Lora build broke two slides.

**The height model underestimates Lora and ignores box line-breaks and
chip wrapping.** Treat it as a guide, never a verdict.

## THE ROUTINE BEFORE EVERY BUILD YOU SEND ME

    node --check on app.js
    every data-t key exists in sitetext.json
    every class used has a CSS rule
    braces balanced
    no dangling selectors, empty rules or lists ending in a comma
    Section 1 checksum matches
    Section 2 checksum matches
    version stamps agree
    boot test, render test, form prefill test

Then package the zip, present it, and give me the upload steps. Always
name the version I should see in the footer.

## THE DATA

Five books: चला वाचूया झटपट (60), इंग्लिश प्रायमर विथ फोनिक्स (75),
गणितमित्र भाग १ (50), गणितमित्र भाग २ (60), अक्षरमित्र सुलेखन पुस्तिका (50).

Four YouTube videos, all tagged Book Explanation and linked to a book.
36 Maharashtra districts, 359 talukas, 35 other states.
282 bilingual labels in sitetext.json.

The logo is a **trademark**. Use it whole, resized only. It was once
cropped to remove the name; that was wrong and was reverted.

Fonts are settled and should not be reopened: Marathi uses Baloo 2 for
display and Mukta for reading and pressing; English uses Lora for reading
and Mukta for pressing. Below 16px, on a dark background, or on anything
tappable — Mukta, both languages.

## WHAT IS NOT BUILT

Four pages a visitor can reach and find empty: **Experiences, Q&A,
Authors, About Us.** Plus a News section, never started.

Waiting on me: the author photograph of सौ. मीना सुनिल गिरमे, the
publication story and founding year, Facebook and Instagram links, book
page counts, sample inside pages which keep आत पाहा hidden until they
exist, school and teacher photographs, real Q&A content, advertisement
images, and the newer RUTUJA_MASTER_DATA.xlsx on my Drive.

Deferred: the domain rutujapublication.in, Google Sheets as a live CMS,
and a possible row of book covers below the buttons.

## HOW WE WILL WORK FROM HERE

I will bring you one screen at a time — a section, a page, or a bug —
usually with a screenshot. For each one:

**Diagnose before building.** Tell me the cause, not just that you have
a fix. If you are guessing, say you are guessing.

**Measure, then state the numbers.** Widths, heights, what fits and what
does not, and where the room came from.

**If two of my requirements conflict, say so and let me choose.** Do not
pick one silently. This has happened over text length against alignment,
and over button width against text size.

**Change only what I named.** If you believe something adjacent also
needs changing, say so and wait.

**After I accept a section, lock it** the way Sections 1 and 2 are
locked, with a checksum, and check it on every build afterwards.

## START BY

1. Confirming you have read HANDOVER.md.
2. Verifying both lock checksums against the files in the zip and
   telling me the result.
3. Listing what is unbuilt, so I can choose what we do next.

Do not start any work until I choose.
