import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { generatePost } from "./generatePost.js";
import { findImage } from "./findImage.js";
import { writePost } from "./writePost.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function parseArgs(argv: string[]): {
  topic: string;
  author: string;
  dryRun: boolean;
} {
  const args = argv.slice(2);
  let topic = "";
  let author = "Matt";
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--author" && args[i + 1]) {
      author = args[++i];
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (!args[i].startsWith("--")) {
      topic = args[i];
    }
  }

  return { topic, author, dryRun };
}

async function main() {
  const { topic, author, dryRun } = parseArgs(process.argv);

  if (!topic) {
    console.error('Usage: npx tsx generate-blog-post/index.ts "Your topic here" [--author "Name"] [--dry-run]');
    process.exit(1);
  }

  const copywriterPath = join(__dirname, "./copywriter.md");
  const copywriterPrompt = readFileSync(copywriterPath, "utf-8");

  console.log(`Generating post: "${topic}"...`);
  const post = await generatePost(topic, copywriterPrompt);

  console.log("Fetching cover image...");
  const coverImage = await findImage(topic);

  const today = new Date().toISOString().slice(0, 10);

  const postInput = {
    ...post,
    author,
    coverImage,
    date: today,
  };

  if (dryRun) {
    const { buildFrontmatter } = await import("./writePost.js");
    const frontmatter = buildFrontmatter(postInput);
    console.log("\n" + frontmatter + "\n\n" + post.body + "\n");
    return;
  }

  const filePath = writePost(postInput);
  console.log(`Written: ${filePath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
