import type { ReactNode } from "react";

export type ElementsShowcaseItem = {
  src?: string;
  alt: string;
  label: string;
  /** When set, renders a live iframe preview from examples data and makes the card clickable. */
  exampleId?: string;
};

export type ElementsShowcaseProps = {
  /** Optional pill label above the title. */
  subheading?: string;
  title: string;
  subtitle?: string | ReactNode;
  items: ElementsShowcaseItem[];
};
