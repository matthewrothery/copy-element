import type { ReactElement } from "react";
import { ChromeStoreCtaLabel } from "@/components/ChromeStoreCtaLabel";
import "./ArticleCTA.css";

const CHROME_STORE_HREF = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#";

function ArrowIcon(): ReactElement {
  return (
    <svg
      className="article-cta-arrow"
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

export function ArticleCTA(): ReactElement {
  return (
    <aside className="article-cta" aria-label="Try Element Armory">
      <div className="article-cta-inner">
        <div className="article-cta-text">
          <span className="article-cta-eyebrow">Element Armory</span>
          <p className="article-cta-headline">
            Capture any UI element. Get clean code instantly.
          </p>
          <p className="article-cta-body">
            Click any element on any site and copy clean HTML or JSX. Free
            Chrome extension, no sign-up required.
          </p>
        </div>
        <a
          className="article-cta-btn"
          href={CHROME_STORE_HREF}
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
