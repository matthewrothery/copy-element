import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { markdownToArticleHtml } from "@/lib/markdownArticleHtml";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  readTime: string;
  coverImage?: string;
  contentHtml: string;
};

const BLOG_DIR = join(process.cwd(), "content", "blog");

function parsePost(filename: string): BlogPost {
  const filePath = join(BLOG_DIR, filename);
  const raw = readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const contentHtml = markdownToArticleHtml(content);

  return {
    slug: data.slug as string,
    title: data.title as string,
    date: data.date as string,
    author: data.author as string,
    excerpt: data.excerpt as string,
    readTime: data.readTime as string,
    coverImage: data.coverImage as string | undefined,
    contentHtml,
  };
}

export function getAllPosts(): BlogPost[] {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map(parsePost);
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): BlogPost | undefined {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const post = parsePost(file);
    if (post.slug === slug) return post;
  }
  return undefined;
}
