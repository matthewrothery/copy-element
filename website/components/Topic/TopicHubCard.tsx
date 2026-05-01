import Link from "next/link";
import type { ReactElement } from "react";
import type { TopicHub } from "@/lib/parseTopics";
import "./TopicHubCard.css";

type TopicHubCardProps = {
  hub: TopicHub;
};

export function TopicHubCard({ hub }: TopicHubCardProps): ReactElement {
  const totalArticles = hub.clusters.reduce(
    (sum, c) => sum + c.articles.length,
    0
  );

  return (
    <Link href={`/topics/${hub.hub}`} className="topic-hub-card">
      <div className="topic-hub-card__inner">
        <div className="topic-hub-card__meta">
          <span className="topic-hub-card__count">
            {hub.clusters.length} {hub.clusters.length === 1 ? "cluster" : "clusters"}
            {" · "}
            {totalArticles} {totalArticles === 1 ? "article" : "articles"}
          </span>
        </div>
        <h2 className="topic-hub-card__title">{hub.title}</h2>
        <p className="topic-hub-card__excerpt">{hub.excerpt}</p>
        <span className="topic-hub-card__cta" aria-hidden>
          Explore topic →
        </span>
      </div>
    </Link>
  );
}
