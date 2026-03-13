export type FooterLink = {
  label: string;
  href: string;
};

export type FooterLinkSection = {
  title: string;
  links: FooterLink[];
};

export type FooterLinkGroup = {
  /** Column title (optional when using sections). */
  title?: string;
  /** Single list of links (used when sections is not set). */
  links?: FooterLink[];
  /** Multiple sections in one column (e.g. Compare + Alternatives). When set, title/links are ignored. */
  sections?: FooterLinkSection[];
};

export type FooterProps = {
  /** Link groups (Product, Use Cases, Resources, etc.). Defaults to expanded SEO-friendly set. */
  linkGroups?: FooterLinkGroup[];
  /** Inline links for legal bar (Terms, Privacy, Cookies, etc.). */
  legalLinks?: FooterLink[];
  /** Copyright line. Defaults to "© {year} Element Armory. All rights reserved." */
  copyrightText?: string;
  /** Show top row with tagline + CTA. */
  showTopCta?: boolean;
  /** Top row CTA href (e.g. Chrome Store). */
  topCtaHref?: string;
  /** Top row CTA label (e.g. "Install the extension"). */
  topCtaLabel?: string;
};
