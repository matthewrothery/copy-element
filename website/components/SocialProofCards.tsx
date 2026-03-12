import { Carousel } from "./Carousel";
import { MediaPlaceholder } from "./MediaPlaceholder";

const PLACEHOLDER_CARDS = [
  { title: "Component library", source: "example.com" },
  { title: "Landing section", source: "example.com" },
  { title: "Pricing card", source: "example.com" },
  { title: "Pricing card", source: "example.com" },
  { title: "Pricing card", source: "example.com" },
  { title: "Pricing card", source: "example.com" },
];

export function SocialProofCards(): React.ReactElement {
  return (
    <Carousel
      heading="Made with Element Armory"
      description="Capture UI from any site and rebuild it with AI."
      aria-labelledby="social-proof-title"
    >
      {PLACEHOLDER_CARDS.map((card, index) => (
        <article key={`card-${index}`} className="scroll-item card">
          <div className="card-caption">
            <h4 className="card-title">{card.title}</h4>
            <p className="card-desc">{card.source}</p>
          </div>
          <MediaPlaceholder label="Snippet" />
        </article>
      ))}
    </Carousel>
  );
}
