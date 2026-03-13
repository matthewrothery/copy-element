"use client";

import { useState } from "react";
import type { FAQProps } from "./types";
import { DEFAULT_FAQ_ITEMS } from "./constants";
import "./FAQ.css";

function slugify(s: string): string {
  return s.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function ArrowIcon(): React.ReactElement {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FAQ({
  items = DEFAULT_FAQ_ITEMS,
  subheading = "FAQs",
  title = "Frequently Asked Questions",
  subtitle = "Everything you need to know about Element Armory.",
}: FAQProps): React.ReactElement {
  // First item open by default
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number): void => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      className="faq"
      aria-labelledby="faq-title"
      aria-label="Frequently asked questions"
    >
      <div className="faq-container">
        <div className="faq-heading-block">
          {subheading !== "" && (
            <span className="faq-subheading">{subheading}</span>
          )}
          <h2 id="faq-title" className="faq-title">
            {title}
          </h2>
          {subtitle != null && <p className="faq-subtitle">{subtitle}</p>}
        </div>

        <div className="faq-list-wrapper">
          <ul className="faq-list">
            {items.map((item, index) => {
              const id = `faq-${slugify(item.question)}-${index}`;
              const answerId = `${id}-answer`;
              const isOpen = openIndex === index;

              return (
                <li key={id} className="faq-item">
                  <button
                    type="button"
                    className="faq-trigger"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    id={id}
                    onClick={() => handleToggle(index)}
                  >
                    <div className="faq-trigger-inner">
                      <h3 className="faq-question-text">{item.question}</h3>
                    </div>
                    <span className="faq-arrow">
                      <ArrowIcon />
                    </span>
                  </button>
                  <div
                    className={`faq-answer-wrap ${isOpen ? "faq-answer-wrap--open" : ""}`}
                    role="region"
                    id={answerId}
                    aria-labelledby={id}
                  >
                    <div className="faq-answer-inner">
                      <div className="faq-answer">
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
