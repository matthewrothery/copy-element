import type { CTABlockProps } from "./types";
import "./CTABlock.css";

const DEFAULT_TITLE = "Start capturing in seconds";
const DEFAULT_SUBTITLE =
  "Install the extension, click any element, and copy clean HTML or JSX. No sign-up required.";
const DEFAULT_CTA_HREF = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#";
const DEFAULT_CTA_LABEL = "Add to Chrome";

export function CTABlock({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  ctaHref = DEFAULT_CTA_HREF,
  ctaLabel = DEFAULT_CTA_LABEL,
}: CTABlockProps): React.ReactElement {
  return (
    <section className="cta-block" aria-labelledby="cta-title">
      <h2 id="cta-title" className="cta-block-title">
        {title}
      </h2>
      {subtitle != null && <p className="cta-block-subtitle">{subtitle}</p>}
      <a
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        {ctaLabel}
      </a>
    </section>
  );
}
