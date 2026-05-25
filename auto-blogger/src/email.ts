import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { marked } from "marked";
import { ArticleArtifact, BackfillSummary, SeoScore, TokenUsage } from "./types.js";
import type { DigestSummary } from "./outputAdapter.js";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function seoScoreColor(score: number): string {
  if (score >= 80) return "#15803d";
  if (score >= 60) return "#b45309";
  return "#b91c1c";
}

function seoScoreCardHtml(score: SeoScore): string {
  const categories: Array<{ label: string; key: keyof Omit<SeoScore, "overall"> }> = [
    { label: "Title", key: "title" },
    { label: "Excerpt", key: "excerpt" },
    { label: "Upfront Answer", key: "upfrontAnswer" },
    { label: "Heading Optimization", key: "headingOptimization" },
    { label: "Content Depth", key: "contentDepth" },
    { label: "Featured Snippet", key: "featuredSnippetReady" },
    { label: "Readability", key: "readability" },
  ];
  const rows = categories
    .map((c) => {
      const cat = score[c.key];
      const color = seoScoreColor(cat.score);
      return `<tr>
        <td style="padding: 4px 8px; color: #6b7280;">${c.label}</td>
        <td style="padding: 4px 8px; font-weight: bold; color: ${color};">${cat.score}</td>
        <td style="padding: 4px 8px; color: #374151;">${escapeHtml(cat.suggestion)}</td>
      </tr>`;
    })
    .join("");
  const overallColor = seoScoreColor(score.overall);
  return `
    <h2>SEO Quality Score: <span style="color: ${overallColor};">${score.overall}/100</span></h2>
    <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 4px 8px; text-align: left;">Category</th>
          <th style="padding: 4px 8px; text-align: left;">Score</th>
          <th style="padding: 4px 8px; text-align: left;">Suggestion</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function seoScoreCardText(score: SeoScore): string[] {
  return [
    "",
    `SEO Score: ${score.overall}/100`,
    `  Title: ${score.title.score} — ${score.title.suggestion}`,
    `  Excerpt: ${score.excerpt.score} — ${score.excerpt.suggestion}`,
    `  Upfront Answer: ${score.upfrontAnswer.score} — ${score.upfrontAnswer.suggestion}`,
    `  Headings: ${score.headingOptimization.score} — ${score.headingOptimization.suggestion}`,
    `  Content Depth: ${score.contentDepth.score} — ${score.contentDepth.suggestion}`,
    `  Featured Snippet: ${score.featuredSnippetReady.score} — ${score.featuredSnippetReady.suggestion}`,
    `  Readability: ${score.readability.score} — ${score.readability.suggestion}`,
  ];
}

function qualityWarningsBlockHtml(warnings: string[]): string {
  const items = warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("");
  return `
      <h2 style="color: #b45309;">Quality warnings</h2>
      <p style="color: #92400e;">Review before publishing. Generation continued so you can edit and reuse this copy.</p>
      <ul style="color: #92400e;">${items}</ul>`;
}

function backfillBlockHtml(summary: BackfillSummary | undefined): string {
  if (!summary) return "";
  if (summary.filesChanged === 0) {
    return `<h2>Internal-link backfill</h2><p>No changes (no lexical matches in existing articles).</p>`;
  }
  const sha = summary.commitSha ? ` <code>${escapeHtml(summary.commitSha.slice(0, 7))}</code>` : "";
  const pushedNote = summary.commitSha && !summary.pushed
    ? `<p style="color: #b45309;">Auto-push failed; commit is local on the runner.</p>`
    : "";
  const fileItems = summary.perFile
    .map((f) => {
      const anchors = f.addedTargets.map((t) => `"${escapeHtml(t.anchor)}"`).join(", ");
      return `<li><code>${escapeHtml(f.path)}</code> &mdash; ${anchors}</li>`;
    })
    .join("");
  const warnBlock = summary.warnings.length
    ? `<h3 style="color: #b45309;">Backfill warnings</h3><ul style="color: #92400e;">${summary.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>`
    : "";
  return `
      <h2>Internal-link backfill</h2>
      <p>Added ${summary.linksAdded} internal link${summary.linksAdded === 1 ? "" : "s"} across ${summary.filesChanged} file${summary.filesChanged === 1 ? "" : "s"}${sha}.</p>
      ${pushedNote}
      <ul>${fileItems}</ul>
      ${warnBlock}`;
}

function backfillBlockText(summary: BackfillSummary | undefined): string[] {
  if (!summary) return [];
  if (summary.filesChanged === 0) return ["", "Internal-link backfill: no changes."];
  const lines = [
    "",
    `Internal-link backfill: added ${summary.linksAdded} link(s) across ${summary.filesChanged} file(s)` +
      (summary.commitSha ? ` (commit ${summary.commitSha.slice(0, 7)}${summary.pushed ? ", pushed" : ", LOCAL — auto-push failed"})` : ""),
  ];
  for (const f of summary.perFile) {
    const anchors = f.addedTargets.map((t) => `"${t.anchor}"`).join(", ");
    lines.push(`- ${f.path}: ${anchors}`);
  }
  if (summary.warnings.length) {
    lines.push("Backfill warnings:");
    for (const w of summary.warnings) lines.push(`- ${w}`);
  }
  return lines;
}

type ModelPricing = { inputPerMTok: number; outputPerMTok: number };

const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-haiku-4-5": { inputPerMTok: 1.0, outputPerMTok: 5.0 },
  "gemini-3.1-flash-image-preview": { inputPerMTok: 2.0, outputPerMTok: 12.0 },
  "gemini-2.5-flash-image": { inputPerMTok: 0.30, outputPerMTok: 8.0 },
  "gemini-2.5-flash": { inputPerMTok: 2.0, outputPerMTok: 12.0 },
  "gemini-2.5-pro": { inputPerMTok: 2.0, outputPerMTok: 12.0 },
};

function lookupPricing(model: string): ModelPricing | undefined {
  const key = Object.keys(MODEL_PRICING).find((k) => model.includes(k));
  return key ? MODEL_PRICING[key] : undefined;
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(4)}`;
}

function calcCostSummary(model: string, usage: TokenUsage): string {
  const pricing = lookupPricing(model);
  if (!pricing) return "Cost: unknown model";
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPerMTok;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPerMTok;
  const total = inputCost + outputCost;
  return (
    `${usage.inputTokens.toLocaleString()} input + ${usage.outputTokens.toLocaleString()} output tokens` +
    ` = ${formatCost(total)} (${formatCost(inputCost)} in + ${formatCost(outputCost)} out)`
  );
}

function getClient(): SESClient {
  return new SESClient({ region: process.env.AWS_SES_REGION ?? process.env.AWS_REGION ?? "us-east-2" });
}

function buildSubject(artifact: ArticleArtifact, subjectPrefix?: string): string {
  const prefix = subjectPrefix ?? "Generated topic article";
  return `${prefix}: ${artifact.metadata.title}`;
}

function buildHtml(input: {
  artifact: ArticleArtifact;
  imageUrl?: string;
  model: string;
  tokenUsage?: TokenUsage;
  backfill?: BackfillSummary;
  seoScore?: SeoScore;
}): string {
  const articleHtml = marked.parse(input.artifact.articleMarkdown) as string;
  const sourceList = input.artifact.metadata.sourceUrls
    .map((url) => `<li><a href="${url}">${url}</a></li>`)
    .join("");

  return `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h1 style="margin-bottom: 4px;">${input.artifact.metadata.title}</h1>
      <p style="color: #6b7280; margin-top: 0;">
        ${input.artifact.metadata.hubSlug && input.artifact.metadata.clusterSlug
          ? `${input.artifact.metadata.hubSlug} / ${input.artifact.metadata.clusterSlug} · `
          : ""}${input.artifact.metadata.date}
      </p>
      ${
        input.imageUrl
          ? `<p><img src="${input.imageUrl}" alt="${escapeHtml(input.artifact.metadata.title)}" style="max-width: 680px; width: 100%; border-radius: 12px;" /></p>`
          : ""
      }
      ${
        input.artifact.metadata.qualityWarnings?.length
          ? qualityWarningsBlockHtml(input.artifact.metadata.qualityWarnings)
          : ""
      }
      ${input.seoScore ? seoScoreCardHtml(input.seoScore) : ""}
      <h2>Generated Copy</h2>
      <div>${articleHtml}</div>
      ${backfillBlockHtml(input.backfill)}
      <h2>Source URLs</h2>
      <ul>${sourceList}</ul>
      <h2>Artifact Metadata</h2>
      <p><strong>Artifact ID:</strong> ${input.artifact.artifactId}</p>
      <p><strong>Text model:</strong> ${input.model}</p>
      <p><strong>Image model:</strong> ${input.artifact.metadata.imageModel}</p>
      ${input.tokenUsage ? `<p><strong>Cost:</strong> ${escapeHtml(calcCostSummary(input.model, input.tokenUsage))}</p>` : ""}
      <p><strong>Article path:</strong> ${input.artifact.metadata.articlePath}</p>
      <p><strong>Cover path:</strong> ${input.artifact.metadata.imagePath}</p>
      ${
        input.artifact.metadata.assets?.length
          ? `<p><strong>Assets:</strong></p><ul>${input.artifact.metadata.assets.map((a) => `<li>${escapeHtml(a.websiteRelativePath)} (${escapeHtml(a.s3Name)})</li>`).join("")}</ul>`
          : ""
      }
    </body>
  </html>`;
}

function buildText(
  artifact: ArticleArtifact,
  model: string,
  tokenUsage?: TokenUsage,
  backfill?: BackfillSummary,
  seoScore?: SeoScore
): string {
  const warningsBlock =
    artifact.metadata.qualityWarnings && artifact.metadata.qualityWarnings.length > 0
      ? [
          "",
          "Quality warnings (review before publishing; generation continued so you can edit this copy):",
          ...artifact.metadata.qualityWarnings.map((w) => `- ${w}`),
          "",
        ]
      : [""];

  return [
    `Generated topic article: ${artifact.metadata.title}`,
    ...(artifact.metadata.hubSlug && artifact.metadata.clusterSlug
      ? [`${artifact.metadata.hubSlug} / ${artifact.metadata.clusterSlug}`]
      : []),
    `Date: ${artifact.metadata.date}`,
    `Artifact ID: ${artifact.artifactId}`,
    `Text model: ${model}`,
    `Image model: ${artifact.metadata.imageModel}`,
    ...(tokenUsage ? [`Cost: ${calcCostSummary(model, tokenUsage)}`] : []),
    ...(artifact.metadata.assets?.length
      ? ["", "Assets:", ...artifact.metadata.assets.map((a) => `- ${a.websiteRelativePath}`)]
      : []),
    ...warningsBlock,
    ...(seoScore ? seoScoreCardText(seoScore) : []),
    artifact.articleMarkdown,
    ...backfillBlockText(backfill),
    "",
    "Source URLs:",
    ...artifact.metadata.sourceUrls,
  ].join("\n");
}

export async function sendBackfillNotification(input: {
  to: string;
  from: string;
  importedSlugs: string[];
  summary: BackfillSummary;
}): Promise<void> {
  const client = getClient();
  const subject =
    input.summary.filesChanged === 0
      ? `Backfill: no changes for ${input.importedSlugs.length} imported article(s)`
      : `Backfill: +${input.summary.linksAdded} link(s) across ${input.summary.filesChanged} file(s)`;
  const importedList = input.importedSlugs.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  const html = `<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
    <h1>${escapeHtml(subject)}</h1>
    <h2>Imported articles</h2>
    <ul>${importedList}</ul>
    ${backfillBlockHtml(input.summary)}
  </body></html>`;
  const text = [
    subject,
    "",
    "Imported articles:",
    ...input.importedSlugs.map((s) => `- ${s}`),
    ...backfillBlockText(input.summary),
  ].join("\n");
  await client.send(
    new SendEmailCommand({
      Source: input.from,
      Destination: { ToAddresses: [input.to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          Text: { Data: text, Charset: "UTF-8" },
        },
      },
    })
  );
}

function buildDigestSubject(summary: DigestSummary): string {
  const count = summary.results.length;
  const failed = summary.failures.length;
  const cycle = summary.cycle === "topics" ? "topic articles" : "news posts";
  if (failed === 0) {
    return `Daily digest (${summary.date}): ${count} ${cycle}`;
  }
  return `Daily digest (${summary.date}): ${count} ${cycle}, ${failed} failure(s)`;
}

function buildDigestHtml(summary: DigestSummary): string {
  const articleBlocks = summary.results
    .map((r) => {
      const m = r.artifact.metadata;
      const cover = r.coverUrl
        ? `<p><img src="${r.coverUrl}" alt="${escapeHtml(m.title)}" style="max-width: 480px; width: 100%; border-radius: 8px;" /></p>`
        : "";
      const warnings = m.qualityWarnings?.length
        ? `<p style="color: #b45309;"><strong>Quality warnings:</strong> ${m.qualityWarnings.map(escapeHtml).join("; ")}</p>`
        : "";
      const cost = `<p style="color: #6b7280;"><small>${escapeHtml(calcCostSummary(summary.textModel, r.tokenUsage))}</small></p>`;
      const breadcrumb =
        m.hubSlug && m.clusterSlug ? `${escapeHtml(m.hubSlug)} / ${escapeHtml(m.clusterSlug)}` : escapeHtml("blog");
      return `
        <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin-bottom: 4px;">${escapeHtml(m.title)}</h2>
          <p style="color: #6b7280; margin-top: 0;">${breadcrumb} · ${escapeHtml(m.date)}</p>
          ${cover}
          ${warnings}
          ${cost}
          <p><small>Artifact: <code>${escapeHtml(r.artifact.artifactId)}</code></small></p>
        </div>`;
    })
    .join("");

  const failureBlock = summary.failures.length
    ? `<h2 style="color: #b91c1c;">Failures</h2>
       <ul style="color: #991b1b;">${summary.failures
         .map((f) => `<li><strong>${escapeHtml(f.label)}:</strong> ${escapeHtml(f.error)}</li>`)
         .join("")}</ul>`
    : "";

  const totalInput = summary.results.reduce((acc, r) => acc + r.tokenUsage.inputTokens, 0);
  const totalOutput = summary.results.reduce((acc, r) => acc + r.tokenUsage.outputTokens, 0);
  const totalsLine = `<p style="color: #6b7280;"><small>Total tokens: ${totalInput.toLocaleString()} input + ${totalOutput.toLocaleString()} output across ${summary.results.length} article(s).</small></p>`;

  return `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h1>${escapeHtml(buildDigestSubject(summary))}</h1>
      ${totalsLine}
      ${articleBlocks}
      ${failureBlock}
    </body>
  </html>`;
}

function buildDigestText(summary: DigestSummary): string {
  const lines: string[] = [buildDigestSubject(summary), ""];
  for (const r of summary.results) {
    const m = r.artifact.metadata;
    lines.push(`- ${m.title} (${m.artifactId})`);
    lines.push(`  ${m.date} · ${calcCostSummary(summary.textModel, r.tokenUsage)}`);
    if (m.qualityWarnings?.length) {
      lines.push(`  Quality warnings: ${m.qualityWarnings.join("; ")}`);
    }
  }
  if (summary.failures.length) {
    lines.push("", "Failures:");
    for (const f of summary.failures) {
      lines.push(`- ${f.label}: ${f.error}`);
    }
  }
  return lines.join("\n");
}

export async function sendDigestNotification(input: {
  to: string;
  from: string;
  summary: DigestSummary;
}): Promise<void> {
  const client = getClient();
  await client.send(
    new SendEmailCommand({
      Source: input.from,
      Destination: { ToAddresses: [input.to] },
      Message: {
        Subject: { Data: buildDigestSubject(input.summary), Charset: "UTF-8" },
        Body: {
          Html: { Data: buildDigestHtml(input.summary), Charset: "UTF-8" },
          Text: { Data: buildDigestText(input.summary), Charset: "UTF-8" },
        },
      },
    })
  );
}

export async function sendPublishedNotification(input: {
  to: string;
  from: string;
  articles: Array<{ title: string; urlPath: string }>;
  siteUrl: string;
}): Promise<void> {
  const client = getClient();
  const count = input.articles.length;
  const subject = `Published to website: ${count} article${count === 1 ? "" : "s"}`;

  const articleItems = input.articles
    .map((a) => {
      const url = `${input.siteUrl}${a.urlPath}`;
      return `<li><a href="${escapeHtml(url)}">${escapeHtml(a.title)}</a><br><small>${escapeHtml(url)}</small></li>`;
    })
    .join("");

  const html = `<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
    <h1>${escapeHtml(subject)}</h1>
    <p>The following article${count === 1 ? " is" : "s are"} now live on the website:</p>
    <ul>${articleItems}</ul>
  </body></html>`;

  const textLines = [subject, "", `${count} article${count === 1 ? "" : "s"} published:`, ""];
  for (const a of input.articles) {
    textLines.push(`- ${a.title}`);
    textLines.push(`  ${input.siteUrl}${a.urlPath}`);
  }

  await client.send(
    new SendEmailCommand({
      Source: input.from,
      Destination: { ToAddresses: [input.to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          Text: { Data: textLines.join("\n"), Charset: "UTF-8" },
        },
      },
    })
  );
}

export async function sendArticleNotification(input: {
  to: string;
  from: string;
  artifact: ArticleArtifact;
  model: string;
  imageUrl?: string;
  tokenUsage?: TokenUsage;
  subjectPrefix?: string;
  backfill?: BackfillSummary;
  seoScore?: SeoScore;
}): Promise<void> {
  const client = getClient();
  await client.send(
    new SendEmailCommand({
      Source: input.from,
      Destination: {
        ToAddresses: [input.to],
      },
      Message: {
        Subject: { Data: buildSubject(input.artifact, input.subjectPrefix), Charset: "UTF-8" },
        Body: {
          Html: { Data: buildHtml({ artifact: input.artifact, imageUrl: input.imageUrl, model: input.model, tokenUsage: input.tokenUsage, backfill: input.backfill, seoScore: input.seoScore }), Charset: "UTF-8" },
          Text: { Data: buildText(input.artifact, input.model, input.tokenUsage, input.backfill, input.seoScore), Charset: "UTF-8" },
        },
      },
    })
  );
}
