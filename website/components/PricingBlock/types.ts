export type PricingTierConfig = {
  heading: string;
  labelTitle: string;
  subLabelTitle?: string;
  labels: string[];
  buttonLabels: string[];
  subLabels?: string[];
};

export type PricingFeatureItem =
  | { name: string; value: string }
  | { name: string; check: true };

export type PricingBlockProps = {
  basePriceMonth?: number;
  basePriceYear?: number;
  basePlanTitle?: string;
  basePlanCtaHref?: string;
  basePlanCtaLabel?: string;
  basePlanDisclaimer?: string;
  basePlanFeatures?: PricingFeatureItem[];
  tiers?: PricingTierConfig[];
};
