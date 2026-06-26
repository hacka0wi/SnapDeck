// Config-driven live capture. Usage: node capture.js config.json
// Produces shots/<key>.png and shots/<key>.rects.json for each page in the config.
//
// config.json shape:
// {
//   "origin": "https://app.example.com",
//   "outDir": "shots",
//   "auth":  { "key": "auth-storage",  "file": "auth.json" },   // localStorage session
//   "theme": { "key": "theme-storage", "value": "{\"state\":{\"mode\":\"light\"},\"version\":0}" },
//   "pages": [
//     { "key": "01-list", "path": "/orch/audit", "wait": 3500,
//       "clicks": ["Route Type"],                                // optional: click tabs/buttons by text
//       "scrollToLabel": "Flow",                                 // optional: scroll a below-fold field into view
//       "openRow": "()=>[...document.querySelectorAll('div')].find(e=>/UPDATE/.test(e.textContent))", // optional modal
//       "targets": [ { "by":"menu","q":"Audit","label":"menu" },
//                    { "by":"row","q":"UPDATE","label":"row" } ] // rects for callouts
//     }
//   ]
// }
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { sleep, launch, prime, forceLight, clickByText, mouseClickEl, rectOf } = require('./lib');

(async () => {
  const cfg = JSON.parse(fs.readFileSync(process.argv[2] || 'config.json', 'utf8'));
  const OUT = cfg.outDir || 'shots';
  fs.mkdirSync(OUT, { recursive: true });
  const auth = cfg.auth ? { key: cfg.auth.key, value: fs.readFileSync(cfg.auth.file, 'utf8').trim() } : null;
  const themeKey = cfg.theme && cfg.theme.key;
  const themeValue = cfg.theme && cfg.theme.value;

  const browser = await launch(puppeteer);
  for (const pg of cfg.pages) {
    const page = await browser.newPage();
    await prime(page, { auth, themeKey, themeValue });
    await page.goto(cfg.origin + pg.path, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(pg.wait || 3500);
    await forceLight(page);

    for (const c of (pg.clicks || [])) { const r = await clickByText(page, c); await sleep(1800); }
    if (pg.openRow) { await mouseClickEl(page, pg.openRow); await sleep(1800); await forceLight(page); }
    if (pg.scrollToLabel) {
      await page.evaluate((lbl) => { const l = [...document.querySelectorAll('label')]
        .find((e) => (e.textContent || '').trim().startsWith(lbl)); if (l) l.scrollIntoView({ block: 'center' });
        else window.scrollBy(0, 600); }, pg.scrollToLabel);
      await sleep(800); await forceLight(page);
    }

    const rects = {};
    for (const t of (pg.targets || [])) rects[t.label] = await rectOf(page, t);
    fs.writeFileSync(path.join(OUT, `${pg.key}.rects.json`),
      JSON.stringify({ vw: 1600, vh: 1000, rects }, null, 1));
    await page.screenshot({ path: path.join(OUT, `${pg.key}.png`) });
    console.log(pg.key, '·', Object.entries(rects).map(([k, v]) => `${k}=${v ? 'ok' : 'MISS'}`).join(' '));
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
