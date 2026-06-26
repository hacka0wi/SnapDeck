---
name: cap-app-to-pptx
description: >
  Build polished, full-bleed PowerPoint training/demo decks from a LIVE web app.
  Captures real UI screenshots deterministically via headless Chrome (CDP/puppeteer) —
  injecting the logged-in session to skip login, forcing light mode, opening modals/tabs,
  and reading element coordinates for crisp callouts — then renders HTML/CSS design slides
  to PNG and assembles everything as full-bleed picture slides in a .pptx.
  Use whenever the user wants to (1) create or update a training manual / demo deck that
  shows screens of an internal web app (e.g. Orch.io at neb-ow.oneweb.tech), (2) "recapture
  screenshots" for a deck, (3) turn a UI walkthrough into slides with numbered step callouts,
  or (4) restyle a screenshot-heavy deck into one consistent modern theme. Trigger on phrases
  like "make a deck from the app", "cap the screens into pptx", "recapture the screenshots",
  "training slides for <app>", "เอาจอใส่สไลด์", "ทำคู่มือ/เด็คจากระบบ".
---

# cap-app-to-pptx — live web app → polished PowerPoint

This skill produces decks the way a good design pipeline does: **author each slide as
HTML/CSS, render it to a 1920×1080-class PNG with headless Chrome, and drop the PNGs into the
deck full-bleed.** Do NOT lay slides out with python-pptx textboxes/shapes — pixel control
(shadows, gradients, fonts, framed screenshots) is the whole point.

Two kinds of slide:
- **Design slides** (title, dividers, diagrams, tables, code) — HTML/CSS → PNG. Network-free.
- **Screenshot slides** — REAL captures of the running app, placed full-bleed with optional
  numbered callouts. Captured via headless Chrome driving the live app (CDP).

## Pipeline (3 stages)

```
1. CAPTURE   scripts/capture.js   live app → shots/<key>.png + shots/<key>.rects.json
2. GENERATE  scripts/slides.py    content + shots → slides/<key>.html      (design system)
   RENDER    scripts/render.js    slides/*.html → slides/*.png  (headless Chrome, dsf 2)
3. ASSEMBLE  scripts/assemble.py  ordered slides/*.png → out.pptx (16:9, full-bleed)
```

Work in a scratch dir (e.g. the session scratchpad), `npm i puppeteer-core` once, and use the
**system Chrome** via `executablePath` (not a bundled Chromium). Run capture/render with the
sandbox disabled (they need network + to launch Chrome).

## Prerequisites
- System Google Chrome (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` on macOS).
- Node: `npm i puppeteer-core` in the work dir.
- Python: `python3 -m pip install python-pptx Pillow`. On macOS, a broken Homebrew `python3`
  (3.14 pyexpat) is common — use `python3.11` if `import pptx` fails.

## Capturing the live app (the hard, valuable part)

`scripts/capture.js` is config-driven. Key techniques baked in — keep them:

1. **Skip login by injecting the session.** Most SPAs keep auth in `localStorage`. Read the
   value from a browser you're already logged into (e.g. via the Chrome MCP `javascript_tool`:
   `localStorage.getItem('auth-storage')`) and write it to `auth.json`. capture.js sets it with
   `page.evaluateOnNewDocument` BEFORE any page script runs, so every navigation is authed.
   (httpOnly auth cookies are not needed — the client AuthGuard reads localStorage.)
2. **Force LIGHT mode** (decks must be light). The app theme often re-asserts on hydration, so
   set it BOTH ways and AFTER load: `localStorage[themeKey]=light`, `emulateMediaFeatures
   prefers-color-scheme:light`, and `document.documentElement.setAttribute('data-theme','light')`
   right before each screenshot. Verify each shot is light before using it.
3. **Open modals/rows with a REAL mouse click** at the element's bounding-box centre
   (`page.mouse.click(x,y)`). `el.click()` frequently does NOT trigger row/card handlers.
4. **Open forms/tabs by button/tab text**, preferring the smallest top-right-most match
   (avoids clicking a wrapper div that merely contains the text).
5. **Read element rects** (`getBoundingClientRect` in CSS px at the capture viewport) for every
   element you'll point a callout at — labels→their input, menu items, buttons, table rows.
   Store them in `<key>.rects.json` so the generator can place crisp markers deterministically.
6. **Below-the-fold fields** need a `scrollIntoView` then a second capture/rects file.
7. **Never trigger destructive actions** to get a screenshot (delete, encrypt a real column,
   submit a form against prod). Capture the screen that SHOWS the control; don't click it.

Capture viewport: 1600×1000 at `deviceScaleFactor:2` (→ 3200×2000 PNG). This is 16:10; see the
full-bleed crop note below.

## Design system (lock every value; adapt per brand)
- Font: **Prompt** (via Google Fonts `@import`; headless Chrome fetches it). Latin/technical
  terms highlighted in accent blue (`.hl`); Thai heading then `(English term)`.
- Colours: navy `#16264f` text, accent `#2563eb`, success `#0f9950`, old/red `#d93a3a`.
- No score numbers, no `✓` glyphs (reads as AI filler). Headings lead with the useful action.
- Footer: small, neutral (set to the deck's product). Page numbers optional.

## Screenshot-slide layout (what the user converged on)
- **Full-bleed**: the screenshot fills the entire slide. No white border, no frame.
- A **compact frosted card** top-left = pill + title ONLY (no step legend) so it never covers
  form fields.
- **Numbered circle markers** placed BESIDE the target element (to its right; flip left if it
  would run off-slide). **No ring/box outlines** — number only, never overlapping content.
- Full-bleed crop math: a 16:10 capture into a 16:9 slide with `object-fit:cover;
  object-position:top` shows the **top 90%** of the image. So marker% = `x/1600`, `y/900`
  (use `VYH=900`, not 1000). Elements you annotate must be within the top 900 logical px.
- "Result" screens with no steps → caption card (pill + title + one-line description), no markers.

## Assembling
`scripts/assemble.py` builds a fresh 16:9 deck (13.333×7.5 in) and adds each PNG full-bleed
(`add_picture(png,0,0,width=W,height=H)`) in an explicit `ORDER` list. When restyling an
existing deck, first extract its embedded images + titles (python-pptx `shape.image.blob`,
`shape.text_frame`) to reuse content, then regenerate every slide as a PNG and assemble fresh.

## QA
Thumbnail-grid the result (`pptx` skill's `scripts/thumbnail.py`) and eyeball: every slide light
mode, markers beside (not on) content, cards not covering key fields, consistent footer, correct
order. Re-render only the slides you change.

## Files
- `scripts/lib.js` — puppeteer helpers (session inject, force-light, click-by-text, rect read).
- `scripts/capture.js` — config-driven live capture (edit the `CFG`/`AUTH`/`ORIGIN` at top).
- `scripts/slides.py` — full-bleed HTML generator: `steps_slide()` (markers) + `caption_slide()`.
- `scripts/render.js` — render `slides/*.html` → PNG at 1280×720 dsf 2.
- `scripts/assemble.py` — ordered PNGs → `.pptx`.
- `example-config.json` — a worked capture config.

These are templates: copy into your work dir and adapt the CONFIG blocks (origin, Chrome path,
auth/theme keys, per-page targets, slide content, order) to the target app.
