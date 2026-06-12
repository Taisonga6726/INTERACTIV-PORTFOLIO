const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const PORT = 8770;
const PAGE = '/portfolio.html';

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      const filePath = path.join(ROOT, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found: ' + urlPath);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript',
        '.mp4': 'video/mp4',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
      };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.on('error', (e) => (e.code === 'EADDRINUSE' ? resolve(null) : reject(e)));
    server.listen(PORT, () => resolve(server));
  });
}

function endsWithPath(src, rel) {
  return decodeURIComponent(src || '').replace(/\\/g, '/').endsWith(rel);
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  page.on('requestfailed', (req) => failedRequests.push({ url: req.url(), err: req.failure()?.errorText }));

  const base = `http://127.0.0.1:${PORT}${PAGE}`;
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);

  const steps = [];

  const home1 = await page.evaluate(() => window.__heroVideoRouter.getState());
  steps.push({
    step: 'home-1',
    ctx: home1.ctx,
    srcOk: endsWithPath(home1.src, 'video/var 01.mp4'),
    muted: home1.muted,
  });

  await page.locator('#directionsGrid .direction-card').first().click();
  await page.waitForTimeout(500);
  const inner1 = await page.evaluate(() => window.__heroVideoRouter.getState());
  steps.push({
    step: 'inner-1',
    ctx: inner1.ctx,
    srcOk: endsWithPath(inner1.src, 'video/в работу.mp4'),
    muted: inner1.muted,
    sound: !inner1.muted,
  });

  await page.waitForTimeout(6500);
  const inner1After = await page.evaluate(() => window.__heroVideoRouter.getState());
  steps.push({
    step: 'inner-1-after-pass',
    muted: inner1After.muted,
    firstPassPending: inner1After.firstPassPending,
  });

  await page.locator('.header-banner-link').click();
  await page.waitForTimeout(800);
  const home2 = await page.evaluate(() => window.__heroVideoRouter.getState());
  steps.push({
    step: 'home-2',
    ctx: home2.ctx,
    srcOk: endsWithPath(home2.src, 'video/var 01.mp4'),
    muted: home2.muted,
  });

  await page.locator('#directionsGrid .direction-card').nth(1).click();
  await page.waitForTimeout(500);
  const inner2 = await page.evaluate(() => window.__heroVideoRouter.getState());
  steps.push({
    step: 'inner-2',
    ctx: inner2.ctx,
    srcOk: endsWithPath(inner2.src, 'video/в работу.mp4'),
    muted: inner2.muted,
    sound: !inner2.muted,
  });

  const videoOk = await page.evaluate(async () => {
    const r = await fetch('video/var 01.mp4', { method: 'HEAD' });
    const r2 = await fetch('video/в работу.mp4', { method: 'HEAD' });
    return { home: r.status, inner: r2.status };
  });

  await browser.close();
  if (server) server.close();

  const report = {
    preview: `http://127.0.0.1:${PORT}${PAGE}`,
    previewFromParent: `http://127.0.0.1:8767/INTERACTIV%20PORTFOLIO/portfolio.html`,
    videoAssets: videoOk,
    steps,
    consoleErrors,
    failedRequests: failedRequests.filter((r) => !r.url.includes('images.unsplash.com')),
    pass:
      steps.every((s) => s.srcOk !== false) &&
      steps.find((s) => s.step === 'home-1')?.muted === true &&
      steps.find((s) => s.step === 'inner-1')?.sound === true &&
      steps.find((s) => s.step === 'inner-1-after-pass')?.muted === true &&
      steps.find((s) => s.step === 'home-2')?.muted === true &&
      steps.find((s) => s.step === 'inner-2')?.sound === true &&
      videoOk.home === 200 &&
      videoOk.inner === 200,
  };

  console.log(JSON.stringify(report, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
