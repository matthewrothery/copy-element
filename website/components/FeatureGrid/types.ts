import type { ReactNode } from "react";

export type FeatureGridCard = {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
};

export type FeatureGridProps = {
  /** Optional pill label above the title. */
  subheading?: string;
  title: string;
  subtitle: string | ReactNode;
  cards: FeatureGridCard[];
};
