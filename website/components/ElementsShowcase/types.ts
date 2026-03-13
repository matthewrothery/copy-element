import type { ReactNode } from "react";

export type ElementsShowcaseItem = {
  src?: string;
  alt: string;
  label: string;
};

export type ElementsShowcaseProps = {
  /** Optional pill label above the title. */
  subheading?: string;
  title: string;
  subtitle?: string | ReactNode;
  items: ElementsShowcaseItem[];
};
