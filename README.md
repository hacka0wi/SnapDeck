# deck-tools — Claude Code plugin marketplace

Plugins for turning a **live web app** into a polished, full-bleed **PowerPoint** deck.

## Plugins

### `cap-app-to-pptx`
Capture real UI screenshots from a running app via headless Chrome (inject the logged-in
session to skip login, force light mode, open modals/tabs, read element coordinates for crisp
numbered callouts), render HTML/CSS design slides to PNG, and assemble everything as full-bleed
picture slides in a `.pptx`. Ships a SKILL guide + ready-to-adapt scripts
(`lib.js`, `capture.js`, `slides.py`, `render.js`, `assemble.py`).

## Install (per developer)

```
# from a local clone:
/plugin marketplace add /path/to/claude-deck-tools
/plugin install cap-app-to-pptx@deck-tools

# or from a git remote once pushed:
/plugin marketplace add https://github.com/<org>/claude-deck-tools
/plugin install cap-app-to-pptx@deck-tools
```

Then invoke with `/cap-app-to-pptx`, or just ask: "make a training deck from the app",
"recapture the screenshots", "cap the screens into pptx".

## Requirements
- System Google Chrome
- Node (`npm i puppeteer-core` in the work dir)
- Python with `python-pptx` + `Pillow`

## Layout
```
.claude-plugin/marketplace.json     # marketplace manifest (lists plugins)
plugins/cap-app-to-pptx/
  .claude-plugin/plugin.json         # plugin manifest
  skills/cap-app-to-pptx/            # the skill (SKILL.md + scripts + example-config.json)
```

## Sharing with the team
Push this repo to GitHub, then teammates run the two `/plugin` commands above with the repo URL.
