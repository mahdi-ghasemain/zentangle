const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const source = fs.readFileSync(
  require("node:path").join(__dirname, "../src/data/program.ts"),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const api = {};
new Function("exports", compiled)(api);
test("program contains the complete ordered 12-session intervention", () => {
  assert.deepEqual(
    api.lessons.map((l) => l.id),
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  assert.ok(
    api.lessons.every(
      (l) => l.steps.length === 5 && l.goals.length >= 3 && l.prompt,
    ),
  );
  assert.equal(api.lessons.filter((l) => l.part === 1).length, 6);
  assert.equal(api.lessons.filter((l) => l.part === 2).length, 6);
});
test("access cannot skip unfinished sessions; completed work remains accessible", () => {
  assert.equal(api.canOpenLesson(1, []), true);
  assert.equal(api.canOpenLesson(3, [1]), false);
  assert.equal(api.canOpenLesson(3, [1, 2]), true);
  assert.equal(api.canOpenLesson(2, [1, 2, 3]), true);
  assert.equal(api.currentLesson([1, 2]), 3);
  assert.equal(api.currentLesson([1, 3]), 2);
  assert.equal(api.currentLesson(api.lessons.map((l) => l.id)), 12);
});
test("group meetings occur after every pair, including the first two sessions", () => {
  assert.deepEqual(api.groupCheckpoints, [2, 4, 6, 8, 10, 12]);
});
test("Persian numerals preserve non-numeric text", () => {
  assert.equal(api.fa("جلسه 12"), "جلسه ۱۲");
});
