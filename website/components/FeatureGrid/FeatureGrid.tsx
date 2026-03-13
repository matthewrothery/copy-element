import Image from "next/image";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import type { FeatureGridProps } from "./types";
import "./FeatureGrid.css";

function slugify(s: string): string {
  return s.replace(/\s+/g, "-").toLowerCase();
}

export function FeatureGrid({
  title,
  subtitle,
  cards,
}: FeatureGridProps): React.ReactElement {
  const titleId = `feature-grid-title-${slugify(title)}`;

  return (
    <section
      className="feature-grid"
      aria-labelledby={titleId}
    >
      <div className="feature-grid-heading">
        <h2 id={titleId} className="feature-grid-title">
          {title}
        </h2>
        <div className="feature-grid-subtitle">{subtitle}</div>
      </div>
      <div className="feature-grid-grid">
        {cards.map((card) => (
          <figure key={card.title} className="feature-grid-card">
            <figcaption className="feature-grid-card-caption">
              <h4 className="feature-grid-card-title">{card.title}</h4>
              <p className="feature-grid-card-desc">{card.description}</p>
            </figcaption>
            <div className="feature-grid-card-media">
              {card.image ? (
                <Image
                  src={card.image}
                  alt={card.imageAlt ?? card.title}
                  fill
                  sizes="(max-width: 884px) 100vw, 50vw"
                  loading="lazy"
                  className="feature-grid-card-image"
                />
              ) : (
                <MediaPlaceholder label={card.title} />
              )}
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
