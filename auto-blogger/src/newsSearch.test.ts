import test from "node:test";
import assert from "node:assert/strict";
import { parseDuckDuckGoResults, parseGoogleNewsRss } from "./newsSearch.js";

test("parseGoogleNewsRss reads plain RSS fields and decodes entities", () => {
  const xml = `<?xml version="1.0"?><rss><channel>
    <item>
      <title>AI UI tools &amp; frontend teams - Example News</title>
      <link>https://news.google.com/rss/articles/example?oc=5</link>
      <pubDate>Wed, 06 May 2026 07:01:01 GMT</pubDate>
      <source url="https://example.com">Example News</source>
      <description>Useful &lt;b&gt;context&lt;/b&gt; for developers.</description>
    </item>
  </channel></rss>`;

  const items = parseGoogleNewsRss(xml, "AI UI tools");

  assert.equal(items.length, 1);
  assert.equal(items[0].title, "AI UI tools & frontend teams - Example News");
  assert.equal(items[0].publishedAt, "Wed, 06 May 2026 07:01:01 GMT");
  assert.equal(items[0].source, "Example News");
  assert.equal(items[0].sourceUrl, "https://example.com");
  assert.equal(items[0].description, "Useful context for developers.");
});

test("parseGoogleNewsRss reads CDATA title values", () => {
  const xml = `<rss><channel>
    <item>
      <title><![CDATA[Thousands of AI-built apps exposed data - Axios]]></title>
      <link>https://news.google.com/rss/articles/axios?oc=5</link>
      <pubDate>Mon, 11 May 2026 02:00:00 GMT</pubDate>
      <source url="https://axios.com">Axios</source>
    </item>
  </channel></rss>`;

  const items = parseGoogleNewsRss(xml, "AI coding agents");

  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Thousands of AI-built apps exposed data - Axios");
  assert.equal(items[0].source, "Axios");
});

test("parseDuckDuckGoResults normalizes result redirects", () => {
  const destination = "https://example.com/article";
  const html = `
    <a class="result__a" href="/l/?uddg=${encodeURIComponent(destination)}">Example Article</a>
    <a class="result__snippet">Short summary</a>
  `;

  const results = parseDuckDuckGoResults(html);

  assert.equal(results.length, 1);
  assert.equal(results[0].url, destination);
  assert.equal(results[0].title, "Example Article");
  assert.equal(results[0].snippet, "Short summary");
});
