import { MediaPlaceholder } from "./MediaPlaceholder";

const PLACEHOLDER_CARDS = [
  { title: "Component library", source: "example.com" },
  { title: "Landing section", source: "example.com" },
  { title: "Pricing card", source: "example.com" },
];

export function SocialProofCards(): React.ReactElement {
  return (
    <section className="section-inner" aria-labelledby="social-proof-title">
      <div className="block-head">
        <h2 id="social-proof-title" className="block-head-title">
          Made with Element Capture
        </h2>
        <p className="block-head-subtitle">
          Capture UI elements from any site and build your snippet library in seconds.
        </p>
      </div>
      <div className="scroll-row">
        {PLACEHOLDER_CARDS.map((card) => (
          <article key={card.title} className="scroll-item card">
            <div className="card-caption">
              <h4 className="card-title">{card.title}</h4>
              <p className="card-desc">{card.source}</p>
            </div>
            <MediaPlaceholder label="Snippet" />
          </article>
        ))}
      </div>
    </section>
  );
}
