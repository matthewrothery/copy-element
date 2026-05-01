import type { ReactElement } from "react";
import { ChromeStoreCtaLabel } from "@/components/ChromeStoreCtaLabel";
import { CHROME_STORE_URL } from "@/lib/publicConfig";
import "./TopicCta.css";

function ArrowIcon(): ReactElement {
  return (
    <svg
      className="topic-cta__arrow"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M0.5 5.5h7" />
      <path d="M1.5 1.5l4 4-4 4" />
    </svg>
  );
}

type TopicCtaProps = {
  headline?: string;
  body?: string;
};

export function TopicCta({
  headline = "Capture any UI element. Get clean code instantly.",
  body = "Click any element on any site and copy clean HTML and CSS. Free Chrome extension, no sign-up required.",
}: TopicCtaProps): ReactElement {
  return (
    <aside className="topic-cta" aria-label="Try Element Armory">
      <div className="topic-cta__inner">
        <div className="topic-cta__text">
          <span className="topic-cta__eyebrow">Element Armory</span>
          <p className="topic-cta__headline">{headline}</p>
          <p className="topic-cta__body">{body}</p>
        </div>
        <a
          className="topic-cta__btn"
          href={CHROME_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ChromeStoreCtaLabel />
          <ArrowIcon />
        </a>
      </div>
    </aside>
  );
}
