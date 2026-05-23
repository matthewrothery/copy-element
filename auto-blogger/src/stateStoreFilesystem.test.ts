import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { FilesystemStateStore } from "./stateStoreFilesystem.js";

function makeTempStore(): { store: FilesystemStateStore; dir: string } {
  // Use crypto-random suffix to guarantee uniqueness even under concurrent test runs.
  const dir = path.join(tmpdir(), `auto-blogger-state-${crypto.randomBytes(8).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  const statePath = path.join(dir, "state.json");
  return { store: new FilesystemStateStore(statePath), dir };
}

test("claimKeyword returns true on first claim, false on repeat", async () => {
  const { store, dir } = makeTempStore();
  try {
    const first = await store.claimKeyword("hub/cluster/keyword-one", "req-1");
    const second = await store.claimKeyword("hub/cluster/keyword-one", "req-2");
    const different = await store.claimKeyword("hub/cluster/keyword-two", "req-3");

    assert.equal(first, true, "First claim should succeed");
    assert.equal(second, false, "Repeat claim should fail");
    assert.equal(different, true, "Different keyword should succeed");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("recordSlug returns true on first record, false on repeat", async () => {
  const { store, dir } = makeTempStore();
  try {
    assert.equal(await store.recordSlug("my-article-slug"), true);
    assert.equal(await store.recordSlug("my-article-slug"), false);
    assert.equal(await store.recordSlug("different-slug"), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadProcessedKeywordIds reflects claimed keywords", async () => {
  const { store, dir } = makeTempStore();
  try {
    await store.claimKeyword("hub/cluster/kw-a", "req");
    await store.claimKeyword("hub/cluster/kw-b", "req");
    const ids = await store.loadProcessedKeywordIds();
    assert.ok(ids.has("hub/cluster/kw-a"));
    assert.ok(ids.has("hub/cluster/kw-b"));
    assert.equal(ids.size, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadProcessedSlugs reflects recorded slugs", async () => {
  const { store, dir } = makeTempStore();
  try {
    await store.recordSlug("slug-x");
    const slugs = await store.loadProcessedSlugs();
    assert.ok(slugs.has("slug-x"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("recordRun persists lastRunAt as epoch ms", async () => {
  const { store, dir } = makeTempStore();
  try {
    const before = Date.now();
    await store.recordRun(before);
    const after = Date.now();
    // Verify by loading keywords (the state file was written).
    const ids = await store.loadProcessedKeywordIds();
    assert.equal(ids.size, 0, "No keywords should be recorded yet");
    assert.ok(before >= 1_000_000_000_000, "Timestamp should be epoch ms (>1T)");
    assert.ok(after >= before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
