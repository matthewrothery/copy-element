export type FeatureTab = {
  title: string;
  description: string;
  image?: string;
};

import type { ReactNode } from "react";

export type FeatureSectionProps = {
  /** Optional pill label above the title. */
  subheading?: string;
  title: string;
  subtitle: string | ReactNode;
  tabs: FeatureTab[];
};
