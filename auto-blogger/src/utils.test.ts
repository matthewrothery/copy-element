import test from "node:test";
import assert from "node:assert/strict";
import { sleep } from "./utils.js";

test("sleep resolves after the given delay", async () => {
  const before = Date.now();
  await sleep(50);
  const elapsed = Date.now() - before;
  assert.ok(elapsed >= 40, `Expected ≥40ms elapsed, got ${elapsed}ms`);
});

test("sleep(0) resolves immediately", async () => {
  await sleep(0);
  assert.ok(true);
});
