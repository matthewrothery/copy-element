import type { ArticleBodyProps } from "./types";
import "./ArticleBody.css";

export function ArticleBody({ contentHtml }: ArticleBodyProps): React.ReactElement {
  return (
    <article
      className="article-body"
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}
