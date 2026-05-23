import test from "node:test";
import assert from "node:assert/strict";
import { loadProjectConfig } from "./config.js";

test("loadProjectConfig returns a valid AutoBloggerProjectConfig", () => {
  const config = loadProjectConfig();

  assert.ok(config.brand.productName.length > 0, "brand.productName should be non-empty");
  assert.ok(config.brand.shortName.length > 0, "brand.shortName should be non-empty");
  assert.ok(config.brand.voice.length > 0, "brand.voice should be non-empty");
  assert.ok(Array.isArray(config.brand.unshippedFeatureClaims), "unshippedFeatureClaims should be an array");

  assert.ok(config.content.listPath.length > 0, "content.listPath should be non-empty");
  assert.ok(config.content.guidePath.length > 0, "content.guidePath should be non-empty");
  assert.ok(config.content.rulesPath.length > 0, "content.rulesPath should be non-empty");

  assert.ok(Array.isArray(config.news.queries) && config.news.queries.length > 0, "news.queries should be non-empty");
  assert.ok(Array.isArray(config.news.relevanceKeywords) && config.news.relevanceKeywords.length > 0, "news.relevanceKeywords should be non-empty");
  assert.ok(Array.isArray(config.news.excludeKeywords), "news.excludeKeywords should be an array");
  assert.ok(Array.isArray(config.news.excludedDomains) && config.news.excludedDomains.length > 0, "news.excludedDomains should be non-empty");
  assert.ok(config.news.userAgent.includes("Mozilla"), "news.userAgent should look like a User-Agent string");

  assert.ok(
    config.contentRepository.type === "s3-manifest" || config.contentRepository.type === "filesystem",
    "contentRepository.type should be s3-manifest or filesystem"
  );
  assert.ok(
    config.output.type === "s3-staging" || config.output.type === "local-write",
    "output.type should be s3-staging or local-write"
  );
  assert.ok(
    config.stateStore.type === "dynamodb" || config.stateStore.type === "filesystem",
    "stateStore.type should be dynamodb or filesystem"
  );

  assert.ok(config.author.length > 0, "author should be non-empty");
});

test("loadProjectConfig brand.unshippedFeatureClaims are all non-empty strings", () => {
  const config = loadProjectConfig();
  for (const claim of config.brand.unshippedFeatureClaims) {
    assert.ok(typeof claim === "string" && claim.length > 0, `Claim should be non-empty string: ${claim}`);
  }
});
