import type { ReactNode } from "react";

export type FeatureGridCard = {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
};

export type FeatureGridProps = {
  title: string;
  subtitle: string | ReactNode;
  cards: FeatureGridCard[];
};
