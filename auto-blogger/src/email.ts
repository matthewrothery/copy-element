import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { marked } from "marked";
import { ArticleArtifact } from "./types.js";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function qualityWarningsBlockHtml(warnings: string[]): string {
  const items = warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("");
  return `
      <h2 style="color: #b45309;">Quality warnings</h2>
      <p style="color: #92400e;">Review before publishing. Generation continued so you can edit and reuse this copy.</p>
      <ul style="color: #92400e;">${items}</ul>`;
}

function getClient(): SESClient {
  return new SESClient({ region: process.env.AWS_SES_REGION ?? process.env.AWS_REGION ?? "us-east-2" });
}

function buildSubject(artifact: ArticleArtifact): string {
  return `Generated topic article: ${artifact.metadata.title}`;
}

function buildHtml(input: {
  artifact: ArticleArtifact;
  imageUrl?: string;
  model: string;
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
        ${input.artifact.metadata.hubSlug} / ${input.artifact.metadata.clusterSlug} · ${input.artifact.metadata.date}
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
      <h2>Generated Copy</h2>
      <div>${articleHtml}</div>
      <h2>Source URLs</h2>
      <ul>${sourceList}</ul>
      <h2>Artifact Metadata</h2>
      <p><strong>Artifact ID:</strong> ${input.artifact.artifactId}</p>
      <p><strong>Text model:</strong> ${input.model}</p>
      <p><strong>Image model:</strong> ${input.artifact.metadata.imageModel}</p>
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

function buildText(artifact: ArticleArtifact, model: string): string {
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
    `${artifact.metadata.hubSlug} / ${artifact.metadata.clusterSlug}`,
    `Date: ${artifact.metadata.date}`,
    `Artifact ID: ${artifact.artifactId}`,
    `Text model: ${model}`,
    `Image model: ${artifact.metadata.imageModel}`,
    ...(artifact.metadata.assets?.length
      ? ["", "Assets:", ...artifact.metadata.assets.map((a) => `- ${a.websiteRelativePath}`)]
      : []),
    ...warningsBlock,
    artifact.articleMarkdown,
    "",
    "Source URLs:",
    ...artifact.metadata.sourceUrls,
  ].join("\n");
}

export async function sendArticleNotification(input: {
  to: string;
  from: string;
  artifact: ArticleArtifact;
  model: string;
  imageUrl?: string;
}): Promise<void> {
  const client = getClient();
  await client.send(
    new SendEmailCommand({
      Source: input.from,
      Destination: {
        ToAddresses: [input.to],
      },
      Message: {
        Subject: { Data: buildSubject(input.artifact), Charset: "UTF-8" },
        Body: {
          Html: { Data: buildHtml({ artifact: input.artifact, imageUrl: input.imageUrl, model: input.model }), Charset: "UTF-8" },
          Text: { Data: buildText(input.artifact, input.model), Charset: "UTF-8" },
        },
      },
    })
  );
}
