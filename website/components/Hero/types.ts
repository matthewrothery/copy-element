import type { ReactNode } from "react";

export type HeroProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  ctaSubtext?: string;
  logoHref?: string;
  media?: React.ReactNode;
};
