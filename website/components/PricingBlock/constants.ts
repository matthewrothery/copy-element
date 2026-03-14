import type { PricingTierConfig, PricingFeatureItem } from "./types";

export const DEFAULT_BASE_PRICE_MONTH = 39;
export const DEFAULT_BASE_PRICE_YEAR = 69;

export const DEFAULT_TIERS: PricingTierConfig[] = [
  {
    heading: "Atlas Pages",
    labelTitle: "Published Pages",
    subLabelTitle: "Included AI Photos",
    labels: [
      "Up to 5",
      "Up to 15",
      "Up to 25",
      "Up to 50",
      "Up to 75",
      "Up to 100",
      "Unlimited",
    ],
    buttonLabels: [
      "Included in base",
      "+$10/mo",
      "+$20/mo",
      "+$30/mo",
      "+$40/mo",
      "+$50/mo",
      "+$60/mo",
      "+$70/mo",
    ],
    subLabels: [
      "50/month",
      "100/month",
      "200/month",
      "250/month",
      "300/month",
      "350/month",
      "Unlimited",
    ],
  },
  {
    heading: "Atlas Bundler",
    labelTitle: "Additional Revenue Cap",
    labels: [
      "Up to $1,000",
      "Up to $2,500",
      "Up to $5,000",
      "Up to $10,000",
      "Up to $20,000",
      "Up to $35,000",
      "Up to $50,000",
      "$70,000+",
    ],
    buttonLabels: [
      "Included in base",
      "+$10/mo",
      "+$20/mo",
      "+$35/mo",
      "+$65/mo",
      "+$110/mo",
      "+$150/mo",
      "+$195/mo",
    ],
  },
  {
    heading: "Atlas Cart",
    labelTitle: "Total Store Orders",
    labels: [
      "Up to 250",
      "Up to 500",
      "Up to 1,000",
      "Up to 2,000",
      "Up to 3,500",
      "Up to 5,000",
      "6,500+",
    ],
    buttonLabels: [
      "Included in base",
      "+$10/mo",
      "+$20/mo",
      "+$30/mo",
      "+$60/mo",
      "+$100/mo",
      "+$150/mo",
    ],
  },
];

export const DEFAULT_BASE_FEATURES: PricingFeatureItem[] = [
  { name: "Published Pages", value: "Up to 5 pages" },
  { name: "Al Photos", value: "25/month" },
  { name: "Bundle Revenue", value: "Up to $1,000" },
  { name: "Cart Orders", value: "Up to 250" },
  { name: "Al Store Builder", check: true },
  { name: "Al Page Builder", check: true },
  { name: "Al Photo Generator", check: true },
  { name: "Bundler Upsells", check: true },
  { name: "Cart Upsells", check: true },
];
