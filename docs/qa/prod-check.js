const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const url = 'https://interactiv-portfolio.vercel.app/';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleMsgs = [];
  const errors = [];
  page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => errors.push(e.message));

  const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  const title = await page.title();
  const status = resp ? resp.status() : null;

  const headerImg = await page
    .evaluate(() => {
      const el = document.querySelector('.header-banner-img');
      if (!el) return { error: 'not found' };
      return { src: el.src, naturalWidth: el.naturalWidth, complete: el.complete };
    });

  const islandBtns = await page.locator('.island-btn').count();
  const islandTiles = await page.locator('.island-tile, .island-card, .islands-grid > *').count();

  const assetChecks = await page.evaluate(async () => {
    const paths = [
      'images/hero/chapka-21x9-active.jpg',
      'images/islands/icon-vizual.png',
      'images/islands/icon-video.png',
      'images/islands/icon-content.png',
      'images/islands/icon-vibe-coding.png',
      'images/islands/icon-gpt-agent.png',
      'images/islands/music.png',
      'js/splash-cursor.js',
      'logo-tg.png',
      'sign-tanya.png',
    ];
    const results = [];
    for (const p of paths) {
      try {
        const r = await fetch(p, { method: 'HEAD' });
        results.push({ path: p, status: r.status, ok: r.ok });
      } catch (e) {
        results.push({ path: p, status: 0, ok: false, error: e.message });
      }
    }
    return results;
  });

  const brokenImgs = await page.evaluate(() =>
    [...document.images]
      .filter((i) => i.src && !i.src.startsWith('data:'))
      .filter((i) => !i.complete || i.naturalWidth === 0)
      .map((i) => i.src)
  );

  const splash = await page.evaluate(() => ({
    root: !!document.getElementById('splash-cursor-root'),
    canvas: !!document.getElementById('splash-cursor-canvas'),
    script: !!document.querySelector('script[src*="splash-cursor"]'),
  }));

  const islandTitles = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.island-btn .island-title, .island-btn h3, .island-btn')];
    return nodes.slice(0, 12).map((n) => n.textContent.trim()).filter(Boolean);
  });

  await page.screenshot({
    path: path.join(__dirname, 'phase2-production-check.png'),
    fullPage: false,
  });

  const report = {
    url,
    status,
    title,
    headerImg,
    islandBtns,
    islandTiles,
    islandTitles,
    splash,
    assetChecks,
    brokenImgs,
    pageErrors: errors,
    consoleErrors: consoleMsgs.filter((m) => m.type === 'error'),
    consoleWarnings: consoleMsgs.filter((m) => m.type === 'warning').slice(0, 5),
    consoleLogCount: consoleMsgs.length,
  };

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
