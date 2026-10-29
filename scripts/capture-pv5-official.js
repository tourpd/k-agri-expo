const { chromium } = require("playwright");

const pages = [
  ["pv5-passenger", "https://www.kia.com/kr/vehicles/pv5-passenger/features"],
  ["pv5-cargo", "https://www.kia.com/kr/vehicles/pv5-cargo/features"],
  ["pv5-cargo-highroof", "https://www.kia.com/kr/vehicles/pv5-cargo/features"],
  ["pv5-openbed", "https://www.kia.com/kr/vehicles/pv5-openbed/features"],
  ["pv5-wav", "https://www.kia.com/kr/vehicles/pv5-wav/features"],
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const [name, url] of pages) {
    console.log("CAPTURE:", name, url);
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `public/mobility/pv5/reference/${name}.png`,
      fullPage: false,
    });
  }

  await browser.close();
})();
