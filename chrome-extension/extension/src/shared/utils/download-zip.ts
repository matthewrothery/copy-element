import JSZip from "jszip";
import type { Snippet } from "../types/snippet";

export async function downloadZip(snippet: Snippet, html: string, css: string): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder("element-armory-export")!;

  const standalone = [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `  <title>${snippet.title}</title>`,
    "  <style>",
    css || "/* No styles */",
    "  </style>",
    "</head>",
    "<body>",
    html,
    "</body>",
    "</html>"
  ].join("\n");

  folder.file("index.html", standalone);
  folder.file("styles.css", css || "/* No styles */");
  folder.file(
    "README.md",
    [
      `# ${snippet.title}`,
      "",
      `Source: ${snippet.sourceUrl}`,
      `Captured: ${new Date(snippet.createdAt).toLocaleString()}`,
      "",
      "Captured with [Element Armory](https://elementarmory.com)"
    ].join("\n")
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${snippet.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
