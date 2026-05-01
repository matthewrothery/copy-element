"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import type { FaqItem } from "@/lib/parseTopics";
import "./TopicFaq.css";

type TopicFaqProps = {
  items: FaqItem[];
  heading?: string;
};

function ChevronIcon({ open }: { open: boolean }): ReactElement {
  return (
    <svg
      className={`topic-faq__chevron${open ? " topic-faq__chevron--open" : ""}`}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

type FaqItemProps = {
  item: FaqItem;
  index: number;
};

function FaqItemRow({ item, index }: FaqItemProps): ReactElement {
  const [open, setOpen] = useState(false);
  const id = `faq-answer-${index}`;

  return (
    <div className={`topic-faq__item${open ? " topic-faq__item--open" : ""}`}>
      <button
        className="topic-faq__question"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{item.question}</span>
        <ChevronIcon open={open} />
      </button>
      <div
        id={id}
        className="topic-faq__answer"
        role="region"
        hidden={!open}
      >
        <p className="topic-faq__answer-text">{item.answer}</p>
      </div>
    </div>
  );
}

export function TopicFaq({ items, heading = "Frequently Asked Questions" }: TopicFaqProps): ReactElement | null {
  if (items.length === 0) return null;

  return (
    <section className="topic-faq" aria-label="Frequently asked questions">
      <h2 className="topic-faq__heading">{heading}</h2>
      <div className="topic-faq__list">
        {items.map((item, index) => (
          <FaqItemRow key={index} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}
