import test from "node:test";
import assert from "node:assert/strict";
import {
  selectRelevantResearch,
  buildSectionPrompt,
  MetadataSchema,
} from "./generateSection.js";
import type { ResearchResult, InternalLinkCandidate } from "./types.js";

// --- selectRelevantResearch ---

function makeResearch(title: string, content: string): ResearchResult {
  return { title, url: "https://example.com", snippet: content.slice(0, 80), content };
}

test("selectRelevantResearch returns top-N by heading keyword overlap", () => {
  const research: ResearchResult[] = [
    makeResearch("CSS grid layout guide", "CSS grid is a powerful layout system."),
    makeResearch("JavaScript async patterns", "Async/await simplifies asynchronous code."),
    makeResearch("CSS flexbox tutorial", "Flexbox is great for CSS layouts."),
    makeResearch("TypeScript generics", "Generics enable reusable typed code."),
    makeResearch("CSS variables and custom properties", "CSS variables allow dynamic theming."),
  ];

  const results = selectRelevantResearch(research, "Understanding CSS Layout Systems", 3);

  assert.equal(results.length, 3);
  // The top 3 should be CSS-related (contain 'css' overlapping with heading words)
  const titles = results.map((r) => r.item.title);
  assert.ok(titles.some((t) => t.includes("CSS")), "Expected CSS items in top results");
  // source numbers should be 1-based indices into the original array
  for (const r of results) {
    assert.ok(r.sourceNum >= 1 && r.sourceNum <= research.length);
  }
});

test("selectRelevantResearch handles n larger than research array", () => {
  const research = [makeResearch("A", "alpha"), makeResearch("B", "beta")];
  const results = selectRelevantResearch(research, "anything", 10);
  assert.equal(results.length, 2);
});

test("selectRelevantResearch preserves original source numbers", () => {
  const research: ResearchResult[] = [
    makeResearch("unrelated item one", "nothing in common"),
    makeResearch("target specific keyword", "this matches target keyword well"),
    makeResearch("unrelated item two", "nothing similar"),
  ];
  const results = selectRelevantResearch(research, "target keyword", 1);
  assert.equal(results.length, 1);
  assert.equal(results[0].sourceNum, 2); // second item in original list
});

// --- buildSectionPrompt ---

function makeCandidate(title: string, id: string): InternalLinkCandidate {
  return {
    title,
    topic: title,
    url: `/topics/hub/cluster/${id}`,
    type: "article",
    hubSlug: "hub",
    hubTitle: "Hub",
    linkKeywords: ["sample keyword"],
  };
}

test("buildSectionPrompt contains heading, link budget line, and research refs", () => {
  const params = {
    heading: "How to Use CSS Grid",
    angle: "practical workflow",
    targetReader: "front-end developers",
    allHeadings: ["Intro", "How to Use CSS Grid", "Advanced Tips"],
    sectionIndex: 1,
    totalSections: 3,
    previousSectionTail: "...end of intro section.",
    relevantResearch: [
      { item: makeResearch("CSS Grid Guide", "Grid tutorial content"), sourceNum: 2 },
    ],
    internalLinkCandidates: [makeCandidate("Grid Article", "grid-article")],
    linksUsedSoFar: 2,
    placedLinkIds: new Set(["hub/cluster/other-article"]),
    placedSrcNums: new Set([1]),
    isFirstSection: false,
    primaryKeyword: "CSS grid layout",
  };

  const prompt = buildSectionPrompt(params);

  assert.ok(prompt.includes("## How to Use CSS Grid"), "Heading should appear in prompt");
  assert.ok(prompt.includes("Source 2"), "Research source number should appear");
  assert.ok(prompt.includes("placed so far"), "Link budget line should appear");
  assert.ok(prompt.includes("end of intro section"), "Previous section tail should appear");
  assert.ok(
    prompt.includes("hub/cluster/other-article"),
    "Placed link ids should appear in prompt"
  );
  assert.ok(prompt.includes("1"), "Placed source numbers should appear");
});

test("buildSectionPrompt includes upfront answer instruction for first section", () => {
  const params = {
    heading: "What Is Element Armory",
    angle: "product introduction",
    targetReader: "developers",
    allHeadings: ["What Is Element Armory"],
    sectionIndex: 0,
    totalSections: 1,
    previousSectionTail: "",
    relevantResearch: [],
    internalLinkCandidates: [],
    linksUsedSoFar: 0,
    placedLinkIds: new Set<string>(),
    placedSrcNums: new Set<number>(),
    isFirstSection: true,
    primaryKeyword: "element armory chrome extension",
  };

  const prompt = buildSectionPrompt(params);

  assert.ok(
    prompt.includes("upfront answer"),
    "First section prompt should request an upfront answer"
  );
  assert.ok(
    prompt.includes("element armory chrome extension"),
    "Primary keyword should appear in upfront instruction"
  );
});

// --- MetadataSchema validation ---

test("MetadataSchema rejects linkKeywords arrays shorter than 8", () => {
  const result = MetadataSchema.safeParse({
    title: "Test Title",
    slug: "test-title",
    excerpt: "A long enough excerpt that meets the minimum character requirement here.",
    readTime: "5 min read",
    imagePrompt: "A bold stencil street-art cover image.",
    linkKeywords: ["one", "two", "three"], // only 3 — below min(8)
    diagrams: [],
  });
  assert.ok(!result.success, "Should reject fewer than 8 linkKeywords");
});

test("MetadataSchema accepts 8 or more linkKeywords", () => {
  const result = MetadataSchema.safeParse({
    title: "Test Title",
    slug: "test-title",
    excerpt: "A long enough excerpt that meets the minimum character requirement here.",
    readTime: "5 min read",
    imagePrompt: "A bold stencil street-art cover image.",
    linkKeywords: ["one", "two", "three", "four", "five", "six", "seven", "eight"],
    diagrams: [],
  });
  assert.ok(result.success, "Should accept 8 linkKeywords");
});
