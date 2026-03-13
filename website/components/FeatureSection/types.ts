export type FeatureTab = {
  title: string;
  description: string;
  image?: string;
};

import type { ReactNode } from "react";

export type FeatureSectionProps = {
  title: string;
  subtitle: string | ReactNode;
  tabs: FeatureTab[];
};
