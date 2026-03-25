import type { JsonLdProps } from "./types";

export function JsonLd({
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elementarmory.example.com",
  storeUrl = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#",
  name = "Element Armory",
  description = "Capture UI from any site and rebuild it with AI. Clean. Clear. Powerful.",
}: JsonLdProps = {}): React.ReactElement {
  const softwareApp = {
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

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
    },
    sameAs: [
      ...(storeUrl !== "#" ? [storeUrl] : []),
    ],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
