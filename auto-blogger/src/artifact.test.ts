import test from "node:test";
import assert from "node:assert/strict";
import { createArtifact, createBlogArtifact, sanitizeDashes } from "./artifact.js";
import type { GeneratedArticle, GeneratedBlogPost } from "./types.js";

test("sanitizeDashes replaces em-dash and en-dash with hyphen", () => {
  assert.equal(sanitizeDashes("foo\u2014bar\u2013baz"), "foo-bar-baz");
  assert.equal(sanitizeDashes("no change"), "no change");
});

function makeTopicArticle(overrides: Partial<GeneratedArticle> = {}): GeneratedArticle {
  return {
    hubSlug: "ai-coding-workflows",
    hubTitle: "AI Coding Workflows",
    clusterSlug: "ui-for-ai-coding",
    clusterTitle: "UI for AI Coding",
    title: "Capture UI\u2014Fast",
    slug: "capture-ui-fast",
    date: "2026-05-28",
    excerpt: "A short\u2014compelling excerpt.",
    readTime: "5 min read",
    faq: [{ question: "What\u2014is this?", answer: "It\u2014works." }],
    relatedSlugs: [],
    body: "Body text with an em\u2014dash in the middle.",
    imagePrompt: "cover",
    diagrams: [],
    linkKeywords: ["capture ui"],
    ...overrides,
  };
}

test("createArtifact strips em-dashes from full markdown output", () => {
  const artifact = createArtifact({
    article: makeTopicArticle(),
    coverBuffer: Buffer.alloc(0),
    coverExt: "png",
    diagramBuffers: [],
    keywordId: "ai-coding-workflows/ui-for-ai-coding/capture-ui-fast",
    keyword: "capture ui fast",
    sourceUrls: [],
    model: "test:model",
    imageModel: "test:image",
    promptVersion: "v1",
    author: "Element Armory",
    research: [],
  });

  assert.ok(!/[\u2014\u2013]/.test(artifact.articleMarkdown));
  assert.match(artifact.articleMarkdown, /title: "Capture UI-Fast"/);
  assert.match(artifact.articleMarkdown, /excerpt: "A short-compelling excerpt."/);
  assert.match(artifact.articleMarkdown, /Body text with an em-dash in the middle./);
  assert.match(artifact.articleMarkdown, /question: "What-is this\?"/);
  assert.match(artifact.articleMarkdown, /answer: "It-works."/);
});

function makeBlogPost(overrides: Partial<GeneratedBlogPost> = {}): GeneratedBlogPost {
  return {
    title: "News\u2014Headline",
    slug: "news-headline",
    date: "2026-05-28",
    excerpt: "Editorial\u2014angle here.",
    readTime: "4 min read",
    body: "Commentary with\u2014dashes.",
    imagePrompt: "cover",
    sourceItems: [
      {
        title: "Source",
        url: "https://example.com/a",
        publishedAt: "Mon, 28 May 2026 00:00:00 GMT",
        source: "Example",
      },
    ],
    ...overrides,
  };
}

test("createBlogArtifact strips em-dashes from full markdown output", () => {
  const artifact = createBlogArtifact({
    post: makeBlogPost(),
    coverBuffer: Buffer.alloc(0),
    coverExt: "png",
    model: "test:model",
    imageModel: "test:image",
    promptVersion: "v1",
    author: "Element Armory",
  });

  assert.ok(!/[\u2014\u2013]/.test(artifact.articleMarkdown));
  assert.match(artifact.articleMarkdown, /title: "News-Headline"/);
  assert.match(artifact.articleMarkdown, /excerpt: "Editorial-angle here."/);
  assert.match(artifact.articleMarkdown, /Commentary with-dashes./);
});
