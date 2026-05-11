import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { applyLinkPlaceholders } from "./applyLinkPlaceholders.js";
import { loadInternalLinkCandidates } from "./internalLinks.js";
import type { ResearchResult } from "./types.js";

test("loadInternalLinkCandidates includes existing blog posts", () => {
  const root = mkdtempSync(path.join(tmpdir(), "auto-blogger-links-"));
  const blogDir = path.join(root, "content", "blog");
  mkdirSync(blogDir, { recursive: true });
  writeFileSync(
    path.join(blogDir, "ai-ui-news.md"),
    `---\ntitle: "AI UI News"\nslug: "ai-ui-news"\n---\n\nBody\n`,
    "utf-8"
  );

  const candidates = loadInternalLinkCandidates(root);
  const blog = candidates.find((candidate) => candidate.type === "blog");

  assert.ok(blog);
  assert.equal(blog.title, "AI UI News");
  assert.equal(blog.url, "/blog/ai-ui-news");
  assert.equal(blog.hubSlug, "blog");
});

test("applyLinkPlaceholders resolves blog and source placeholders", () => {
  const candidates = [
    {
      title: "AI UI News",
      topic: "Blog",
      url: "/blog/ai-ui-news",
      type: "blog" as const,
      hubSlug: "blog",
      hubTitle: "Blog",
      slug: "ai-ui-news",
    },
    {
      title: "Capture UI for AI Coding",
      topic: "AI Coding Workflows",
      url: "/topics/ai-coding-workflows/ui-for-ai-coding/capture-ui-for-ai-coding",
      type: "article" as const,
      hubSlug: "ai-coding-workflows",
      hubTitle: "AI Coding Workflows",
      clusterSlug: "ui-for-ai-coding",
      clusterTitle: "UI for AI Coding",
      slug: "capture-ui-for-ai-coding",
    },
  ];
  const research: ResearchResult[] = [
    {
      title: "Source",
      url: "https://example.com/source",
      snippet: "Snippet",
    },
  ];

  const result = applyLinkPlaceholders(
    "Read {{LINK:blog:ai-ui-news|the AI UI news brief}}, then compare {{LINK:capture-ui-for-ai-coding|capture workflows}} with {{SRC:1|the source report}}.",
    candidates,
    research
  );

  assert.equal(result.internalLinkCount, 2);
  assert.equal(result.externalLinkCount, 1);
  assert.match(result.body, /\[the AI UI news brief\]\(\/blog\/ai-ui-news\)/);
  assert.match(result.body, /\[capture workflows\]\(\/topics\/ai-coding-workflows\/ui-for-ai-coding\/capture-ui-for-ai-coding\)/);
  assert.match(result.body, /\[the source report\]\(https:\/\/example.com\/source\)/);
});
