import type { JsonLdProps } from "./types";

export function JsonLd({
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elementarmory.example.com",
  storeUrl = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#",
  name = "Element Armory",
  description = "Capture UI from any site and rebuild it with AI. Clean. Clear. Powerful.",
}: JsonLdProps = {}): React.ReactElement {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    applicationCategory: "BrowserApplication",
    operatingSystem: "Chrome",
    description,
    url: baseUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    ...(storeUrl !== "#" && { downloadUrl: storeUrl }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
