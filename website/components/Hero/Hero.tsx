import Link from "next/link";
import Image from "next/image";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import type { HeroProps } from "./types";
import "./Hero.css";

export function Hero({
  title = "Capture UI from any site and rebuild it with AI.",
  subtitle = <span>Clean. Clear. Powerful.</span>,
  ctaHref = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#",
  ctaLabel = "Install",
  ctaSubtext = "Free. No account required.",
  logoHref = "/",
  media,
}: HeroProps): React.ReactElement {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-inner">
        <Link
          href={logoHref}
          className="hero-logo"
          aria-label="Element Armory home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={120}
            height={120}
            className="hero-logo-icon"
            aria-hidden
            priority
          />
        </Link>
        <div className="hero-content">
          <h1 id="hero-title" className="hero-title">
            {title}
          </h1>
          {subtitle != null && <p className="hero-subtitle">{subtitle}</p>}
        </div>
        <div className="hero-cta-block">
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hero-cta"
          >
            {ctaLabel}
          </a>
          <span className="hero-cta-label">{ctaSubtext}</span>
        </div>
      </div>
      <div className="hero-media">
        {media ?? (
          <MediaPlaceholder
            aspectRatio="video"
            label="Product screenshot"
          />
        )}
      </div>
    </section>
  );
}
