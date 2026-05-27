import { CHROME_STORE_URL, SITE_URL } from "@/lib/publicConfig";
import { SITE_BRAND, SITE_TAGLINE } from "./constants";

export type FaqSchemaItem = {
  question: string;
  answer: string;
};

export type BreadcrumbSchemaItem = {
  label: string;
  href?: string;
};

export function absoluteSchemaUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function organizationSchema(options?: {
  name?: string;
  url?: string;
}): Record<string, unknown> {
  const name = options?.name ?? SITE_BRAND;
  const url = options?.url ?? SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name,
    url,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
    },
    sameAs: CHROME_STORE_URL !== "#" ? [CHROME_STORE_URL] : [],
  };
}

export function webSiteSchema(options?: {
  name?: string;
  url?: string;
  description?: string;
}): Record<string, unknown> {
  const name = options?.name ?? SITE_BRAND;
  const url = options?.url ?? SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name,
    alternateName: ["Element Armory", "Element Armory Capture UI Elements"],
    url,
    description: options?.description ?? SITE_TAGLINE,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function softwareApplicationSchema(options?: {
  name?: string;
  description?: string;
  url?: string;
}): Record<string, unknown> {
  const name = options?.name ?? SITE_BRAND;
  const url = options?.url ?? SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name,
    applicationCategory: "BrowserApplication",
    operatingSystem: "Chrome",
    description: options?.description ?? SITE_TAGLINE,
    url,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    ...(CHROME_STORE_URL !== "#" ? { downloadUrl: CHROME_STORE_URL } : {}),
  };
}

export function webPageSchema(input: {
  name: string;
  description: string;
  path: string;
}): Record<string, unknown> {
  const url = absoluteSchemaUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name: input.name,
    description: input.description,
    url,
    inLanguage: "en-US",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function faqPageSchema(
  items: FaqSchemaItem[],
  pageUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbListSchema(
  items: BreadcrumbSchemaItem[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteSchemaUrl(item.href) } : {}),
    })),
  };
}

export function articleSchema(input: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  image?: string;
  type?: "Article" | "BlogPosting";
}): Record<string, unknown> {
  const type = input.type ?? "BlogPosting";
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${input.url}#article`,
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    inLanguage: "en-US",
    author: {
      "@type": "Person",
      name: input.authorName ?? SITE_BRAND,
    },
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${input.url}#webpage`,
      url: input.url,
    },
    url: input.url,
    ...(input.image
      ? { image: absoluteSchemaUrl(input.image) }
      : {}),
  };
}

export function collectionPageSchema(input: {
  name: string;
  description: string;
  url: string;
  hasPart?: Array<{
    name: string;
    url: string;
    description?: string;
    type?: "WebPage" | "Article" | "BlogPosting";
    datePublished?: string;
  }>;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${input.url}#webpage`,
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: "en-US",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    ...(input.hasPart && input.hasPart.length > 0
      ? {
          hasPart: input.hasPart.map((part) => ({
            "@type": part.type ?? "WebPage",
            name: part.name,
            url: part.url,
            ...(part.description ? { description: part.description } : {}),
            ...(part.datePublished ? { datePublished: part.datePublished } : {}),
          })),
        }
      : {}),
  };
}

export function itemListSchema(input: {
  name: string;
  description: string;
  url: string;
  items: Array<{ name: string; url: string; description?: string }>;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${input.url}#itemlist`,
    name: input.name,
    description: input.description,
    url: input.url,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}

export function webApplicationSchema(input: {
  name: string;
  description: string;
  path: string;
}): Record<string, unknown> {
  const url = absoluteSchemaUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: input.name,
    description: input.description,
    url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}
