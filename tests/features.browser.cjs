const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const path = require("node:path");
(async () => {
  const env = fs.readFileSync(".env", "utf8");
  const url = env.match(/^EXPO_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, "");
  assert.ok(url, "local Supabase URL is needed, credentials are never sent");
  const project = new URL(url).hostname.split(".")[0];
  const id = "11111111-1111-4111-8111-111111111111";
  const meetingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const user = { id, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} };
  const session = { access_token: "mock-session-for-local-ui-only", refresh_token: "mock", expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: "bearer", user };
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: "sb-" + project + "-auth-token", value: session });
    let uploaded = false, uploadCount = 0, callRequests = 0;
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.route(url + "/**", async route => {
      const req = route.request(), pathname = new URL(req.url()).pathname;
      const respond = (json, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(json) });
      if (pathname.startsWith("/auth/v1/")) return respond(user);
      if (pathname.startsWith("/rest/v1/profiles")) return respond({ id, display_name: "هنرمند آزمون", role: "participant", group_id: "group-a" });
      if (pathname.startsWith("/rest/v1/meetings")) return respond([{ id: meetingId, provider: "livekit", group_id: "group-a", starts_at: new Date().toISOString(), after_lesson: 2 }]);
      if (pathname.startsWith("/rest/v1/")) return respond([]);
      if (pathname === "/functions/v1/livekit-token") { callRequests++; return respond({ error: "Meeting unavailable" }, 403); }
      if (pathname.startsWith("/storage/v1/object/sign/")) {
        if (req.method() === "POST") return uploaded ? respond({ signedURL: "/object/sign/avatars/" + id + "/profile.jpg?token=mock" }) : respond({ error: "not found" }, 400);
        return route.fulfill({ contentType: "image/png", body: fs.readFileSync("assets/icon.png") });
      }
      if (pathname.startsWith("/storage/v1/object/avatars")) {
        if (req.method() === "DELETE") { uploaded = false; return respond([]); }
        const body = req.postDataBuffer();
        assert.ok(body && body.length < 2 * 1024 * 1024);
        assert.equal(body[0], 0xff); assert.equal(body[1], 0xd8);
        uploaded = true; uploadCount++;
        return respond({ Key: "avatars/" + id + "/profile.jpg" });
      }
      return respond({ error: "Unexpected test request" }, 400);
    });
    await page.goto("http://127.0.0.1:8082/profile");
    await page.getByText("هنرمند آزمون", { exact: true }).waitFor();
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "انتخاب عکس پروفایل", exact: true }).click();
    await (await chooser).setFiles(path.resolve("assets/icon.png"));
    await page.getByText("عکس پروفایل ذخیره شد.", { exact: true }).waitFor();
    assert.equal(uploadCount, 1);
    await page.screenshot({ path: "screenshots/profile-photo-test.png" });
    await page.getByRole("button", { name: "حذف عکس پروفایل", exact: true }).click();
    await page.getByText("عکس پروفایل حذف شد.", { exact: true }).waitFor();
    assert.equal(uploaded, false);
    await page.goto("http://127.0.0.1:8082/meeting?meeting=" + meetingId);
    await page.getByRole("button", { name: "ورود با صدا", exact: true }).click();
    await page.getByText("ورود به تماس ممکن نشد. زمان جلسه، عضویت گروه و فعال‌بودن سرویس را بررسی کنید.", { exact: true }).waitFor();
    assert.equal(callRequests, 1);
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log("PASS mocked profile JPEG conversion/upload/delete and rejected call admission; no real provider requests");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
