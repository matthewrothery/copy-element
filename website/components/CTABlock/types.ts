import type { ReactNode } from "react";

export type CTABlockFeature = {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  icon?: "tag" | "code" | ReactNode;
};

export type CTABlockProps = {
  title?: string;
  subtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
  features?: CTABlockFeature[];
};
