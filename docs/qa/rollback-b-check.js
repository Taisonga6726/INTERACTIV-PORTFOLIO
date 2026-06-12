const { chromium } = require('playwright');

const PAGE = 'http://127.0.0.1:8767/INTERACTIV%20PORTFOLIO/portfolio.html';

function endsWithPath(src, rel) {
  return decodeURIComponent(src || '').replace(/\\/g, '/').endsWith(rel);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);

  const home1 = await page.evaluate(() => window.__heroVideoRouter.getState());
  let jumps = 0;
  let lastT = await page.evaluate(() => document.querySelector('.header-banner-video.is-top')?.currentTime || 0);
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(100);
    const t = await page.evaluate(() => document.querySelector('.header-banner-video.is-top')?.currentTime || 0);
    if (t - lastT < -0.15) jumps++;
    lastT = t;
  }

  await page.locator('#directionsGrid .direction-card').first().click();
  await page.waitForTimeout(400);
  const inner1 = await page.evaluate(() => window.__heroVideoRouter.getState());
  await page.waitForTimeout(6500);
  const inner1After = await page.evaluate(() => window.__heroVideoRouter.getState());

  await page.locator('.header-banner-link').click();
  await page.waitForTimeout(800);
  const home2 = await page.evaluate(() => window.__heroVideoRouter.getState());

  await page.locator('#directionsGrid .direction-card').nth(1).click();
  await page.waitForTimeout(400);
  const inner2 = await page.evaluate(() => window.__heroVideoRouter.getState());

  const paths = await page.evaluate(() => ({
    videoA: document.getElementById('heroBannerVideoA')?.getAttribute('src'),
    hasFallback: !!document.getElementById('heroBannerFallback'),
    hasPoster: !!document.getElementById('heroBannerVideoA')?.hasAttribute('poster'),
    crossfade: document.getElementById('heroBannerStack')?.style.getPropertyValue('--hero-crossfade'),
  }));

  await browser.close();

  const report = {
    paths,
    home1: { srcOk: endsWithPath(home1.src, 'var 01.mp4'), muted: home1.muted },
    homeLoopJumps: jumps,
    inner1: { srcOk: endsWithPath(inner1.src, 'в работу.mp4'), sound: !inner1.muted },
    inner1After: { muted: inner1After.muted, fp: inner1After.firstPassPending },
    home2: { srcOk: endsWithPath(home2.src, 'var 01.mp4'), muted: home2.muted },
    inner2: { sound: !inner2.muted, fp: inner2.firstPassPending },
    consoleErrors,
    pass:
      paths.videoA === '../video/var 01.mp4' &&
      !paths.hasFallback &&
      !paths.hasPoster &&
      home1.muted &&
      inner1.sound &&
      inner1After.muted &&
      home2.muted &&
      inner2.sound &&
      consoleErrors.length === 0,
  };
  console.log(JSON.stringify(report, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
