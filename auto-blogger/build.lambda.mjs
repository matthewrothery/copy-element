/**
 * Builds the Lambda zip for the auto-blogger.
 *
 * Usage:
 *   npm run build:lambda
 *
 * Output: dist/lambda/lambda.zip
 *
 * The AWS SDK v3 (@aws-sdk/*) ships with the Lambda Node.js 22 runtime and
 * is marked external to keep the bundle small.
 *
 * jsdom and @mozilla/readability are also externaled and bundled as plain
 * node_modules inside the zip (esbuild minification breaks jsdom's
 * self-inspection). adm-zip is used to assemble the final archive.
 */

import { build } from "esbuild";
import { mkdirSync, rmSync, existsSync } from "fs";
import { execSync } from "child_process";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "dist", "lambda");
const bundleFile = join(outDir, "index.mjs");
const zipFile = join(outDir, "lambda.zip");

mkdirSync(outDir, { recursive: true });
if (existsSync(zipFile)) rmSync(zipFile);

// --- Step 1: esbuild bundle ---
console.log("Building bundle...");
await build({
  entryPoints: [join(__dirname, "src", "lambda.ts")],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outfile: bundleFile,
  // CJS packages inside the bundle use require() for Node built-ins. Inject
  // a createRequire shim so those calls resolve correctly in an ESM context.
  banner: {
    js: `import { createRequire as __cjsRequire } from "module"; const require = __cjsRequire(import.meta.url);`,
  },
  // Minify whitespace only; jsdom inspects its own source so deeper minification
  // can break it (though jsdom is marked external anyway).
  minifyIdentifiers: false,
  minifySyntax: false,
  minifyWhitespace: true,
  sourcemap: false,
  external: [
    // AWS SDK v3 ships with the Lambda runtime.
    "@aws-sdk/*",
    // jsdom + readability need to be shipped as node_modules (not bundled)
    // because jsdom inspects its own source for worker thread support.
    "jsdom",
    "@mozilla/readability",
    // httpcloak has a runtime require('./index.js') that breaks when bundled.
    "httpcloak",
    // Native addon (optional dep of some packages)
    "canvas",
  ],
  // Plugin: resolve ../../auto-blogger.config.mjs → actual .mts source so
  // esbuild can inline the config at bundle time.
  plugins: [
    {
      name: "project-config-resolver",
      setup(build) {
        const configSrc = resolve(__dirname, "..", "auto-blogger.config.mts");
        build.onResolve({ filter: /auto-blogger\.config/ }, () => ({
          path: configSrc,
        }));
      },
    },
  ],
});
console.log(`Bundle written: ${bundleFile}`);

// --- Step 2: copy externaled node_modules into dist/lambda/node_modules ---
// External packages to ship as node_modules inside the zip. For scoped
// packages (@org/name), we preserve the directory structure.
const externalPackages = ["jsdom", "@mozilla/readability", "httpcloak"];
const nmSrc = join(__dirname, "node_modules");
const nmDest = join(outDir, "node_modules");
mkdirSync(nmDest, { recursive: true });
for (const pkg of externalPackages) {
  const src = join(nmSrc, pkg);
  if (!existsSync(src)) {
    console.warn(`Warning: ${pkg} not found in node_modules — skip`);
    continue;
  }
  // Preserve scoped-package directory structure (@scope/name → @scope/name).
  const destPkg = join(nmDest, pkg);
  mkdirSync(dirname(destPkg), { recursive: true });
  execSync(`cp -r "${src}" "${destPkg}"`, { stdio: "inherit" });
  console.log(`Copied ${pkg}`);
}

// --- Step 3: zip ---
console.log("Creating zip...");
const { default: AdmZip } = await import("adm-zip");
const zip = new AdmZip();
zip.addLocalFile(bundleFile, "", "index.mjs");
if (existsSync(nmDest)) {
  // addLocalFolder adds the folder contents under the given zip path.
  zip.addLocalFolder(nmDest, "node_modules");
}
// httpcloak requires its own deps (ws, etc.) from node_modules. Copy the
// transitive deps it references that esbuild didn't bundle.
const httpcloakDeps = ["ws", "node-forge"];
for (const dep of httpcloakDeps) {
  const depSrc = join(nmSrc, dep);
  if (existsSync(depSrc)) {
    zip.addLocalFolder(depSrc, `node_modules/${dep}`);
  }
}
zip.writeZip(zipFile);

// Print size.
import { statSync } from "fs";
const zipStat = statSync(zipFile);
const mb = (zipStat.size / 1024 / 1024).toFixed(1);
console.log(`Lambda zip: ${zipFile} (${mb} MB compressed)`);
if (zipStat.size > 50 * 1024 * 1024) {
  console.warn(
    `⚠ Zip is ${mb} MB — exceeds 50 MB upload limit. Consider container image deployment (RISK-001).`
  );
}
