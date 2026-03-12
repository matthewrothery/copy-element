import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elementcapture.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/changelog", "/roadmap", "/privacy", "/terms"];
  return routes.map((path) => ({
    url: path ? `${BASE_URL}${path}` : BASE_URL,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
}
