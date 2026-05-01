import Link from "next/link";
import type { ReactElement } from "react";
import type { TopicCluster } from "@/lib/parseTopics";
import "./TopicClusterCard.css";

type TopicClusterCardProps = {
  cluster: TopicCluster;
};

export function TopicClusterCard({ cluster }: TopicClusterCardProps): ReactElement {
  return (
    <Link
      href={`/topics/${cluster.hub}/${cluster.cluster}`}
      className="topic-cluster-card"
    >
      <div className="topic-cluster-card__inner">
        <span className="topic-cluster-card__count">
          {cluster.articles.length}{" "}
          {cluster.articles.length === 1 ? "article" : "articles"}
        </span>
        <h3 className="topic-cluster-card__title">{cluster.title}</h3>
        <p className="topic-cluster-card__excerpt">{cluster.excerpt}</p>
        <span className="topic-cluster-card__cta" aria-hidden>
          Read guides →
        </span>
      </div>
    </Link>
  );
}
