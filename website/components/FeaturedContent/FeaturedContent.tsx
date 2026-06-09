import Link from "next/link";
import { Carousel } from "@/components/Carousel";
import { SectionHeading } from "@/components/SectionHeading";
import "./FeaturedContent.css";

export type FeaturedContentItem = {
  href: string;
  title: string;
  excerpt: string;
  image: string;
  imageAlt?: string;
  type: "blog" | "guide";
};

type FeaturedContentProps = {
  items: FeaturedContentItem[];
};

export function FeaturedContent({ items }: FeaturedContentProps): React.ReactElement {
  return (
    <section className="featured-content" aria-labelledby="featured-content-heading">
      <SectionHeading
        titleId="featured-content-heading"
        title="Guides and articles"
        subtitle="Practical resources on capturing UI, vibe coding, and building with AI tools."
      />
      <Carousel ariaLabel="Featured guides and articles" snap showProgress>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="featured-card">
            <div className="featured-card__image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.imageAlt ?? item.title}
                className="featured-card__image"
                loading="lazy"
              />
            </div>
            <div className="featured-card__body">
              <span className="featured-card__type">
                {item.type === "blog" ? "Article" : "Guide"}
              </span>
              <p className="featured-card__title">{item.title}</p>
              <p className="featured-card__excerpt">{item.excerpt}</p>
            </div>
          </Link>
        ))}
      </Carousel>
    </section>
  );
}
