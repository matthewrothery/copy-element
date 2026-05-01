import Link from "next/link";
import type { ReactElement } from "react";
import "./TopicBreadcrumb.css";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type TopicBreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function TopicBreadcrumb({ items }: TopicBreadcrumbProps): ReactElement {
  return (
    <nav className="topic-breadcrumb" aria-label="Breadcrumb">
      <ol className="topic-breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="topic-breadcrumb__item">
              {item.href && !isLast ? (
                <Link href={item.href} className="topic-breadcrumb__link">
                  {item.label}
                </Link>
              ) : (
                <span
                  className="topic-breadcrumb__current"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="topic-breadcrumb__sep" aria-hidden>
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
