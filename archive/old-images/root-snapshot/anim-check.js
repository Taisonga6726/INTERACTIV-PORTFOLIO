const { chromium } = require('playwright');
const path = require('path');

const dir = __dirname;
const url = 'file:///' + path.join(dir, 'portfolio.html').replace(/\\/g, '/');
const prefix = process.argv[2] || 'header-anim-check';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url);
  const waits = [0, 5000, 5000, 5000];
  for (let i = 0; i < 4; i++) {
    if (waits[i] > 0) await page.waitForTimeout(waits[i]);
    await page.screenshot({
      path: path.join(dir, `${prefix}-frame${i + 1}.png`),
      clip: { x: 0, y: 0, width: 1440, height: 420 }
    });
  }
  await browser.close();
  console.log('done', prefix);
})();
