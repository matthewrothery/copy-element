"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, ExternalLink } from "lucide-react";

const CHROME_STORE_URL = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#";
const SCROLL_THRESHOLD_PX = 24;

export function Header(): React.ReactElement {
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
          <Link href="/" aria-label="Element Armory home" className="header-logo-link">
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="header-logo-icon"
              aria-hidden
            />
            <span className="header-logo-text">Element Armory</span>
          </Link>
        </div>

        <nav className="header-nav" aria-label="Main navigation">
          <Link href="/" className="header-nav-item">
            Product
          </Link>
          <Link href="/help" className="header-nav-item">
            Help
          </Link>
          <Link href="/pricing" className="header-nav-item">
            Pricing
          </Link>
          <Link href="/examples" className="header-nav-item">
            Examples
          </Link>
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
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              Product
            </Link>
            <Link href="/help" onClick={() => setMobileMenuOpen(false)}>
              Help
            </Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="/examples" onClick={() => setMobileMenuOpen(false)}>
              Examples
            </Link>
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="header-mobile-cta"
              onClick={() => setMobileMenuOpen(false)}
            >
              Install
              <ExternalLink size={14} aria-hidden />
            </a>
          </div>
        )}

        <div className="header-cta">
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Install
            <ExternalLink size={14} aria-hidden />
          </a>
        </div>
      </header>
    </div>
  );
}
