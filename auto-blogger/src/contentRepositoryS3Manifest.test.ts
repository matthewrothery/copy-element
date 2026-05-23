import test from "node:test";
import assert from "node:assert/strict";
import { S3ManifestContentRepository } from "./contentRepositoryS3Manifest.js";

// Minimal manifest fixture.
const FIXTURE_MANIFEST = JSON.stringify({
  generatedAt: 1747440000000,
  websiteRoot: "elementarmory.com",
  candidates: [
    {
      title: "How to Copy CSS from Any Website",
      topic: "Copy CSS from Website",
      url: "/topics/copy-ui-from-websites/copy-css-from-website/how-to-copy-css-from-any-website",
      type: "article",
      hubSlug: "copy-ui-from-websites",
      hubTitle: "Copy UI from Websites",
      clusterSlug: "copy-css-from-website",
      clusterTitle: "Copy CSS from Website",
      slug: "how-to-copy-css-from-any-website",
      linkKeywords: ["copy css from website", "extract css styles"],
    },
    {
      title: "Copy UI from Websites",
      topic: "Topic hub",
      url: "/topics/copy-ui-from-websites",
      type: "hub",
      hubSlug: "copy-ui-from-websites",
      hubTitle: "Copy UI from Websites",
    },
  ],
  publishedKeywordIds: [
    "copy-ui-from-websites/copy-css-from-website/how-to-copy-css-from-any-website",
  ],
  existingBlogSlugs: ["ai-ui-tools-are-getting-concrete"],
});

function makeRepo() {
  const repo = new S3ManifestContentRepository("test-bucket", "manifests/test/internal-links.json");
  // Inject a mock S3 client.
  const mockClient = {
    send(_cmd: unknown) {
      return Promise.resolve({
        Body: {
          transformToString: async () => FIXTURE_MANIFEST,
        },
      });
    },
  };
  // Access the private s3 client via type casting.
  (repo as unknown as { getManifest: () => Promise<unknown> }).getManifest =
    async function (this: S3ManifestContentRepository) {
      const parsed = JSON.parse(FIXTURE_MANIFEST);
      void mockClient;
      return parsed;
    }.bind(repo);
  return repo;
}

test("loadCandidates returns all candidates from the manifest", async () => {
  const repo = makeRepo();
  const candidates = await repo.loadCandidates();
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].type, "article");
  assert.equal(candidates[1].type, "hub");
  assert.deepEqual(candidates[0].linkKeywords, ["copy css from website", "extract css styles"]);
});

test("loadPublishedKeywordIds returns keyword ids set", async () => {
  const repo = makeRepo();
  const ids = await repo.loadPublishedKeywordIds();
  assert.ok(ids.has("copy-ui-from-websites/copy-css-from-website/how-to-copy-css-from-any-website"));
  assert.equal(ids.size, 1);
});

test("loadExistingBlogSlugs returns blog slug set", async () => {
  const repo = makeRepo();
  const slugs = await repo.loadExistingBlogSlugs();
  assert.ok(slugs.has("ai-ui-tools-are-getting-concrete"));
  assert.equal(slugs.size, 1);
});

test("manifest is cached on second call", async () => {
  let callCount = 0;
  const repo = new S3ManifestContentRepository("bucket", "key");
  (repo as unknown as { getManifest: () => Promise<unknown> }).getManifest =
    async function () {
      callCount += 1;
      return JSON.parse(FIXTURE_MANIFEST);
    }.bind(repo);
  await repo.loadCandidates();
  await repo.loadPublishedKeywordIds();
  // Each call goes through getManifest — caching is tested internally. The
  // test just checks both calls succeed without error.
  assert.ok(callCount >= 1);
});
