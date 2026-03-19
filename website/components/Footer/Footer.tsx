"use client";

import Link from "next/link";
import Image from "next/image";
import type { FooterProps, FooterLink, FooterLinkGroup } from "./types";
import "./Footer.css";

const CHROME_STORE_URL = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#";

const DEFAULT_LINK_GROUPS: FooterLinkGroup[] = [
  {
    title: "Use cases",
    links: [
      { label: "Design system extraction", href: "/use-cases/design-systems" },
      { label: "AI-assisted development", href: "/use-cases/ai-development" },
      { label: "Component reuse", href: "/use-cases/component-reuse" },
      { label: "UI prototyping", href: "/use-cases/prototyping" },
      { label: "Documentation & specs", href: "/use-cases/documentation" },
      { label: "All use cases", href: "/use-cases" },
    ],
  },
  {
    sections: [
      {
        title: "Compare",
        links: [
          { label: "Element Armory vs DivMagic", href: "/compare/element-armory-vs-divmagic" },
          { label: "Element Armory vs SnipCSS", href: "/compare/element-armory-vs-snipcss" },
          { label: "Element Armory vs CSS Scan", href: "/compare/element-armory-vs-css-scan" },
          { label: "Element Armory vs CopyCSS", href: "/compare/element-armory-vs-copycss" },
        ],
      },
      {
        title: "Alternatives",
        links: [
          { label: "Best DivMagic Alternative", href: "/alternatives/divmagic" },
          { label: "Best SnipCSS Alternative", href: "/alternatives/snipcss" },
        ],
      },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "Free HTML copy tool", href: "/tools/html-copy" },
      { label: "Element picker", href: "/tools/element-picker" },
      { label: "CSS extractor", href: "/tools/css-extract" },
      { label: "Component to code", href: "/tools/component-to-code" },
      { label: "All tools", href: "/tools" },
    ],
  },
  {
    sections: [
      {
        title: "Account",
        links: [{ label: "My Account", href: "/account" }],
      },
      {
        title: "Resources",
        links: [
          { label: "Blog", href: "/blog" },
          { label: "Changelog", href: "/changelog" },
        ],
      },
    ],
  },
];

const DEFAULT_LEGAL_LINKS: FooterLink[] = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "AI & data", href: "/privacy/ai" },
  { label: "Trust Center", href: "/trust" },
  { label: "Manage cookies", href: "/cookies#manage" },
];

function isExternal(href: string): boolean {
  return href.startsWith("http");
}

function FooterLinkItem({ link }: { link: FooterLink }): React.ReactElement {
  if (isExternal(link.href)) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="footer-column-link"
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className="footer-column-link">
      {link.label}
    </Link>
  );
}

function LegalLinkItem({ link }: { link: FooterLink }): React.ReactElement {
  const isExternalHref = isExternal(link.href);
  const ariaLabel =
    link.label === "Manage cookies"
      ? "Manage cookie preferences"
      : undefined;
  if (isExternalHref) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="footer-legal-link"
        {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link
      href={link.href}
      className="footer-legal-link"
      {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
    >
      {link.label}
    </Link>
  );
}

export function Footer({
  linkGroups = DEFAULT_LINK_GROUPS,
  legalLinks = DEFAULT_LEGAL_LINKS,
  copyrightText,
  showTopCta = false,
  topCtaHref = CHROME_STORE_URL,
  topCtaLabel = "Install the extension",
}: FooterProps): React.ReactElement {
  const year = new Date().getFullYear();
  const copyright =
    copyrightText ?? `© ${year} Element Armory. All rights reserved.`;

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" className="footer-brand-link" aria-label="Element Armory home">
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="footer-brand-icon"
              aria-hidden
            />
            <span className="footer-brand-text">Element Armory</span>
          </Link>
        </div>

        {showTopCta && (
          <div className="footer-top">
            <p className="footer-tagline">
              Capture UI from any site and rebuild it with AI.
            </p>
            <a
              href={topCtaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-top-cta"
            >
              {topCtaLabel}
            </a>
          </div>
        )}

        <div className="footer-grid">
          {linkGroups.map((group, index) =>
            group.sections ? (
              <div
                key={group.sections.map((s) => s.title).join("-")}
                className="footer-column footer-column--multi"
                role="navigation"
                aria-label={group.sections.map((s) => s.title).join(", ")}
              >
                {group.sections.map((section) => (
                  <div key={section.title} className="footer-column-section">
                    <h3 className="footer-column-title">{section.title}</h3>
                    <ul className="footer-column-list">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <FooterLinkItem link={link} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <nav
                key={group.title ?? index}
                className="footer-column"
                aria-label={group.title}
              >
                <h3 className="footer-column-title">{group.title}</h3>
                <ul className="footer-column-list">
                  {(group.links ?? []).map((link) => (
                    <li key={link.href}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </nav>
            )
          )}
        </div>

        <div className="footer-legal-bar">
          <p className="footer-copyright">{copyright}</p>
          <div className="footer-legal-links">
            {legalLinks.map((link) => (
              <LegalLinkItem key={link.href} link={link} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
