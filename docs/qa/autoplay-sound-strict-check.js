const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const VIDEO = 'http://127.0.0.1:8767/video/var%2001.mp4';
const PORTFOLIO = 'http://127.0.0.1:8767/INTERACTIV%20PORTFOLIO/portfolio.html';

const HTML = `<!DOCTYPE html><html><body>
<video id="v" autoplay playsinline src="${VIDEO}"></video>
<script>
window.__r={};
const v=document.getElementById('v');
v.volume=1;v.muted=false;
v.play().then(()=>{window.__r.playResolved=true}).catch(e=>{window.__r.playRejected=true;window.__r.err=String(e.message||e)});
setTimeout(()=>{window.__r.after1s={paused:v.paused,muted:v.muted,currentTime:v.currentTime,readyState:v.readyState}},1000);
</script></body></html>`;

async function strictWithContext(label, contextOptions, launchOpts) {
  const browser = await chromium.launch(launchOpts || {});
  const ctx = await browser.newContext(contextOptions);
  const page = await ctx.newPage();
  await page.setContent(HTML, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => window.__r);
  await browser.close();
  return {
    label,
    playRejected: !!r.playRejected,
    playResolved: !!r.playResolved,
    err: r.err || null,
    after1s: r.after1s || null,
    soundLikely: !!(r.after1s && !r.after1s.paused && !r.after1s.muted && r.after1s.currentTime > 0),
  };
}

(async () => {
  const yandexPaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Yandex/YandexBrowser/Application/browser.exe'),
    'C:/Program Files (x86)/Yandex/YandexBrowser/Application/browser.exe',
    'C:/Program Files/Yandex/YandexBrowser/Application/browser.exe',
  ];
  const yandexExe = yandexPaths.find((p) => p && fs.existsSync(p));

  const strict = [];
  strict.push(await strictWithContext('chromium-desktop', { viewport: { width: 1440, height: 900 } }));
  strict.push(await strictWithContext('chromium-mobile-iphone', { ...devices['iPhone 13'] }));
  strict.push(await strictWithContext('chromium-mobile-android', { ...devices['Pixel 5'] }));
  if (yandexExe) {
    strict.push(await strictWithContext('yandex-desktop', { viewport: { width: 1440, height: 900 } }, { executablePath: yandexExe, headless: true }));
    strict.push(await strictWithContext('yandex-mobile', { ...devices['iPhone 13'] }, { executablePath: yandexExe, headless: true }));
  }

  const browser = await chromium.launch();
  const page = await browser.newContext({ ...devices['iPhone 13'] }).then((c) => c.newPage());
  await page.goto(PORTFOLIO, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const current = await page.evaluate(() => window.__heroVideoRouter.getState());
  await browser.close();

  const blocked = strict.filter((s) => !s.soundLikely || s.playRejected);

  console.log(JSON.stringify({
    strictAutoplayUnmutedFromScratch: strict,
    currentPortfolioFirstLoad: current,
    yandexFound: !!yandexExe,
    blockedCount: blocked.length,
    total: strict.length,
  }, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
