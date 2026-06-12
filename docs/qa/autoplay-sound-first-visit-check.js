const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const PAGE = 'http://127.0.0.1:8767/INTERACTIV%20PORTFOLIO/portfolio.html';

async function testFirstVisitAutoplay(browserOrContext, label, createContext) {
  const ctx = await createContext();
  const page = await ctx.newPage();
  await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);

  const result = await page.evaluate(async () => {
    const v = document.getElementById('heroBannerVideoA');
    if (!v) return { error: 'no video' };
    const src = v.currentSrc || v.src;
    v.pause();
    v.currentTime = 0;
    v.muted = false;
    v.volume = 1;
    let playOk = false;
    let playErr = null;
    try {
      await v.play();
      playOk = !v.paused && !v.muted;
    } catch (e) {
      playErr = String(e.message || e);
    }
    return {
      src,
      playOk,
      playErr,
      muted: v.muted,
      paused: v.paused,
      readyState: v.readyState,
    };
  });

  const currentImpl = await page.evaluate(() => {
    const s = window.__heroVideoRouter?.getState();
    return { ctx: s?.ctx, muted: s?.muted, firstPassPending: s?.firstPassPending };
  });

  await ctx.close();
  return { label, autoplayUnmuted: result, currentImplementation: currentImpl };
}

(async () => {
  const yandexPaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Yandex/YandexBrowser/Application/browser.exe'),
    'C:/Program Files (x86)/Yandex/YandexBrowser/Application/browser.exe',
    'C:/Program Files/Yandex/YandexBrowser/Application/browser.exe',
  ];
  const yandexExe = yandexPaths.find((p) => p && fs.existsSync(p));

  const chromiumBrowser = await chromium.launch();
  const results = [];

  results.push(
    await testFirstVisitAutoplay(chromiumBrowser, 'chromium-desktop', () =>
      chromiumBrowser.newContext({ viewport: { width: 1440, height: 900 } })
    )
  );
  results.push(
    await testFirstVisitAutoplay(chromiumBrowser, 'chromium-mobile-iphone', () =>
      chromiumBrowser.newContext({ ...devices['iPhone 13'] })
    )
  );
  results.push(
    await testFirstVisitAutoplay(chromiumBrowser, 'chromium-mobile-android', () =>
      chromiumBrowser.newContext({ ...devices['Pixel 5'] })
    )
  );

  if (yandexExe) {
    const yandex = await chromium.launch({ executablePath: yandexExe, headless: true });
    results.push(
      await testFirstVisitAutoplay(yandex, 'yandex-desktop', () =>
        yandex.newContext({ viewport: { width: 1440, height: 900 } })
      )
    );
    results.push(
      await testFirstVisitAutoplay(yandex, 'yandex-mobile', () =>
        yandex.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } })
      )
    );
    await yandex.close();
  }

  await chromiumBrowser.close();

  const report = {
    testedAt: new Date().toISOString(),
    preview: PAGE,
    yandexFound: !!yandexExe,
    note: 'Тест: свежий контекст, без кликов, попытка v.play() с muted=false на var 01',
    results,
    summary: {
      desktopAutoplaySoundWorks: results
        .filter((r) => r.label.includes('desktop'))
        .every((r) => r.autoplayUnmuted.playOk),
      mobileAutoplaySoundWorks: results
        .filter((r) => r.label.includes('mobile'))
        .every((r) => r.autoplayUnmuted.playOk),
    },
  };

  console.log(JSON.stringify(report, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
