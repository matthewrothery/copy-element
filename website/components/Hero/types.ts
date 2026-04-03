import type { ReactNode } from "react";

export type HeroProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  ctaHref?: string;
  ctaLabel?: ReactNode;
  ctaSubtext?: string;
  logoHref?: string;
  media?: React.ReactNode;
};
