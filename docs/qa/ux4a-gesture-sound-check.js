const { chromium } = require('playwright');

const PAGE = 'http://127.0.0.1:8767/INTERACTIV%20PORTFOLIO/portfolio.html';

function endsWithPath(src, rel) {
  return decodeURIComponent(src || '').replace(/\\/g, '/').includes(rel);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);

  const homeEntry = await page.evaluate(() => window.__heroVideoRouter.getState());

  await page.locator('.header-banner-link').click();
  await page.waitForTimeout(400);
  const homeBannerClick = await page.evaluate(() => window.__heroVideoRouter.getState());
  await page.waitForTimeout(6500);
  const homeAfterPass = await page.evaluate(() => window.__heroVideoRouter.getState());

  await page.locator('#directionsGrid .direction-card').first().click();
  await page.waitForTimeout(400);
  const inner1 = await page.evaluate(() => window.__heroVideoRouter.getState());
  await page.waitForTimeout(6500);
  const inner1After = await page.evaluate(() => window.__heroVideoRouter.getState());

  await page.locator('.header-banner-link').click();
  await page.waitForTimeout(400);
  const homeReturn = await page.evaluate(() => window.__heroVideoRouter.getState());

  await page.locator('.header-banner-link').click();
  await page.waitForTimeout(400);
  const homeBannerAgain = await page.evaluate(() => window.__heroVideoRouter.getState());

  await browser.close();

  const report = {
    preview: PAGE,
    homeEntry: { var1: endsWithPath(homeEntry.src, 'var 01.mp4'), muted: homeEntry.muted },
    homeBannerClick: { sound: !homeBannerClick.muted, fp: homeBannerClick.firstPassPending },
    homeAfterPass: { muted: homeAfterPass.muted },
    inner1: { var4: endsWithPath(inner1.src, 'в работу.mp4'), sound: !inner1.muted },
    inner1After: { muted: inner1After.muted },
    homeReturn: { var1: endsWithPath(homeReturn.src, 'var 01.mp4'), muted: homeReturn.muted },
    homeBannerAgain: { sound: !homeBannerAgain.muted, fp: homeBannerAgain.firstPassPending },
    consoleErrors,
    pass:
      homeEntry.muted &&
      homeBannerClick.sound &&
      homeAfterPass.muted &&
      inner1.sound &&
      inner1After.muted &&
      homeReturn.var1 &&
      homeBannerAgain.sound &&
      consoleErrors.length === 0,
  };
  console.log(JSON.stringify(report, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
