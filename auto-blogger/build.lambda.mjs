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
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "dist", "lambda");
const bundleFile = join(outDir, "index.mjs");
const zipFile = join(outDir, "lambda.zip");

// Clean dist/lambda from scratch so stale node_modules from prior builds
// (e.g. nested `@mozilla-readability/readability` directories caused by
// re-running `cp -r` into an existing target) cannot leak into the zip.
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

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

// --- Step 2: install externaled packages (with full transitive deps) ---
// Externals (jsdom, @mozilla/readability, httpcloak) are not bundled by esbuild
// and must ship as real node_modules inside the zip. Hand-copying the top-level
// dirs breaks at runtime because their transitive deps (tough-cookie, whatwg-url,
// parse5, ws, etc.) are missing — that's what caused the Lambda cold-start
// `Cannot find module 'tough-cookie'` ImportModuleError.
//
// Emit a minimal package.json and run `npm install --omit=dev` so npm resolves
// the full dependency tree for us, then ship the resulting node_modules.
console.log("Installing external deps with transitive resolution...");
const sourcePkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf8"));
const lambdaPkg = {
  name: "auto-blogger-lambda",
  version: "0.0.0",
  private: true,
  dependencies: {
    jsdom: sourcePkg.dependencies.jsdom,
    "@mozilla/readability": sourcePkg.dependencies["@mozilla/readability"],
    httpcloak: sourcePkg.dependencies.httpcloak,
  },
};
writeFileSync(join(outDir, "package.json"), JSON.stringify(lambdaPkg, null, 2));
execSync("npm install --omit=dev --no-package-lock --no-audit --no-fund", {
  cwd: outDir,
  stdio: "inherit",
});
const nmDest = join(outDir, "node_modules");

// --- Step 3: zip ---
console.log("Creating zip...");
const { default: AdmZip } = await import("adm-zip");
const zip = new AdmZip();
zip.addLocalFile(bundleFile, "", "index.mjs");
zip.addLocalFolder(nmDest, "node_modules");
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
