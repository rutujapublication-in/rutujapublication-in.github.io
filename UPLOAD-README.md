# RUTUJA — v18p · UPLOAD

Six files. Everything else in your repository is untouched and does not
need uploading again.

---

## WHAT TO UPLOAD

    index.html                 22 KB
    assets/css/style.css      264 KB
    assets/js/app.js          149 KB
    data/sitetext.json         46 KB
    data/story.json            15 KB
    data/vision.json           19 KB      <- new file, created by this build

**28 files are byte-identical to the v16x package you first sent** — all
the book covers, the logos, the favicons, `content.json`, `qa.json`,
`locations.json` and the docs. They have not changed in any build and
never need re-uploading.

---

## HOW TO UPLOAD

1. Extract this zip. You get `index.html`, an `assets` folder and a
   `data` folder, all at the top level — **no wrapper folder**.

2. GitHub → your repository → **Add file → Upload files**

3. Drag in three things: **`index.html`**, the **`assets` folder**, the
   **`data` folder**. Drag the folders themselves, not the files inside
   them — that is what keeps the paths correct.

4. Commit. Wait two minutes.

5. Open the site and pull down to hard-refresh.
   **The footer must read `v18p`.**

**After committing, check the repository root** shows `index.html`,
`assets` and `data` directly — not a folder containing them. A nested
upload is the usual cause of a blank page.

---

## IF THE UPLOAD RETURNS HTTP 400

- Sign out of GitHub, sign back in, go straight to the upload page and
  upload immediately. A stale session token gives exactly this error.
- Try mobile data instead of wifi.
- Upload `index.html` first, then the two folders separately.

---

## IF ANYTHING MISBEHAVES

Open the browser console — Chrome → three dots → More tools →
Developer tools → Console.

Every module now starts inside its own guard, so a failure logs
`init failed: <name>` with the reason instead of stopping the page. An
unguarded throw used to halt boot and everything after it never ran,
which showed as a blank site.

---

## BASELINES — put these in START-HERE.md

    CSS duplicate selectors  64
    CSS braces               2266 / 2266
    JS modules               17
    Keyframes                98 unique, none unused
    Labels                   411 per language
    Section 1 md5            8676a4a69bb0ed8575ed21ca9013cacd

The md5 changed in v17t when you approved the slide timings; the rest
moved as work landed. **If START-HERE.md still records the old numbers,
your next audit will report three failures that are not real.**

---

## STILL OPEN — not in these files

**The Visitors tab in your Google Sheet.** Registrations have nowhere to
land without it. v17x made a failed send honest — the person is told
plainly, the details are kept on the device and retried on the next
visit — but it cannot create the tab.

**Two lines in Apps Script** for real order numbers:
`body = stampOrderNo(body);` after the JSON parse, and returning
`order_no` in the response.

**Test after upload:** register once on the live site.
A green tick and a number means the Sheet is working end to end. An
amber panel reading *माहिती अजून पोहोचली नाही* means it is not — and now
you know, instead of a tick over a lost row.
