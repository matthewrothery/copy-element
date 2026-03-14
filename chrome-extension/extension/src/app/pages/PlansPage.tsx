import type { JSX } from "react";

const PRICING_URL = "https://elementarmory.com/pricing";

export function PlansPage(): JSX.Element {
  return (
    <div className="app-page">
      <header className="app-page-header">
        <h1 className="app-page-title">Plans & Pricing</h1>
        <p className="app-page-subtitle">
          Choose the plan that fits your workflow. View full pricing and features on our website.
        </p>
      </header>

      <section className="app-page-section">
        <a
          href={PRICING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="app-page-cta"
        >
          View plans and pricing
        </a>
      </section>
    </div>
  );
}
