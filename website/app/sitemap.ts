import type { MetadataRoute } from "next";
import { EXAMPLES } from "@/data/examples";
import { getAllPosts } from "@/lib/parseBlog";
import { getAllHubs, getAllArticlesFlat } from "@/lib/parseTopics";
import { SITE_URL } from "@/lib/publicConfig";
import { STATIC_SITEMAP_ROUTES } from "@/lib/seo";

export const dynamic = "force-static";

function dateFromFrontmatter(value?: string): Date {
  if (!value) return new Date("2026-01-01T00:00:00.000Z");
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? new Date("2026-01-01T00:00:00.000Z") : date;
}

function newestDate(dates: Date[]): Date {
  return dates.reduce((latest, date) => (date > latest ? date : latest), dates[0] ?? new Date("2026-01-01T00:00:00.000Z"));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const blogPosts = getAllPosts()
    .filter((post) => !post.noindex)
    .map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: dateFromFrontmatter(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  const topicHubs = getAllHubs().map((h) => ({
    url: `${SITE_URL}/topics/${h.hub}`,
    lastModified: newestDate(
      h.clusters.flatMap((c) =>
        c.articles.map((a) => dateFromFrontmatter(a.updatedAt ?? a.date))
      )
    ),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const topicClusters = getAllHubs().flatMap((h) =>
    h.clusters.map((c) => ({
      url: `${SITE_URL}/topics/${h.hub}/${c.cluster}`,
      lastModified: newestDate(
        c.articles.map((a) => dateFromFrontmatter(a.updatedAt ?? a.date))
      ),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  );

  const topicArticles = getAllArticlesFlat().map((a) => ({
    url: `${SITE_URL}/topics/${a.hub}/${a.cluster}/${a.slug}`,
    lastModified: dateFromFrontmatter(a.updatedAt ?? a.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...STATIC_SITEMAP_ROUTES.map(
      ({ path, priority = 0.8, changeFrequency = "monthly" }) => ({
        url: `${SITE_URL}${path}`,
        lastModified,
        changeFrequency,
        priority,
      })
    ),
    ...blogPosts,
    ...topicHubs,
    ...topicClusters,
    ...topicArticles,
    ...EXAMPLES.map((ex) => ({
      url: `${SITE_URL}/examples/${ex.id}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
