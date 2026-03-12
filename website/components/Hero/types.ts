import type { ReactNode } from "react";

export type HeroProps = {
  title?: string;
  subtitle?: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
  ctaSubtext?: string;
  logoHref?: string;
  media?: React.ReactNode;
};
