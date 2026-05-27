import type { MetadataRoute } from "next";
import { EXAMPLES } from "@/data/examples";
import { getAllPosts } from "@/lib/parseBlog";
import { getAllHubs, getAllClustersFlat, getAllArticlesFlat } from "@/lib/parseTopics";
import { SITE_URL } from "@/lib/publicConfig";
import { STATIC_SITEMAP_ROUTES } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const blogPosts = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const topicHubs = getAllHubs().map((h) => ({
    url: `${SITE_URL}/topics/${h.hub}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const topicClusters = getAllClustersFlat().map(({ hub, cluster }) => ({
    url: `${SITE_URL}/topics/${hub}/${cluster}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const topicArticles = getAllArticlesFlat().map((a) => ({
    url: `${SITE_URL}/topics/${a.hub}/${a.cluster}/${a.slug}`,
    lastModified,
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
