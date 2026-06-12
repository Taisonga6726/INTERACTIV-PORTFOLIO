const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PARENT = path.resolve(__dirname, '../../..');
const PORT = 8766;
const PAGE = '/INTERACTIV PORTFOLIO/portfolio.html';

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      const filePath = path.join(PARENT, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(PARENT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
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
        '.mp4': 'video/mp4',
      };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function capture(page, label, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`http://127.0.0.1:${PORT}${PAGE}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  const metrics = await page.evaluate(() => {
    const video = document.querySelector('.header-banner-video');
    const link = document.querySelector('.header-banner-link');
    const vr = video?.getBoundingClientRect();
    const lr = link?.getBoundingClientRect();
    return {
      video: video
        ? {
            width: vr.width,
            height: vr.height,
            top: vr.top,
            paused: video.paused,
            readyState: video.readyState,
            nativeW: video.videoWidth,
            nativeH: video.videoHeight,
            currentSrc: video.currentSrc,
          }
        : null,
      link: lr ? { width: lr.width, height: lr.height } : null,
      viewportW: window.innerWidth,
    };
  });
  const out = path.join(__dirname, `video-hero-${label}.png`);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: viewport.width, height: Math.min(720, viewport.height) } });
  return { label, metrics, screenshot: out };
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const desktop = await capture(page, 'desktop', { width: 1440, height: 900 });
  const mobile = await capture(page, 'mobile', { width: 390, height: 844 });
  await browser.close();
  server.close();
  console.log(JSON.stringify({ defaultVideo: '../video/var 01.mp4', desktop, mobile }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
