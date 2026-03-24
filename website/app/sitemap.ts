import type { MetadataRoute } from "next";
import { EXAMPLES } from "@/data/examples";

export const dynamic = "force-static";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://elementarmory.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    { url: "", priority: 1 as const, changeFrequency: "yearly" as const },
    { url: "/changelog" },
    { url: "/roadmap" },
    { url: "/privacy" },
    { url: "/terms" },
    { url: "/cookies" },
    { url: "/url-sitemap" },
    { url: "/product" },
    { url: "/compare/element-armory-vs-divmagic" },
    { url: "/compare/element-armory-vs-css-scan" },
    { url: "/compare/element-armory-vs-visbug" },
    { url: "/compare/element-armory-vs-csspeeper" },
    { url: "/examples" },
  ];

  const lastModified = new Date();

  return [
    ...staticPaths.map(({ url, priority = 0.8, changeFrequency = "weekly" as const }) => ({
      url: `${BASE_URL}${url}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...EXAMPLES.map((ex) => ({
      url: `${BASE_URL}/examples/${ex.id}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
