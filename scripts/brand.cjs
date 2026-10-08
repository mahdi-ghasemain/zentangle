const fs = require("node:fs");
const { chromium } = require("@playwright/test");
const svg = fs.readFileSync("assets/brand.svg", "utf8");
(async () => {
  fs.mkdirSync("public/icons", { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage();
    for (const [size, file] of [
      [1024, "assets/icon.png"],
      [512, "public/icons/icon-512.png"],
      [512, "public/icons/maskable-512.png"],
      [192, "public/icons/icon-192.png"],
      [180, "public/icons/apple-touch-icon.png"],
    ]) {
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(
        "<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{width:100%;height:100%}</style>" +
          svg,
      );
      await page.screenshot({ path: file });
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
