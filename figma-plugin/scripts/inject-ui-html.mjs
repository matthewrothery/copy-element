/**
 * Post-build: inline ui.js and CSS into ui.html so Figma's iframe can load the plugin UI (no external assets).
 * Run after `vite build`. Reads dist/ui.html, dist/ui.js, and dist/assets/*.css; writes dist/ui.html with inlined script and styles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "..", "dist");
const uiHtmlPath = path.join(dist, "ui.html");
const uiJsPath = path.join(dist, "ui.js");

if (!fs.existsSync(uiHtmlPath) || !fs.existsSync(uiJsPath)) {
  console.warn("inject-ui-html: dist/ui.html or dist/ui.js missing, skipping");
  process.exit(0);
}

let html = fs.readFileSync(uiHtmlPath, "utf8");
const scriptContent = fs.readFileSync(uiJsPath, "utf8");

// Inline stylesheet: find link[rel=stylesheet] and replace with <style> content
const linkMatch = html.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]*)"[^>]*>/i);
if (linkMatch) {
  const cssHref = linkMatch[1].replace(/^\//, "");
  const cssPath = path.join(dist, cssHref);
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, "utf8");
    html = html.replace(linkMatch[0], `<style>${cssContent}</style>`);
    console.log("inject-ui-html: inlined CSS into ui.html");
  }
}

// Replace external script with inlined script
const scriptTag = `<script type="module">\n${scriptContent}\n</script>`;
html = html.replace(/<script[^>]*src="[^"]*ui\.js[^"]*"[^>]*><\/script>/i, scriptTag);

fs.writeFileSync(uiHtmlPath, html, "utf8");
console.log("inject-ui-html: inlined ui.js into ui.html");
try {
  fs.unlinkSync(uiJsPath);
} catch (_) {}
