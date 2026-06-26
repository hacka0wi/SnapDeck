// Reusable puppeteer-core helpers for capturing a live web app in LIGHT mode,
// with the logged-in session injected so login is skipped.
const fs = require('fs');

const CHROME = process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Launch headless system Chrome at 16:10 dsf2 (3200x2000 PNGs).
async function launch(puppeteer, { width = 1600, height = 1000, dsf = 2 } = {}) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', `--force-device-scale-factor=${dsf}`],
    defaultViewport: { width, height, deviceScaleFactor: dsf },
  });
}

// Inject auth-storage + theme into localStorage BEFORE any page script runs,
// on EVERY navigation, and emulate light color-scheme.
async function prime(page, { auth, themeKey, themeValue }) {
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.evaluateOnNewDocument((auth, tk, tv) => {
    try {
      if (auth) localStorage.setItem(auth.key, auth.value);
      if (tk) localStorage.setItem(tk, tv);
      document.documentElement.setAttribute('data-theme', 'light');
    } catch (e) {}
  }, auth, themeKey, themeValue);
}

// Re-assert light AFTER load (the app's theme store often re-asserts dark on hydration).
async function forceLight(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await sleep(500);
}

// Click an element whose trimmed text matches `txt` (anchored). Prefers a real
// button/tab/link, smallest + top-right-most (avoids wrapper divs). Returns the
// clicked centre, or null.
async function clickByText(page, txt, { small = true } = {}) {
  const c = await page.evaluate((t, sm) => {
    const re = new RegExp('^\\s*' + t + '\\s*$');
    let c = [...document.querySelectorAll('button,a,[role="tab"],[role="button"]')]
      .filter((e) => re.test((e.textContent || '').trim()))
      .map((e) => ({ r: e.getBoundingClientRect() }))
      .filter((o) => o.r.width > 30 && o.r.height > 14 && o.r.height < 64 && (!sm || o.r.width < 260));
    if (!c.length) return null;
    c.sort((a, b) => (b.r.x + b.r.y) - (a.r.x + a.r.y));
    const r = c[0].r;
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, txt, small);
  if (c) await page.mouse.click(c.x, c.y);
  return c;
}

// Real mouse-click at an element's bbox centre (works for row/card handlers that
// el.click() misses). `findExpr` is a function-source string returning an element.
async function mouseClickEl(page, findExpr) {
  const box = await page.evaluate((src) => {
    const find = eval(src);
    const el = find();
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + Math.min(r.width / 2, 400), y: r.y + r.height / 2 };
  }, findExpr);
  if (box) await page.mouse.click(box.x, box.y);
  return box;
}

// Read a rect (CSS px at capture viewport) for a target spec:
//   {by:'sel', q}                 first matching CSS selector
//   {by:'text', q, maxy}          element whose trimmed text === q (small, optional y cap)
//   {by:'menu', q}                sidebar item (x<240) whose text === q
//   {by:'label', q}               <label> starting with q → its input/select/textarea
//   {by:'row', q, ymin, ymax}     a wide row-ish element whose text matches /q/
async function rectOf(page, t) {
  return page.evaluate((t) => {
    const f = (el) => { if (!el) return null; const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    const all = [...document.querySelectorAll('*')];
    if (t.by === 'sel') return f(document.querySelector(t.q));
    if (t.by === 'text') { const re = new RegExp('^\\s*' + t.q + '\\s*$');
      return f(all.find((e) => re.test((e.textContent || '').trim()) && e.children.length <= 3 &&
        (!t.maxy || e.getBoundingClientRect().y < t.maxy) &&
        e.getBoundingClientRect().height < 60 && e.getBoundingClientRect().width < 420)); }
    if (t.by === 'menu') { const re = new RegExp('^\\s*' + t.q + '\\s*$');
      return f(all.find((e) => re.test((e.textContent || '').trim()) &&
        e.getBoundingClientRect().x < 240 && e.children.length <= 2 &&
        e.getBoundingClientRect().height > 14 && e.getBoundingClientRect().height < 60)); }
    if (t.by === 'label') { const l = [...document.querySelectorAll('label')]
        .find((x) => (x.textContent || '').trim().startsWith(t.q));
      if (!l) return null; const inp = l.querySelector('input,select,textarea') ||
        l.parentElement.querySelector('input,select,textarea') || l.nextElementSibling;
      return f(inp || l); }
    if (t.by === 'row') { const re = new RegExp(t.q, 'i');
      return f(all.find((e) => { const r = e.getBoundingClientRect();
        return re.test(e.textContent || '') && r.y > (t.ymin || 250) && r.y < (t.ymax || 460) &&
          r.height > 28 && r.height < 90 && r.width > 600; })); }
    return null;
  }, t);
}

module.exports = { CHROME, sleep, launch, prime, forceLight, clickByText, mouseClickEl, rectOf };
