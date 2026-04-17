export type NavItem = {
  label: string;
  href: string;
};

export type HeaderProps = {
  navItems?: NavItem[];
  logoHref?: string;
  logoAlt?: string;
  logoText?: string;
};
