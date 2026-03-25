import type { MetadataRoute } from "next";
import { EXAMPLES } from "@/data/examples";
import { getAllPosts } from "@/lib/parseBlog";

export const dynamic = "force-static";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://elementarmory.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPaths: Array<{
    url: string;
    priority?: number;
    changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  }> = [
    { url: "", priority: 1, changeFrequency: "weekly" },
    { url: "/product", priority: 0.9, changeFrequency: "monthly" },
    { url: "/features", priority: 0.9, changeFrequency: "monthly" },
    { url: "/pricing", priority: 0.9, changeFrequency: "monthly" },
    { url: "/blog", priority: 0.8, changeFrequency: "weekly" },
    { url: "/examples", priority: 0.8, changeFrequency: "weekly" },
    { url: "/changelog", priority: 0.7, changeFrequency: "weekly" },
    { url: "/roadmap", priority: 0.6, changeFrequency: "monthly" },
    { url: "/compare/element-armory-vs-divmagic", priority: 0.8, changeFrequency: "monthly" },
    { url: "/compare/element-armory-vs-snipcss", priority: 0.8, changeFrequency: "monthly" },
    { url: "/compare/element-armory-vs-css-scan", priority: 0.8, changeFrequency: "monthly" },
    { url: "/compare/element-armory-vs-copycss", priority: 0.8, changeFrequency: "monthly" },
    { url: "/compare/element-armory-vs-visbug", priority: 0.8, changeFrequency: "monthly" },
    { url: "/compare/element-armory-vs-csspeeper", priority: 0.8, changeFrequency: "monthly" },
    { url: "/privacy", priority: 0.4, changeFrequency: "yearly" },
    { url: "/terms", priority: 0.4, changeFrequency: "yearly" },
    { url: "/cookies", priority: 0.4, changeFrequency: "yearly" },
    { url: "/url-sitemap", priority: 0.3, changeFrequency: "monthly" },
  ];

  const blogPosts = getAllPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...staticPaths.map(({ url, priority = 0.8, changeFrequency = "monthly" }) => ({
      url: `${BASE_URL}${url}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...blogPosts,
    ...EXAMPLES.map((ex) => ({
      url: `${BASE_URL}/examples/${ex.id}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
