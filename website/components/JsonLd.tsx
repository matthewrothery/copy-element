const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elementcapture.example.com";
const STORE_URL = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#";

export function JsonLd(): React.ReactElement {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Element Capture",
    applicationCategory: "BrowserApplication",
    operatingSystem: "Chrome",
    description:
      "Chrome extension to copy any webpage element as clean HTML or JSX. Capture, save, and reuse UI components with minimal output.",
    url: BASE_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    ...(STORE_URL !== "#" && { downloadUrl: STORE_URL }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
