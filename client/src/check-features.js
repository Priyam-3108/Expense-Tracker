const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', (msg) => errors.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const grid = await page.evaluate(() => {
    const el = document.querySelector('.features-grid');
    if (!el) return 'NOT FOUND';
    return { childCount: el.children.length, html: el.outerHTML.slice(0, 300) };
  });
  console.log('features-grid:', JSON.stringify(grid, null, 2));
  console.log('console/errors:', errors.join('\n'));
  await browser.close();
})();
