const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const api = {};
new Function(
  "exports",
  ts.transpileModule(
    fs.readFileSync(
      require("node:path").join(__dirname, "../src/lib/phone.ts"),
      "utf8",
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
)(api);
test("Iranian phone formats and Persian/Arabic digits normalize identically", () => {
  for (const phone of [
    "09123456789",
    "۹۱۲۳۴۵۶۷۸۹",
    "٠٩١٢٣٤٥٦٧٨٩",
    "+98 (912) 345-6789",
    "00989123456789",
    "989123456789",
  ])
    assert.equal(api.normalizeIranPhone(phone), "+989123456789");
  for (const phone of [
    "",
    "0912345678",
    "091234567890",
    "+12025550123",
    "02123456789",
    "abc09123456789",
    "0912/3456789",
  ])
    assert.equal(api.normalizeIranPhone(phone), null);
  assert.equal(api.latinDigits("۱۲٣۴۵۶"), "123456");
});

test("hook rate limits take priority over generic provider errors", () => {
 assert.match(api.phoneAuthError({message:"hook returned 429"}), /محدود/);
 assert.match(api.phoneAuthError({message:"SMS cooldown: wait 60 seconds"}), /یک دقیقه/);
 assert.match(api.phoneAuthError({message:"SMS budget unavailable"}), /بررسی سهمیه/);
 assert.doesNotMatch(api.phoneAuthError({status:429,message:"sms service hook"}), /رد کرد/);
});
