import Link from "next/link";
import Image from "next/image";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";

const CHROME_STORE_URL = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#";

export function Hero(): React.ReactElement {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <Link href="/" className="hero-logo" aria-label="Element Armory home">
        <Image
          src="/logo.png"
          alt=""
          width={120}
          height={120}
          className="hero-logo-icon"
          aria-hidden
          priority
        />
        <span className="hero-logo-text">Element Armory</span>
      </Link>
      <h1 id="hero-title" className="hero-title">
        Capture UI from any site and rebuild it with AI.
      </h1>
      <p className="hero-subtitle">
        <span>Clean. Clear. Powerful.</span>
      </p>
      <div className="hero-cta-block">
        <a
          href={CHROME_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary hero-cta"
        >
          Install
        </a>
        <span className="hero-cta-label">Free. No account required.</span>
      </div>
      <div className="hero-media">
        <MediaPlaceholder
          aspectRatio="video"
          label="Product screenshot"
        />
      </div>
    </section>
  );
}
