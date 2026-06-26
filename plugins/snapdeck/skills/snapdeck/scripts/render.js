// Render every slides/*.html to a PNG at 1280x720 dsf 2 (-> 2560x1440, crisp 16:9).
// Waits for web fonts to load. Usage: node render.js [slidesDir]
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { launch, sleep } = require('./lib');

(async () => {
  const DIR = process.argv[2] || 'slides';
  const browser = await launch(puppeteer, { width: 1280, height: 720, dsf: 2 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.html')).sort()) {
    const name = f.replace('.html', '');
    await page.goto('file://' + path.resolve(DIR, f), { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluateHandle('document.fonts.ready');
    await sleep(400);
    await page.screenshot({ path: path.join(DIR, `${name}.png`) });
    console.log('rendered', name + '.png');
  }
  await browser.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
