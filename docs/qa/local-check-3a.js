const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../..');
const PORT = 8765;

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/') urlPath = '/portfolio.html';
      const filePath = path.join(ROOT, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
      };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });
}

(async () => {
  const server = await startServer();
  const base = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleMsgs = [];
  const errors = [];
  page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => errors.push(e.message));

  const resp = await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  const assetChecks = await page.evaluate(async (b) => {
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
      const r = await fetch(`${b}/${p}`, { method: 'HEAD' });
      results.push({ path: p, status: r.status, ok: r.ok });
    }
    return results;
  }, base);

  const headerImg = await page.evaluate(() => {
    const el = document.querySelector('.header-banner-img');
    return el ? { src: el.src, naturalWidth: el.naturalWidth, complete: el.complete } : null;
  });
  const islands = await page.locator('#directionsGrid .direction-card').count();
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

  const report = {
    mode: 'local',
    status: resp ? resp.status() : null,
    assetChecks,
    headerImg,
    islands,
    splash,
    brokenImgs,
    pageErrors: errors,
    consoleErrors: consoleMsgs.filter((m) => m.type === 'error'),
    allAssetsOk: assetChecks.every((a) => a.ok),
  };

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  server.close();
  process.exit(report.allAssetsOk && errors.length === 0 && brokenImgs.length === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
