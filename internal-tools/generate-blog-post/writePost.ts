import { writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import type { GeneratedPost } from "./generatePost.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const BLOG_DIR = join(__dirname, "../../website/content/blog");

export type PostInput = GeneratedPost & {
  author: string;
  coverImage?: string;
  date: string;
};

export function buildFrontmatter(post: PostInput): string {
  const lines = [
    `---`,
    `title: "${post.title.replace(/"/g, '\\"')}"`,
    `slug: "${post.slug}"`,
    `date: "${post.date}"`,
    `author: "${post.author}"`,
    `excerpt: "${post.excerpt.replace(/"/g, '\\"')}"`,
    `readTime: "${post.readTime}"`,
  ];

  if (post.coverImage) {
    lines.push(`coverImage: "${post.coverImage}"`);
  }

  lines.push(`---`);
  return lines.join("\n");
}

export function writePost(post: PostInput): string {
  const frontmatter = buildFrontmatter(post);
  const content = `${frontmatter}\n\n${post.body}\n`;
  const filePath = join(BLOG_DIR, `${post.slug}.md`);

  writeFileSync(filePath, content, "utf-8");
  return filePath;
}
