import type { FooterProps, FooterLink } from "./types";
import "./Footer.css";

const DEFAULT_LINKS: FooterLink[] = [
  { label: "Chrome Web Store", href: process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function Footer({ links = DEFAULT_LINKS }: FooterProps): React.ReactElement {
  return (
    <footer className="footer" role="contentinfo">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target={link.href.startsWith("http") ? "_blank" : undefined}
          rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
        >
          {link.label}
        </a>
      ))}
    </footer>
  );
}
