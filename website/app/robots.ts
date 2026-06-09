import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/publicConfig";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account/",
        "/auth/",
        "/billing/",
        "/sign-in/",
        "/uninstall/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
