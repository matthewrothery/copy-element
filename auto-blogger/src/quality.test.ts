import test from "node:test";
import assert from "node:assert/strict";
import { validateNewsPostQuality } from "./quality.js";
import type { GeneratedBlogPost } from "./types.js";

function makePost(body: string): GeneratedBlogPost {
  return {
    title: "AI UI Tools Are Getting More Concrete",
    slug: "ai-ui-tools-concrete",
    date: "2026-05-11",
    excerpt: "A grounded look at how AI UI tooling is moving from novelty demos toward repeatable developer workflows.",
    readTime: "4 min read",
    body,
    imagePrompt: "Clean editorial geometric cover with UI panels and subtle code shapes.",
    sourceItems: [
      {
        title: "Source 1",
        url: "https://example.com/one",
        publishedAt: "Mon, 11 May 2026 00:00:00 GMT",
        source: "Example",
        content: "x".repeat(350),
      },
      {
        title: "Source 2",
        url: "https://example.com/two",
        publishedAt: "Mon, 11 May 2026 01:00:00 GMT",
        source: "Example",
        content: "x".repeat(350),
      },
      {
        title: "Source 3",
        url: "https://example.com/three",
        publishedAt: "Mon, 11 May 2026 02:00:00 GMT",
        source: "Example",
        content: "x".repeat(350),
      },
    ],
  };
}

test("validateNewsPostQuality accepts enough source and internal links", () => {
  const post = makePost(
    "AI tooling is settling into workflow details, according to [one report](https://example.com/one). Developers still need capture context, as [another source](https://example.com/two) shows. Element Armory's [AI coding workflow guide](/topics/ai-coding-workflows/ui-for-ai-coding/capture-ui-for-ai-coding) and [earlier blog coverage](/blog/ai-ui-news) make that bridge practical."
  );

  assert.deepEqual(validateNewsPostQuality(post), []);
});

test("validateNewsPostQuality reports missing links and unresolved placeholders", () => {
  const post = makePost("A short body with {{SRC:1|a source}} but no resolved internal links.");

  const issues = validateNewsPostQuality(post);

  assert.ok(issues.some((issue) => issue.includes("external source link")));
  assert.ok(issues.some((issue) => issue.includes("internal link")));
  assert.ok(issues.some((issue) => issue.includes("Unresolved link placeholders")));
});
