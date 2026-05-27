import type { JsonLdProps } from "./types";
import { StructuredData } from "@/components/StructuredData";
import {
  organizationSchema,
  softwareApplicationSchema,
  webSiteSchema,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/publicConfig";

export function JsonLd({
  baseUrl = SITE_URL,
  name = "Element Armory",
  description = "Capture UI from any site and rebuild it with AI. Clean. Clear. Powerful.",
}: JsonLdProps = {}): React.ReactElement {
  return (
    <StructuredData
      data={[
        softwareApplicationSchema({
          name,
          description,
          url: baseUrl,
        }),
        organizationSchema({ name, url: baseUrl }),
        webSiteSchema({
          name,
          url: baseUrl,
          description,
        }),
      ]}
    />
  );
}
