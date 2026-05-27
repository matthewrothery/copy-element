import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_BRAND } from "./constants";

export type BuildPageMetadataInput = {
  /** Page-specific title; brand suffix is appended when missing. */
  title: string;
  description: string;
  /** Canonical path, e.g. `/pricing`. */
  path: string;
  image?: string;
  robots?: Metadata["robots"];
  openGraphType?: "website" | "article";
};

function resolveTitle(title: string): string {
  if (title.includes(SITE_BRAND)) {
    return title;
  }
  return `${title} | ${SITE_BRAND}`;
}

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const {
    title,
    description,
    path,
    image = DEFAULT_OG_IMAGE,
    robots,
    openGraphType = "website",
  } = input;

  const fullTitle = resolveTitle(title);

  return {
    title: fullTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_BRAND,
      type: openGraphType,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    ...(robots !== undefined ? { robots } : {}),
  };
}

export function buildNoIndexMetadata(input: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const meta = buildPageMetadata({
    title: input.title,
    description: input.description,
    path: input.path ?? "/",
    robots: { index: false, follow: false },
  });
  if (input.path === undefined) {
    return {
      title: meta.title,
      description: meta.description,
      openGraph: meta.openGraph,
      twitter: meta.twitter,
      robots: meta.robots,
    };
  }
  return meta;
}
