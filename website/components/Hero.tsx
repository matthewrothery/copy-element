const CHROME_STORE_URL = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#";

export function Hero(): React.ReactElement {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <h1 id="hero-title" className="hero-title">
        Copy any element. One click.
      </h1>
      <p className="hero-subtitle">
        Capture any webpage element as clean HTML or JSX. Save it to your library and reuse it
        anywhere. Minimal output, no bloat.
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
