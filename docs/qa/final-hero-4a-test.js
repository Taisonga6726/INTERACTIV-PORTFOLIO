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

async function sampleLoopJitter(page, durationMs) {
  return page.evaluate(
    async ({ durationMs }) => {
      const v = document.querySelector('.header-banner-video.is-top');
      if (!v) return { error: 'no video' };
      const samples = [];
      const start = performance.now();
      let lastT = v.currentTime;
      let jumps = 0;
      let pauses = 0;
      let maxGap = 0;
      while (performance.now() - start < durationMs) {
        const t = v.currentTime;
        const dt = t - lastT;
        if (v.paused) pauses += 1;
        if (dt < -0.15) {
          jumps += 1;
          maxGap = Math.max(maxGap, Math.abs(dt));
        }
        samples.push({ t: Math.round(t * 1000), paused: v.paused });
        lastT = t;
        await new Promise((r) => setTimeout(r, 40));
      }
      return { jumps, pauses, maxGap: Math.round(maxGap * 1000) / 1000, sampleCount: samples.length, routerLoops: window.__heroVideoRouter?.getState()?.loopCount };
    },
    { durationMs }
  );
}

async function waitFirstPassDone(page, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const s = await page.evaluate(() => window.__heroVideoRouter?.getState());
    if (s?.firstPassDone && s.muted) return s;
    await page.waitForTimeout(200);
  }
  return page.evaluate(() => window.__heroVideoRouter?.getState());
}

async function bannerBlackRatio(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.header-banner-video.is-top');
    if (!el || el.readyState < 2) return null;
    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 34;
    const ctx = c.getContext('2d');
    try {
      ctx.drawImage(el, 0, 0, 80, 34);
    } catch (e) {
      return null;
    }
    const d = ctx.getImageData(0, 0, 80, 34).data;
    let dark = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] + d[i + 1] + d[i + 2] < 30) dark += 1;
    }
    return Math.round((dark / (80 * 34)) * 1000) / 10;
  });
}

async function runVariant(page, label, viewport, query) {
  await page.setViewportSize(viewport);
  const url = `http://127.0.0.1:${PORT}${PAGE}?${query}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);

  const homeStart = await page.evaluate(() => window.__heroVideoRouter.getState());
  const homeJitter = await sampleLoopJitter(page, 7000);

  await page.locator('#directionsGrid .direction-card').first().click();
  const transitionShots = [];
  for (const ms of [0, 100, 250, 400, 500]) {
    if (ms) await page.waitForTimeout(ms - (transitionShots.length ? transitionShots[transitionShots.length - 1].ms : 0));
    const blackPct = await bannerBlackRatio(page);
    const shotPath = path.join(OUT, `final-4a-${label}-transition-${ms}ms.png`);
    await page.screenshot({ path: shotPath, clip: { x: 0, y: 0, width: viewport.width, height: Math.min(420, viewport.height) } });
    transitionShots.push({ ms, blackPct });
  }

  const innerStart = await page.evaluate(() => window.__heroVideoRouter.getState());
  const innerAfterPass = await waitFirstPassDone(page, 9000);
  const innerJitter = await sampleLoopJitter(page, 7000);

  await page.locator('.header-banner-link').click();
  await page.waitForTimeout(800);
  const backHome = await page.evaluate(() => window.__heroVideoRouter.getState());

  return {
    label,
    query,
    viewport,
    homeStart: {
      ctx: homeStart.ctx,
      srcOk: endsWithPath(homeStart.src, 'var 01.mp4'),
      muted: homeStart.muted,
      scheme: homeStart.scheme,
      soundAttempt: homeStart.autoplaySoundAttempt,
    },
    homeJitter,
    transitionShots,
    innerStart: {
      ctx: innerStart.ctx,
      srcOk: endsWithPath(innerStart.src, 'в работу.mp4'),
      muted: innerStart.muted,
      wantSound: innerStart.wantSound,
      fromHomeToInner: innerStart.fromHomeToInner,
      soundAttempt: innerStart.autoplaySoundAttempt,
      crossfadeMs: innerStart.crossfadeMs,
    },
    innerAfterPass: {
      firstPassDone: innerAfterPass?.firstPassDone,
      muted: innerAfterPass?.muted,
      loopCount: innerAfterPass?.loopCount,
    },
    innerJitter,
    backHome: {
      ctx: backHome.ctx,
      srcOk: endsWithPath(backHome.src, 'var 01.mp4'),
      muted: backHome.muted,
    },
  };
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const variants = [
    { label: 'default-seek', query: 'crossfadeMs=0&loopMode=seek', viewport: { width: 1440, height: 900 } },
    { label: 'crossfade400-seek', query: 'crossfadeMs=400&loopMode=seek', viewport: { width: 1440, height: 900 } },
    { label: 'default-seek-mobile', query: 'crossfadeMs=0&loopMode=seek', viewport: { width: 390, height: 844 } },
    { label: 'crossfade400-seek-mobile', query: 'crossfadeMs=400&loopMode=seek', viewport: { width: 390, height: 844 } },
    { label: 'default-ended-mobile', query: 'crossfadeMs=0&loopMode=ended', viewport: { width: 390, height: 844 } },
  ];

  const results = [];
  for (const v of variants) {
    results.push(await runVariant(page, v.label, v.viewport, v.query));
  }

  await browser.close();
  if (server) server.close();

  const report = {
    preview: `http://127.0.0.1:${PORT}${PAGE}`,
    testedAt: new Date().toISOString(),
    results,
    analysis: {},
  };

  const seekMobile = results.find((r) => r.label === 'default-seek-mobile');
  const endedMobile = results.find((r) => r.label === 'default-ended-mobile');
  const noFade = results.find((r) => r.label === 'default-seek');
  const fade400 = results.find((r) => r.label === 'crossfade400-seek');

  report.analysis.loopSeekVsEnded = {
    seekJumps: seekMobile?.innerJitter?.jumps,
    endedJumps: endedMobile?.innerJitter?.jumps,
    seekPauses: seekMobile?.innerJitter?.pauses,
    endedPauses: endedMobile?.innerJitter?.pauses,
    seekRouterLoops: seekMobile?.innerJitter?.routerLoops,
    endedRouterLoops: endedMobile?.innerJitter?.routerLoops,
  };

  report.analysis.crossfadeBlackFlash = {
    instantMaxBlack: Math.max(...(noFade?.transitionShots?.map((s) => s.blackPct) || [0])),
    fade400MaxBlack: Math.max(...(fade400?.transitionShots?.map((s) => s.blackPct) || [0])),
    instantAt0ms: noFade?.transitionShots?.[0]?.blackPct,
    fadeAt250ms: fade400?.transitionShots?.find((s) => s.ms === 250)?.blackPct,
  };

  report.analysis.scheme4A = {
    homeAlwaysMuted: results.every((r) => r.homeStart.muted === true && r.homeStart.soundAttempt === 'silent'),
    innerSoundOnTransition: results.filter((r) => r.innerStart.fromHomeToInner).map((r) => ({
      label: r.label,
      wantSound: r.innerStart.wantSound,
      soundAttempt: r.innerStart.soundAttempt,
      mutedAtStart: r.innerStart.muted,
    })),
    backHomeSilent: results.every((r) => r.backHome.muted === true),
  };

  fs.writeFileSync(path.join(OUT, 'final-hero-4a-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
