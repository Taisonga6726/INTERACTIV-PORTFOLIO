const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PARENT = path.resolve(__dirname, '../../..');
const PORT = 8767;
const PAGE = '/INTERACTIV PORTFOLIO/portfolio.html';

function startServer() {
  return new Promise((resolve, reject) => {
    const tryListen = (port) => {
      const server = http.createServer((req, res) => {
        const urlPath = decodeURIComponent(req.url.split('?')[0]);
        const filePath = path.join(PARENT, urlPath.replace(/^\//, ''));
        if (!filePath.startsWith(PARENT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.mp4': 'video/mp4' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      });
      server.on('error', (e) => (e.code === 'EADDRINUSE' ? resolve(null) : reject(e)));
      server.listen(port, () => resolve(server));
    };
    tryListen(PORT);
  });
}

async function waitLoops(page, minLoops, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const n = await page.evaluate(() => window.__heroLoopDebug?.loopCount || 0);
    if (n >= minLoops) return n;
    await page.waitForTimeout(200);
  }
  return page.evaluate(() => window.__heroLoopDebug?.loopCount || 0);
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://127.0.0.1:${PORT}${PAGE}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);

  const report = { sound: [], loop: [] };

  for (const idx of [0, 1, 2, 3]) {
    await page.click(`#heroVideoTestPanel button[data-hero-video="${idx}"]`);
    await page.waitForTimeout(1200);
    const beforeSound = await page.evaluate(() => window.__heroVideoTest.getState());

    let afterSound = beforeSound;
    if (idx !== 1) {
      await page.click('#heroEnableSoundBtn');
      await page.waitForTimeout(400);
      afterSound = await page.evaluate(() => window.__heroVideoTest.getState());
    }

    report.sound.push({
      variant: idx + 1,
      soundBtnDisabled: await page.evaluate(() => document.getElementById('heroEnableSoundBtn').disabled),
      beforeMuted: beforeSound.muted,
      afterMuted: afterSound.muted,
      afterVolume: afterSound.volume,
      soundWorks: idx === 1 ? beforeSound.muted && afterSound.muted : !afterSound.muted && Math.abs(afterSound.volume - 0.5) < 0.01,
    });

    const loops = await waitLoops(page, 2, idx === 1 ? 8000 : 12000);
    const loopDbg = await page.evaluate(() => window.__heroLoopDebug || null);
    const jumps = await page.evaluate(() => {
      return new Promise((resolve) => {
        const v = document.getElementById('heroBannerVideo');
        const samples = [];
        let last = v.currentTime;
        const id = setInterval(() => {
          const t = v.currentTime;
          if (last - t > 0.5) samples.push({ from: last, to: t, delta: last - t });
          last = t;
          if (samples.length >= 3) {
            clearInterval(id);
            resolve(samples);
          }
        }, 50);
        setTimeout(() => {
          clearInterval(id);
          resolve(samples);
        }, 6000);
      });
    });

    report.loop.push({
      variant: idx + 1,
      loopsObserved: loops,
      loopDebug: loopDbg,
      rewindSamples: jumps,
      smooth: jumps.length > 0 && jumps.every((j) => j.from > 0.5),
    });
  }

  await browser.close();
  if (server) server.close();

  const summary = {
    soundOk: report.sound.filter((s) => s.variant !== 2).every((s) => s.soundWorks) && report.sound.find((s) => s.variant === 2)?.soundBtnDisabled,
    loopOk: report.loop.every((l) => l.loopsObserved >= 1),
    preview: `http://127.0.0.1:${PORT}${PAGE}`,
    report,
  };
  console.log(JSON.stringify(summary, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
