"use client";

import { useState } from "react";
import { MediaPlaceholder } from "./MediaPlaceholder";

type Tab = { title: string; description: string };

type FeatureSectionProps = {
  title: string;
  subtitle: string | React.ReactNode;
  tabs: Tab[];
};

function slugify(s: string): string {
  return s.replace(/\s+/g, "-").toLowerCase();
}

export function FeatureSection({ title, subtitle, tabs }: FeatureSectionProps): React.ReactElement {
  const [activeIndex, setActiveIndex] = useState(0);
  const id = slugify(title);

  return (
    <section className="feature-section" aria-labelledby={`feature-title-${id}`}>
      <div className="feature-heading">
        <h2 id={`feature-title-${id}`} className="feature-title">
          {title}
        </h2>
        <div className="feature-subtitle">{subtitle}</div>
      </div>
      <div className="feature-row">
        <div className="feature-tabs">
          {tabs.map((tab, i) => (
            <button
              key={tab.title}
              type="button"
              className={`feature-tab ${i === activeIndex ? "active" : ""}`}
              onClick={() => setActiveIndex(i)}
            >
              <h4 className="feature-tab-title">{tab.title}</h4>
              <p className="feature-tab-desc">{tab.description}</p>
            </button>
          ))}
        </div>
        <div className="feature-media">
          <MediaPlaceholder label="Feature demo" />
        </div>
      </div>
    </section>
  );
}
