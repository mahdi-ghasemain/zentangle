const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  fs.mkdirSync(path.join(__dirname, "../screenshots"), { recursive: true });
  await page.goto("http://127.0.0.1:8081");
  await page.getByText("هنر زندگی", { exact: true }).waitFor();
  await page.screenshot({ path: "screenshots/01-welcome-desktop.png" });
  await page.getByRole("button", { name: "ادامه", exact: true }).click();
  await page.getByRole("button", { name: "ادامه", exact: true }).click();
  await page.getByRole("button", { name: "شروع مسیر من", exact: true }).click();
  await page
    .getByRole("button", { name: "ورود به نسخهٔ آزمایشی", exact: true })
    .click();
  await page.getByText("سلام خانم احمدی", { exact: true }).waitFor();
  await page.screenshot({ path: "screenshots/02-home-desktop.png" });
  await page.goto("http://127.0.0.1:8081/lesson?id=5");
  await page.getByText("جلسه در دسترس نیست", { exact: true }).waitFor();
  await page.goto("http://127.0.0.1:8081/guide?id=3");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "مرحلهٔ بعد", exact: true }).click();
  await page
    .getByRole("button", { name: "انجام دادم؛ ثبت اثر", exact: true })
    .click();
  await page
    .getByRole("button", { name: "ثبت و ارسال اثر", exact: true })
    .click();
  await page
    .getByText("ابتدا عکس اثر خود را انتخاب کنید.", { exact: true })
    .last()
    .waitFor();
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "انتخاب از گالری", exact: true })
    .click();
  await (await chooser).setFiles(path.join(__dirname, "../assets/icon.png"));
  await page.getByLabel("نام اثر", { exact: true }).fill("اثر آزمون من");
  await page
    .getByLabel("داستان اثر", { exact: true })
    .fill("این برگ یادآور باغ کودکی است.");
  await page.getByRole("checkbox").click();
  await page
    .getByRole("button", { name: "ثبت و ارسال اثر", exact: true })
    .click();
  await page.getByText("اثر آزمون من", { exact: true }).waitFor();
  await page
    .getByLabel("متن نظر", { exact: true })
    .fill("از کشیدن این نقش لذت بردم.");
  await page.getByRole("button", { name: "ارسال نظر", exact: true }).click();
  await page.getByText("از کشیدن این نقش لذت بردم.", { exact: true }).waitFor();
  await page.reload();
  await page.getByText("از کشیدن این نقش لذت بردم.", { exact: true }).waitFor();
  await page.goto("http://127.0.0.1:8081/lesson?id=4");
  await page.getByText("ارائه و بازخورد گروهی", { exact: true }).waitFor();
  await page.goto("http://127.0.0.1:8081/gallery");
  await page.getByText("اثر آزمون من", { exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "screenshots/03-gallery-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8081/home");
  await page.getByText("سلام خانم احمدی", { exact: true }).waitFor();
  await page.screenshot({ path: "screenshots/04-home-mobile.png" });
  for (const route of [
    "sessions",
    "calendar",
    "profile",
    "settings",
    "help",
    "resources",
    "notifications",
    "admin",
  ]) {
    await page.goto(`http://127.0.0.1:8081/${route}`);
    await page.waitForTimeout(250);
    assert.equal(
      await page
        .locator("body")
        .evaluate((el) => el.scrollWidth <= window.innerWidth + 1),
      true,
      `no horizontal overflow: ${route}`,
    );
  }
  await page.goto("http://127.0.0.1:8081/settings");
  await page.getByRole("button", { name: "خیلی درشت", exact: true }).click();
  await page.getByRole("button", { name: "☾ تاریک", exact: true }).click();
  await page.reload();
  await page.getByText("هر خط شما، یک شروع زیباست.", { exact: true }).waitFor();
  await page.screenshot({ path: "screenshots/05-settings-large-dark.png" });
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("zentangle.local.v1")),
  );
  assert.equal(stored.settings.dark, true);
  assert.equal(stored.settings.font, 1.3);
  assert.ok(stored.completed.includes(3));
  assert.equal(stored.artworks.length, 1);
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS: onboarding, demo, routing guards, five-step guide, upload validation, image upload, comments, persistence, unlocked next lesson, responsive routes, large font, dark mode; no runtime exceptions.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
