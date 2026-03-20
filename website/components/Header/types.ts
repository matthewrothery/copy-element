import type { ReactNode } from "react";

export type NavItem = {
  label: string;
  href: string;
};

export type HeaderProps = {
  navItems?: NavItem[];
  ctaHref?: string;
  ctaLabel?: ReactNode;
  logoHref?: string;
  logoAlt?: string;
  logoText?: string;
};
