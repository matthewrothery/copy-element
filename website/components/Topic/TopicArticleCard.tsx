import Link from "next/link";
import type { ReactElement } from "react";
import type { TopicArticle } from "@/lib/parseTopics";
import "./TopicArticleCard.css";

type TopicArticleCardProps = {
  article: TopicArticle;
};

export function TopicArticleCard({ article }: TopicArticleCardProps): ReactElement {
  return (
    <Link
      href={`/topics/${article.hub}/${article.cluster}/${article.slug}`}
      className="topic-article-card"
    >
      <div className="topic-article-card__inner">
        <h3 className="topic-article-card__title">{article.title}</h3>
        <p className="topic-article-card__excerpt">{article.excerpt}</p>
        <div className="topic-article-card__meta">
          <span>{article.date}</span>
          <span className="topic-article-card__dot" aria-hidden>·</span>
          <span>{article.readTime}</span>
        </div>
      </div>
    </Link>
  );
}
