const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PARENT = path.resolve(__dirname, '../../..');
const PORT = 8767;
const PAGE = '/INTERACTIV PORTFOLIO/portfolio.html';
const OUT = __dirname;

function startServer() {
  return new Promise((resolve, reject) => {
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
    server.listen(PORT, () => resolve(server));
  });
}

function endsWithPath(src, rel) {
  return decodeURIComponent(src || '').replace(/\\/g, '/').endsWith(rel);
}

async function waitForFirstPassMute(page, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const s = await page.evaluate(() => window.__heroVideoRouter?.getState());
    if (s?.firstPassDone && s.muted) return s;
    await page.waitForTimeout(250);
  }
  return page.evaluate(() => window.__heroVideoRouter?.getState());
}

async function runScenario(page, label, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`http://127.0.0.1:${PORT}${PAGE}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);

  const homeStart = await page.evaluate(() => window.__heroVideoRouter.getState());
  await page.screenshot({ path: path.join(OUT, `context-hero-${label}-home-start.png`), clip: { x: 0, y: 0, width: viewport.width, height: 650 } });

  const homeAfterPass = await waitForFirstPassMute(page, 9000);
  await page.waitForTimeout(1500);
  const homeLoop = await page.evaluate(() => window.__heroVideoRouter.getState());
  await page.screenshot({ path: path.join(OUT, `context-hero-${label}-home-after-pass.png`), clip: { x: 0, y: 0, width: viewport.width, height: 650 } });

  await page.locator('#directionsGrid .direction-card').first().click();
  await page.waitForTimeout(1200);
  const innerStart = await page.evaluate(() => window.__heroVideoRouter.getState());
  await page.screenshot({ path: path.join(OUT, `context-hero-${label}-inner-start.png`), clip: { x: 0, y: 0, width: viewport.width, height: 650 } });

  const innerAfterPass = await waitForFirstPassMute(page, 9000);
  await page.waitForTimeout(1500);
  const innerLoop = await page.evaluate(() => window.__heroVideoRouter.getState());

  return {
    label,
    viewport,
    homeStart: {
      ctx: homeStart.ctx,
      srcOk: endsWithPath(homeStart.src, 'var 01.mp4'),
      muted: homeStart.muted,
      autoplaySoundAttempt: homeStart.autoplaySoundAttempt,
    },
    homeAfterPass: {
      firstPassDone: homeAfterPass?.firstPassDone,
      muted: homeAfterPass?.muted,
      loopCount: homeLoop?.loopCount,
    },
    innerStart: {
      ctx: innerStart.ctx,
      srcOk: endsWithPath(innerStart.src, 'в работу.mp4'),
      muted: innerStart.muted,
      userGesture: innerStart.userGesture,
      autoplaySoundAttempt: innerStart.autoplaySoundAttempt,
    },
    innerAfterPass: {
      firstPassDone: innerAfterPass?.firstPassDone,
      muted: innerAfterPass?.muted,
      loopCount: innerLoop?.loopCount,
    },
  };
}

(async () => {
  const server = await startServer();
  const yandexPaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Yandex/YandexBrowser/Application/browser.exe'),
    'C:/Program Files (x86)/Yandex/YandexBrowser/Application/browser.exe',
    'C:/Program Files/Yandex/YandexBrowser/Application/browser.exe',
  ];
  const yandexExe = yandexPaths.find((p) => p && fs.existsSync(p));

  const browsers = [{ name: 'chromium', launch: () => chromium.launch() }];
  if (yandexExe) {
    browsers.push({
      name: 'yandex',
      launch: () => chromium.launch({ executablePath: yandexExe, headless: true }),
    });
  }

  const results = [];
  for (const b of browsers) {
    const browser = await b.launch();
    const page = await browser.newPage();
    results.push(await runScenario(page, `${b.name}-desktop`, { width: 1440, height: 900 }));
    results.push(await runScenario(page, `${b.name}-mobile`, { width: 390, height: 844 }));
    await browser.close();
  }

  if (server) server.close();

  console.log(
    JSON.stringify(
      {
        preview: `http://127.0.0.1:${PORT}${PAGE}`,
        yandexFound: !!yandexExe,
        yandexPath: yandexExe || null,
        results,
      },
      null,
      2
    )
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
