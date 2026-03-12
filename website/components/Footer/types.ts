export type FooterLink = {
  label: string;
  href: string;
};

export type FooterProps = {
  /** Defaults to Chrome Web Store, Privacy, Terms */
  links?: FooterLink[];
};
