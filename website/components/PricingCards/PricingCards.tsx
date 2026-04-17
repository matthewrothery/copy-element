"use client";

import { useState } from "react";
import { CHROME_STORE_URL } from "@/lib/publicConfig";
import "./PricingCards.css";
const GET_STARTED_URL = "/sign-in";

export type Feature = { text: string };

type Plan = {
  name: string;
  description: string;
  price: string;
  period: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "primary" | "secondary";
  badge?: string;
  highlight?: boolean;
  featuresLabel: string;
  features: Feature[];
};

const FREE_PLAN: Plan = {
  name: "Free",
  description: "Try it out. No credit card required.",
  price: "0",
  period: "/month",
  subtext: "Always free.",
  ctaLabel: "Add to Chrome – It's Free",
  ctaHref: CHROME_STORE_URL,
  ctaVariant: "secondary",
  featuresLabel: "Includes:",
  features: [
    { text: "25 saved snippets (FIFO rotation)" },
    { text: "20 captures per month" },
    { text: "Basic AI prompt" },
    { text: "Cross-device sync" },
  ],
};

export const PRO_FEATURES: Feature[] = [
  { text: "Unlimited snippets" },
  { text: "Unlimited captures" },
  { text: "Advanced AI prompt" },
  { text: "MCP server copy" },
];

const PRO_MONTHLY: Plan = {
  name: "Pro",
  description: "Full access. Cancel anytime.",
  price: "19",
  period: "/month",
  subtext: "Billed monthly. Cancel anytime.",
  ctaLabel: "Get Pro",
  ctaHref: GET_STARTED_URL,
  ctaVariant: "primary",
  badge: "Most Popular",
  highlight: true,
  featuresLabel: "Everything in Free, plus:",
  features: PRO_FEATURES,
};

const PRO_YEARLY: Plan = {
  name: "Pro",
  description: "Full access. Best value.",
  price: "9",
  period: "/month",
  subtext: "Billed yearly ($108/yr). Save $120.",
  ctaLabel: "Get Pro",
  ctaHref: GET_STARTED_URL,
  ctaVariant: "primary",
  badge: "Most Popular",
  highlight: true,
  featuresLabel: "Everything in Free, plus:",
  features: PRO_FEATURES,
};

export type Billing = "monthly" | "yearly";

export function BillingToggle({
  value,
  onChange,
}: {
  value: Billing;
  onChange: (v: Billing) => void;
}): React.ReactElement {
  return (
    <div className="pricing-toggle-wrapper">
      <div className="pricing-toggle" role="group" aria-label="Billing period">
        <button
          className={`pricing-toggle__btn${value === "monthly" ? " pricing-toggle__btn--active" : ""}`}
          onClick={() => onChange("monthly")}
          aria-pressed={value === "monthly"}
        >
          Monthly
        </button>
        <button
          className={`pricing-toggle__btn${value === "yearly" ? " pricing-toggle__btn--active" : ""}`}
          onClick={() => onChange("yearly")}
          aria-pressed={value === "yearly"}
        >
          Yearly
          <span className="pricing-toggle__save-badge">Save 50%</span>
        </button>
      </div>
    </div>
  );
}

export function CheckIcon(): React.ReactElement {
  return (
    <svg
      className="pricing-card__check"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17L4 12" />
    </svg>
  );
}

function PricingCard({ plan }: { plan: Plan }): React.ReactElement {
  const cardClass = [
    "pricing-card",
    plan.highlight ? "pricing-card--highlight" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <div className="pricing-card__header">
        <div className="pricing-card__name-row">
          <p className="pricing-card__name">{plan.name}</p>
          {plan.badge && (
            <span className="pricing-card__badge pricing-card__badge--best">
              {plan.badge}
            </span>
          )}
        </div>
        <p className="pricing-card__description">{plan.description}</p>
      </div>

      <div className="pricing-card__pricing">
        <div className="pricing-card__price-row">
          <span className="pricing-card__currency">$</span>
          <span className="pricing-card__amount">{plan.price}</span>
          <span className="pricing-card__period">{plan.period}</span>
        </div>
        <p className="pricing-card__subtext">{plan.subtext}</p>
        <a
          href={plan.ctaHref}
          className={`pricing-card__cta pricing-card__cta--${plan.ctaVariant}`}
        >
          {plan.ctaLabel}
        </a>
      </div>

      <div className="pricing-card__features">
        <p className="pricing-card__features-label">{plan.featuresLabel}</p>
        {plan.features.map((f) => (
          <div key={f.text} className="pricing-card__feature">
            <CheckIcon />
            <span className="pricing-card__feature-text">{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PricingCards(): React.ReactElement {
  const [billing, setBilling] = useState<Billing>("yearly");
  const proPlan = billing === "yearly" ? PRO_YEARLY : PRO_MONTHLY;

  return (
    <div className="pricing-cards-wrapper">
      <BillingToggle value={billing} onChange={setBilling} />
      <div className="pricing-cards-group">
        <PricingCard plan={FREE_PLAN} />
        <PricingCard plan={proPlan} />
      </div>
    </div>
  );
}
