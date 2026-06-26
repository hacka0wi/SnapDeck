# SnapDeck — Claude Code plugin marketplace

**Snap a live web app into a polished, full-bleed PowerPoint deck.**

## Plugin: `snapdeck`
Capture real UI screenshots from a running app via headless Chrome (inject the logged-in
session to skip login, force light mode, open modals/tabs, read element coordinates for crisp
numbered callouts), render HTML/CSS design slides to PNG, and assemble everything as full-bleed
picture slides in a `.pptx`. Ships a SKILL guide + ready-to-adapt scripts
(`lib.js`, `capture.js`, `slides.py`, `render.js`, `assemble.py`).

## Install (per developer)

```
# from a local clone:
/plugin marketplace add /path/to/snapdeck
/plugin install snapdeck@snapdeck

# or from a git remote once pushed:
/plugin marketplace add https://github.com/<org>/snapdeck
/plugin install snapdeck@snapdeck
```

Then invoke with `/snapdeck`, or just ask: "make a training deck from the app",
"recapture the screenshots", "cap the screens into pptx", "เอาจอใส่สไลด์".

## Requirements
- System Google Chrome
- Node (`npm i puppeteer-core` in the work dir)
- Python with `python-pptx` + `Pillow`

## Layout
```
.claude-plugin/marketplace.json     # marketplace manifest (lists plugins)
plugins/snapdeck/
  .claude-plugin/plugin.json         # plugin manifest
  skills/snapdeck/                   # the skill (SKILL.md + scripts + example-config.json)
```

## Sharing with the team
Push this repo to GitHub, then teammates run the two `/plugin` commands above with the repo URL.
