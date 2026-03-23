import type { ArticleHeaderProps } from "./types";
import "./ArticleHeader.css";

export function ArticleHeader({
  title,
  author,
  date,
  readTime,
  coverImage,
}: ArticleHeaderProps): React.ReactElement {
  const formatted = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="article-header">
      {coverImage && (
        <img
          src={coverImage}
          alt=""
          className="article-header__cover"
          aria-hidden
        />
      )}
      <h1 className="article-header__title">{title}</h1>
      <div className="article-header__meta">
        <span className="article-header__author">{author}</span>
        <span className="article-header__dot" aria-hidden>·</span>
        <span className="article-header__date">{formatted}</span>
        <span className="article-header__dot" aria-hidden>·</span>
        <span className="article-header__read-time">{readTime}</span>
      </div>
    </header>
  );
}
