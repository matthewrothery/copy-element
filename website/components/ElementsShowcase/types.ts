import type { ReactNode } from "react";

export type ElementsShowcaseItem = {
  src?: string;
  alt: string;
  label: string;
};

export type ElementsShowcaseProps = {
  title: string;
  subtitle: string | ReactNode;
  items: ElementsShowcaseItem[];
};
