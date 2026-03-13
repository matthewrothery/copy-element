"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import type { FeatureSectionProps, FeatureTab } from "./types";
import "./FeatureSection.css";

function slugify(s: string): string {
  return s.replace(/\s+/g, "-").toLowerCase();
}

export function FeatureSection({
  title,
  subtitle,
  tabs,
}: FeatureSectionProps): React.ReactElement {
  const [activeIndex, setActiveIndex] = useState(0);
  const id = slugify(title);
  const activeTab = tabs[activeIndex];

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
          {tabs.map((tab: FeatureTab, i: number) => (
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
          {activeTab.image ? (
            <div key={activeIndex} className="feature-media-image-wrap">
              <Image
                src={activeTab.image}
                alt=""
                fill
                sizes="(max-width: 884px) 75vw, (max-width: 1280px) 45vw, 480px"
                className="feature-media-image"
              />
            </div>
          ) : (
            <div key={activeIndex} className="feature-media-placeholder-wrap">
              <MediaPlaceholder label={activeTab.title} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
