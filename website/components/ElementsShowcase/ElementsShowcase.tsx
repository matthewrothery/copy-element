import Image from "next/image";
import Link from "next/link";
import { Carousel } from "@/components/Carousel";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { SectionHeading } from "@/components/SectionHeading";
import { getExample } from "@/data/examples";
import type { ElementsShowcaseProps } from "./types";
import "./ElementsShowcase.css";

function slugify(s: string): string {
  return s.replace(/\s+/g, "-").toLowerCase();
}

function buildSrcDoc(html: string, css: string): string {
  return `<html><head><style>${css}</style></head><body>${html}</body></html>`;
}

export function ElementsShowcase({
  subheading,
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
      <SectionHeading
        subheading={subheading}
        title={title}
        subtitle={subtitle}
        titleId={`elements-showcase-title-${id}`}
      />
      <Carousel ariaLabel="Elements captured with Element Armory">
        {items.map((item) => {
          const example = item.exampleId ? getExample(item.exampleId) : null;

          if (example) {
            return (
              <Link
                key={item.label}
                href={`/examples/${example.id}`}
                className="elements-showcase-card elements-showcase-card--linked"
                aria-label={item.label}
              >
                <div className="elements-showcase-card-image-wrap has-frame">
                  <iframe
                    className="elements-showcase-card-frame"
                    srcDoc={buildSrcDoc(example.html, example.css)}
                    sandbox=""
                    title={`${example.name} preview`}
                    tabIndex={-1}
                    aria-hidden
                  />
                  <div className="elements-showcase-card-overlay" />
                </div>
                <p className="elements-showcase-card-label">{item.label}</p>
              </Link>
            );
          }

          return (
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
          );
        })}
      </Carousel>
    </section>
  );
}
