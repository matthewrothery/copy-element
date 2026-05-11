import Link from "next/link";
import type { ReactElement } from "react";
import type { TopicArticle } from "@/lib/parseTopics";
import "./TopicRelatedLinks.css";

type TopicRelatedLinksProps = {
  currentSlug: string;
  articles: TopicArticle[];
  relatedSlugs?: string[];
  allArticles?: TopicArticle[];
  heading?: string;
};

export function TopicRelatedLinks({
  currentSlug,
  articles,
  relatedSlugs = [],
  allArticles = [],
  heading = "Explore this topic",
}: TopicRelatedLinksProps): ReactElement | null {
  const articlePool = allArticles.length > 0 ? allArticles : articles;
  const explicitRelated = relatedSlugs
    .map((relatedSlug) => relatedSlug.replace(/^\/?topics\//, "").replace(/^\//, ""))
    .map((relatedSlug) =>
      articlePool.find((article) => {
        const articlePath = `${article.hub}/${article.cluster}/${article.slug}`;
        return article.slug === relatedSlug || articlePath === relatedSlug;
      })
    )
    .filter((article): article is TopicArticle => Boolean(article));

  const fallbackRelated = articles.filter((a) => a.slug !== currentSlug);
  const related = [...explicitRelated, ...fallbackRelated]
    .filter(
      (article, index, list) =>
        article.slug !== currentSlug &&
        list.findIndex(
          (item) =>
            item.hub === article.hub &&
            item.cluster === article.cluster &&
            item.slug === article.slug
        ) === index
    )
    .slice(0, 5);
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
