import type { ReactElement } from "react";
import Link from "next/link";
import type { Example } from "@/data/examples";
import { ChromeStoreCtaLabel } from "@/components/ChromeStoreCtaLabel";
import { CHROME_STORE_URL } from "@/lib/publicConfig";
import "./ExampleLanding.css";

function buildSrcDoc(html: string, css: string): string {
  return `<html><head><style>${css}</style></head><body>${html}</body></html>`;
}

const HOW_IT_WORKS = [
  {
    n: "1",
    title: "Hover any UI element on any site",
    body: "Open Element Armory on any site. Move your cursor over any element to highlight it.",
  },
  {
    n: "2",
    title: "Click to capture",
    body: "Click to extract clean HTML and CSS. Visual styles only - no scripts, trackers, or dependencies.",
  },
  {
    n: "3",
    title: "Paste into your project or AI tool",
    body: "Copy HTML or JSX in one click. Drop it straight into your codebase or feed it to Cursor, Claude, or any AI editor.",
  },
];

export function ExampleLanding({ example }: { example: Example }): ReactElement {
  return (
    <div className="example-landing">
      <div className="example-landing-inner">
        <Link href="/examples" className="example-landing-back">
          ← Examples
        </Link>

        <header className="example-landing-header">
          <span className="example-landing-category">{example.category}</span>
          <h1 className="example-landing-title">{example.name}</h1>
          <p className="example-landing-desc">{example.description}</p>
        </header>

        <div className="example-landing-preview-wrap">
          <iframe
            className="example-landing-frame"
            srcDoc={buildSrcDoc(example.html, example.css)}
            sandbox=""
            title={`${example.name} live preview`}
            tabIndex={-1}
            aria-hidden
          />
          <div className="example-landing-overlay" />
        </div>

        <section
          className="example-landing-steps"
          aria-label="How Element Armory works"
        >
          <h2 className="example-landing-steps-title">
            How Element Armory works
          </h2>
          <ol className="example-landing-steps-list">
            {HOW_IT_WORKS.map((step) => (
              <li key={step.n} className="example-landing-step">
                <span className="example-landing-step-num">{step.n}</span>
                <div className="example-landing-step-body">
                  <strong className="example-landing-step-heading">
                    {step.title}
                  </strong>
                  <p className="example-landing-step-text">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="example-landing-ctas">
          <Link
            href={`/examples/${example.id}/edit`}
            className="example-landing-cta-primary"
          >
            Open code editor
          </Link>
          <a
            href={CHROME_STORE_URL}
            className="example-landing-cta-secondary"
            target="_blank"
            rel="noreferrer"
          >
            <ChromeStoreCtaLabel />
          </a>
        </div>
      </div>
    </div>
  );
}
