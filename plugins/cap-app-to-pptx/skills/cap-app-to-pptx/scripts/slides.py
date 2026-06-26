# -*- coding: utf-8 -*-
"""Full-bleed slide generator: screenshot fills the slide; compact frosted card (pill+title);
numbered markers BESIDE elements (no rings); or a caption card for result screens.

Import and drive it, e.g.:

    from slides import steps_slide, caption_slide, set_paths, BRAND
    set_paths(out="slides", shots="shots")
    steps_slide("s01","Sign in","Login with Username & Password","login.png","login.rects.json",
                [("Username","Enter Username"),("Password","Enter Password"),("Sign In","Click Sign In")])
    caption_slide("s02","Result","Audit Trail","audit.png","Every write is recorded with who / what / when")

Then render with render.js and assemble with assemble.py.
"""
import os, json, html, re

OUT = "slides"; SHOTS = "shots"
def set_paths(out=None, shots=None):
    global OUT, SHOTS
    if out: OUT = out
    if shots: SHOTS = shots
    os.makedirs(OUT, exist_ok=True)

# ---- design system (override BRAND values per project) ----
BRAND = dict(
    font="Prompt", navy="#16264f", accent="#2563eb", muted="#5b6b86",
    footer="<b>App</b> · Training Manual",
)
VYH = 900  # visible logical height after 16:10 capture is cover-cropped into a 16:9 slide

def CSS():
    return f"""
@import url('https://fonts.googleapis.com/css2?family={BRAND['font'].replace(' ','+')}:wght@300;400;500;600;700&display=swap');
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1280px;height:720px;font-family:'{BRAND['font']}',sans-serif;color:{BRAND['navy']};overflow:hidden}}
.slide{{position:relative;width:1280px;height:720px;overflow:hidden;background:#0f172a}}
.bg{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top left;display:block}}
.card{{position:absolute;left:34px;top:26px;max-width:440px;background:rgba(255,255,255,.95);backdrop-filter:blur(6px);border:1px solid rgba(22,38,79,.08);border-radius:16px;box-shadow:0 16px 42px rgba(15,23,42,.24);padding:16px 22px 18px}}
.pill{{display:inline-block;background:#e8eefc;color:{BRAND['accent']};font-weight:600;font-size:14px;padding:4px 14px;border-radius:999px}}
.card h1{{font-size:25px;font-weight:700;margin-top:9px;line-height:1.18}}.hl{{color:{BRAND['accent']}}}
.sub{{margin-top:9px;font-size:16px;color:{BRAND['muted']};line-height:1.45;max-width:560px}}
.mk{{position:absolute;width:34px;height:34px;border-radius:50%;background:{BRAND['accent']};color:#fff;font-weight:700;font-size:17px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(37,99,235,.6);border:3px solid #fff;transform:translate(-50%,-50%);z-index:3}}
.foot{{position:absolute;right:26px;bottom:14px;font-size:12px;color:rgba(255,255,255,.0)}}
"""

def _hl(t):
    parts = re.split(r'([A-Za-z][A-Za-z0-9 ._/&:+\-]*[A-Za-z0-9]|[A-Za-z])', t)
    return ''.join(f'<span class="hl">{html.escape(p)}</span>' if i % 2 else html.escape(p)
                   for i, p in enumerate(parts) if p)

def _load_rects(fn):
    d = json.load(open(os.path.join(SHOTS, fn)))
    vw = d.get('vw', 1600); vh = d.get('vh', 1000)
    rects = d.get('rects', {k: v for k, v in d.items() if isinstance(v, dict)})
    return vw, vh, rects

def _write(key, body):
    open(os.path.join(OUT, f"{key}.html"), "w").write(
        f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS()}</style></head>'
        f'<body><div class="slide">{body}</div></body></html>')

def steps_slide(key, pill, title, img, rectsfn, steps):
    """steps: list of (rectLabel, _ignored_text). A numbered marker is placed beside each
    element whose rect is in rectsfn. Markers go to the RIGHT of the element (flip left if it
    would run off-slide). No legend (keeps the card small so it never covers form fields)."""
    vw, vh, rects = _load_rects(rectsfn)
    marks = ""
    for i, (rk, _txt) in enumerate(steps, 1):
        r = rects.get(rk)
        if not r: continue
        lx = r['x'] / vw * 100; rw = r['w'] / vw * 100; rx = lx + rw
        cy = (r['y'] + r['h'] / 2) / VYH * 100
        mkx = (rx + 1.4) if rx < 92 else (lx - 2.4)
        marks += f'<div class="mk" style="left:{mkx:.1f}%;top:{cy:.1f}%">{i}</div>'
    _write(key, f'<img class="bg" src="file://{os.path.abspath(SHOTS)}/{img}">'
               f'<div class="card"><span class="pill">{html.escape(pill)}</span>'
               f'<h1>{_hl(title)}</h1></div>{marks}')

def caption_slide(key, pill, title, img, sub=""):
    """Result/overview screen: full-bleed image + pill+title+one-line description card. No markers."""
    s = f'<div class="sub">{_hl(sub)}</div>' if sub else ""
    _write(key, f'<img class="bg" src="file://{os.path.abspath(SHOTS)}/{img}">'
               f'<div class="card"><span class="pill">{html.escape(pill)}</span>'
               f'<h1>{_hl(title)}</h1>{s}</div>')
