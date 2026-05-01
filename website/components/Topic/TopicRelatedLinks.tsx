import Link from "next/link";
import type { ReactElement } from "react";
import type { TopicArticle } from "@/lib/parseTopics";
import "./TopicRelatedLinks.css";

type TopicRelatedLinksProps = {
  currentSlug: string;
  articles: TopicArticle[];
  heading?: string;
};

export function TopicRelatedLinks({
  currentSlug,
  articles,
  heading = "Explore this topic",
}: TopicRelatedLinksProps): ReactElement | null {
  const related = articles.filter((a) => a.slug !== currentSlug).slice(0, 5);
  if (related.length === 0) return null;

  return (
    <nav className="topic-related" aria-label={heading}>
      <h2 className="topic-related__heading">{heading}</h2>
      <ul className="topic-related__list">
        {related.map((article) => (
          <li key={article.slug} className="topic-related__item">
            <Link
              href={`/topics/${article.hub}/${article.cluster}/${article.slug}`}
              className="topic-related__link"
            >
              <span className="topic-related__arrow" aria-hidden>→</span>
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
