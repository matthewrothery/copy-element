import type { MetadataRoute } from "next";
import { EXAMPLES } from "@/data/examples";

export const dynamic = "force-static";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://elementarmory.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/changelog", "/roadmap", "/privacy", "/terms"];
  const staticPages = routes.map((path) => ({
    url: path ? `${BASE_URL}${path}` : BASE_URL,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  return [
    ...staticPages,
    {
      url: `${BASE_URL}/examples`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...EXAMPLES.map((ex) => ({
      url: `${BASE_URL}/examples/${ex.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
