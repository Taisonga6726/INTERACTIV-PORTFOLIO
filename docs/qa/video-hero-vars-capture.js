const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PARENT = path.resolve(__dirname, '../../..');
const PORT = 8767;
const PAGE = '/INTERACTIV PORTFOLIO/portfolio.html';
const OUT = __dirname;

const EXPECTED = [
  '../video/var 01.mp4',
  '../video/в работу  шапка 01.mp4',
  '../video/в работу 01.mp4',
  '../video/в работу.mp4',
];

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      const filePath = path.join(PARENT, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(PARENT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });
}

function endsWithPath(src, rel) {
  return decodeURIComponent(src).replace(/\\/g, '/').endsWith(rel.replace(/^\.\.\//, ''));
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const results = [];

  await page.goto(`http://127.0.0.1:${PORT}${PAGE}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);

  for (let i = 0; i < 4; i++) {
    await page.click(`#heroVideoTestPanel button[data-hero-video="${i}"]`);
    await page.waitForTimeout(2800);
    const check = await page.evaluate((expected) => {
      const video = document.getElementById('heroBannerVideo');
      const btn = document.querySelector(`#heroVideoTestPanel button[data-hero-video="${expected.idx}"]`);
      return {
        src: video?.getAttribute('src') || '',
        currentSrc: video?.currentSrc || '',
        paused: video?.paused,
        readyState: video?.readyState,
        active: btn?.classList.contains('active'),
        height: video?.getBoundingClientRect().height,
      };
    }, { idx: i });

    const okSrc = endsWithPath(check.currentSrc || check.src, EXPECTED[i]);
    const shot = path.join(OUT, `video-hero-var${i + 1}.png`);
    await page.screenshot({ path: shot, clip: { x: 0, y: 0, width: 1440, height: 700 } });
    results.push({ variant: i + 1, file: EXPECTED[i], okSrc, active: check.active, paused: check.paused, readyState: check.readyState, height: check.height, screenshot: shot });
  }

  await browser.close();
  server.close();
  console.log(JSON.stringify({ allOk: results.every((r) => r.okSrc && r.active && !r.paused), results }, null, 2));
  process.exit(results.every((r) => r.okSrc && r.active && !r.paused) ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
