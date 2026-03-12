export type NavItem = {
  label: string;
  href: string;
};

export type HeaderProps = {
  navItems?: NavItem[];
  ctaHref?: string;
  ctaLabel?: string;
  logoHref?: string;
  logoAlt?: string;
  logoText?: string;
};
