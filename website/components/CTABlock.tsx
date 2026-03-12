const CHROME_STORE_URL = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#";

export function CTABlock(): React.ReactElement {
  return (
    <section className="cta-block" aria-labelledby="cta-title">
      <h2 id="cta-title" className="hero-title">
        Start capturing in seconds
      </h2>
      <p className="hero-subtitle">
        Install the extension, click any element, and copy clean HTML or JSX. No sign-up required.
      </p>
      <a
        href={CHROME_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
      >
        Add to Chrome
      </a>
    </section>
  );
}
