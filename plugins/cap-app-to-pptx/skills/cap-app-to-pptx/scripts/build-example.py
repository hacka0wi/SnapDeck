# -*- coding: utf-8 -*-
"""Example driver: turn captured shots into slide HTML, then render + assemble.

Full run from a work dir that contains scripts/ + shots/ (+ auth.json):

    npm i puppeteer-core
    node    scripts/capture.js  example-config.json     # shots/*.png + *.rects.json
    python3 scripts/build-example.py                     # slides/*.html
    node    scripts/render.js                            # slides/*.png
    python3 scripts/assemble.py out.pptx order.json      # out.pptx
"""
import json
from slides import set_paths, steps_slide, caption_slide, BRAND

set_paths(out="slides", shots="shots")
BRAND["footer"] = "<b>New e-Budgeting</b> · Training Manual"   # per-project brand

# screenshot slides with numbered callouts (rectLabel, step text)
steps_slide("login", "Sign in", "Login with Username & Password",
            "login.png", "login.rects.json",
            [("Username", "Enter Username"), ("Password", "Enter Password"), ("Sign In", "Click Sign In")])

steps_slide("audit", "Audit Trail", "View data-change history (Audit Trail)",
            "audit.png", "audit.rects.json",
            [("menu", "Open the Audit menu"), ("Filters", "Search / use Filters"),
             ("row", "Click a row for details")])

# result screens with a caption (no markers)
caption_slide("audit-detail", "Field-level", "Inspect changes per field (Changes)",
              "audit-detail.png",
              "The Changes tab shows OLD value then NEW value for every field, with Summary and Raw JSON")

# order of slides in the deck
ORDER = ["login", "audit", "audit-detail"]
json.dump(ORDER, open("order.json", "w"))
print("generated", len(ORDER), "slide HTML files + order.json")
