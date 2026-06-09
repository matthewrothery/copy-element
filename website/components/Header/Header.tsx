"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { ChromeStoreCtaButton } from "@/components/ChromeStoreCtaButton";
import type { HeaderProps, NavItem } from "./types";
import "./Header.css";

const SCROLL_THRESHOLD_PX = 24;

const DEFAULT_NAV: NavItem[] = [
  { label: "Product", href: "/product" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Guides", href: "/topics" },
];

export function Header({
  navItems = DEFAULT_NAV,
  logoHref = "/",
  logoAlt = "",
  logoText = "Element Armory",
}: HeaderProps): React.ReactElement {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll(): void {
      setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="header-wrapper">
      <header
        className={`header ${scrolled ? "header--scrolled" : ""}`}
        role="banner"
      >
        <div className="header-logo">
          <Link
            href={logoHref}
            aria-label={logoText ? `${logoText} home` : "Home"}
            className="header-logo-link"
          >
            <Image
              src="/logo.png"
              alt={logoAlt}
              width={32}
              height={32}
              className="header-logo-icon"
              aria-hidden={!!logoAlt}
            />
            <span className="header-logo-text">{logoText}</span>
          </Link>
        </div>

        <nav className="header-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="header-nav-item"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-mobile-toggle">
          <button
            type="button"
            className="header-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={24} aria-hidden />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="header-mobile-menu">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <ChromeStoreCtaButton
              className="header-mobile-cta"
              onClick={() => setMobileMenuOpen(false)}
            />
          </div>
        )}

        <div className="header-cta">
          <ChromeStoreCtaButton />
        </div>
      </header>
    </div>
  );
}
