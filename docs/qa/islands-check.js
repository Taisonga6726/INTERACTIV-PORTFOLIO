const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("https://interactiv-portfolio.vercel.app/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const islands = await page.locator("#directionsGrid .direction-card").count();
  const titles = await page.$$eval("#directionsGrid .direction-card h3", (els) => els.map((e) => e.textContent.trim()));
  const covers = await page.$$eval("#directionsGrid .card-cover", (els) => els.map((e) => ({ src: e.src, ok: e.naturalWidth > 0 })));
  console.log(JSON.stringify({ islands, titles, covers }, null, 2));
  await browser.close();
})();
