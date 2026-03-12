import Image from "next/image";
import { Carousel } from "@/components/Carousel";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import type { ElementsShowcaseProps } from "./types";
import "./ElementsShowcase.css";

function slugify(s: string): string {
  return s.replace(/\s+/g, "-").toLowerCase();
}

export function ElementsShowcase({
  title,
  subtitle,
  items,
}: ElementsShowcaseProps): React.ReactElement {
  const id = slugify(title);

  return (
    <section
      className="elements-showcase"
      aria-labelledby={`elements-showcase-title-${id}`}
    >
      <div className="elements-showcase-heading">
        <h2
          id={`elements-showcase-title-${id}`}
          className="elements-showcase-title"
        >
          {title}
        </h2>
        {subtitle != null && (
          <p className="elements-showcase-subtitle">{subtitle}</p>
        )}
      </div>
      <Carousel ariaLabel="Elements captured with Element Armory">
        {items.map((item) => (
          <article
            key={item.label}
            className="elements-showcase-card"
            aria-label={item.label}
          >
            <div className="elements-showcase-card-image-wrap">
              {item.src ? (
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 88vw, (max-width: 1280px) 62vw, 560px"
                />
              ) : (
                <MediaPlaceholder
                  aspectRatio="video"
                  label={item.alt || "Element capture"}
                />
              )}
            </div>
            <p className="elements-showcase-card-label">{item.label}</p>
          </article>
        ))}
      </Carousel>
    </section>
  );
}
