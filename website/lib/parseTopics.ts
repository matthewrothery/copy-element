import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { markdownToArticleHtml } from "@/lib/markdownArticleHtml";

const TOPICS_DIR = join(process.cwd(), "content", "topics");

/** Hub order for `/topics` index — matches auto-blogger list.md section order. */
const TOPIC_HUB_ORDER: readonly string[] = [
  "copy-ui-from-websites",
  "tool-alternatives",
  "ai-coding-workflows",
  "ui-development-without-design-skills",
  "component-reuse-libraries",
  "chrome-extension-use-cases",
  "inspecting-debugging-css",
  "ui-patterns-reverse-engineering",
  "landing-page-saas-ui",
  "advanced-workflows-automation",
];

function hubSortIndex(hub: string): number {
  const i = TOPIC_HUB_ORDER.indexOf(hub);
  return i === -1 ? TOPIC_HUB_ORDER.length : i;
}

export type FaqItem = {
  question: string;
  answer: string;
};

export type TopicArticle = {
  hub: string;
  hubTitle: string;
  cluster: string;
  clusterTitle: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  readTime: string;
  coverImage?: string;
  faq: FaqItem[];
  relatedSlugs: string[];
  contentHtml: string;
};

export type TopicCluster = {
  hub: string;
  hubTitle: string;
  cluster: string;
  title: string;
  excerpt: string;
  faq: FaqItem[];
  contentHtml?: string;
  articles: TopicArticle[];
};

export type TopicHub = {
  hub: string;
  title: string;
  excerpt: string;
  faq: FaqItem[];
  clusters: TopicCluster[];
};

function parseArticleFile(filePath: string): TopicArticle {
  const raw = readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const contentHtml = markdownToArticleHtml(content);

  return {
    hub: data.hub as string,
    hubTitle: data.hubTitle as string,
    cluster: data.cluster as string,
    clusterTitle: data.clusterTitle as string,
    slug: data.slug as string,
    title: data.title as string,
    date: data.date as string,
    excerpt: data.excerpt as string,
    readTime: (data.readTime as string) ?? "5 min read",
    coverImage: data.coverImage as string | undefined,
    faq: (data.faq as FaqItem[]) ?? [],
    relatedSlugs: (data.relatedSlugs as string[]) ?? [],
    contentHtml,
  };
}

function parseClusterIndex(
  filePath: string,
  hub: string,
  cluster: string,
  articles: TopicArticle[]
): TopicCluster {
  if (!existsSync(filePath)) {
    const firstArticle = articles[0];
    return {
      hub,
      hubTitle: firstArticle?.hubTitle ?? hub,
      cluster,
      title: cluster.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      excerpt: `Guides and tutorials about ${cluster.replace(/-/g, " ")}.`,
      faq: [],
      articles,
    };
  }

  const raw = readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    hub: (data.hub as string) ?? hub,
    hubTitle: (data.hubTitle as string) ?? hub,
    cluster: (data.cluster as string) ?? cluster,
    title: data.title as string,
    excerpt: data.excerpt as string,
    faq: (data.faq as FaqItem[]) ?? [],
    contentHtml: content.trim().length > 0 ? markdownToArticleHtml(content) : undefined,
    articles,
  };
}

function parseHubIndex(
  filePath: string,
  hub: string,
  clusters: TopicCluster[]
): TopicHub {
  if (!existsSync(filePath)) {
    return {
      hub,
      title: hub.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      excerpt: `In-depth guides, tutorials, and resources about ${hub.replace(/-/g, " ")}.`,
      faq: [],
      clusters,
    };
  }

  const raw = readFileSync(filePath, "utf-8");
  const { data } = matter(raw);

  return {
    hub: (data.hub as string) ?? hub,
    title: data.title as string,
    excerpt: data.excerpt as string,
    faq: (data.faq as FaqItem[]) ?? [],
    clusters,
  };
}

function loadCluster(hubDir: string, hub: string, cluster: string): TopicCluster {
  const clusterDir = join(hubDir, cluster);
  const files = readdirSync(clusterDir).filter(
    (f) => f.endsWith(".md") && f !== "_index.md"
  );
  const articles = files
    .map((f) => parseArticleFile(join(clusterDir, f)))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return parseClusterIndex(join(clusterDir, "_index.md"), hub, cluster, articles);
}

function loadHub(hub: string): TopicHub {
  const hubDir = join(TOPICS_DIR, hub);
  const entries = readdirSync(hubDir, { withFileTypes: true });
  const clusterDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const clusters = clusterDirs.map((cluster) => loadCluster(hubDir, hub, cluster));

  return parseHubIndex(join(hubDir, "_index.md"), hub, clusters);
}

export function getAllHubs(): TopicHub[] {
  if (!existsSync(TOPICS_DIR)) return [];
  const entries = readdirSync(TOPICS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => loadHub(e.name))
    .sort((a, b) => {
      const d = hubSortIndex(a.hub) - hubSortIndex(b.hub);
      if (d !== 0) return d;
      return a.hub.localeCompare(b.hub);
    });
}

export function getHub(hub: string): TopicHub | undefined {
  if (!existsSync(join(TOPICS_DIR, hub))) return undefined;
  return loadHub(hub);
}

export function getAllClusters(hub: string): TopicCluster[] {
  const h = getHub(hub);
  return h?.clusters ?? [];
}

export function getCluster(hub: string, cluster: string): TopicCluster | undefined {
  return getAllClusters(hub).find((c) => c.cluster === cluster);
}

export function getAllArticles(hub: string, cluster: string): TopicArticle[] {
  return getCluster(hub, cluster)?.articles ?? [];
}

export function getArticle(
  hub: string,
  cluster: string,
  slug: string
): TopicArticle | undefined {
  return getAllArticles(hub, cluster).find((a) => a.slug === slug);
}

export function getAllArticlesFlat(): TopicArticle[] {
  return getAllHubs().flatMap((h) =>
    h.clusters.flatMap((c) => c.articles)
  );
}

export function getAllClustersFlat(): { hub: string; cluster: string }[] {
  return getAllHubs().flatMap((h) =>
    h.clusters.map((c) => ({ hub: h.hub, cluster: c.cluster }))
  );
}
