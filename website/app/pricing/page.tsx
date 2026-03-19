import { FAQ } from "@/components/FAQ";
import type { FAQItem } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";
import { PricingComparisonSnippet } from "@/components/PricingComparisonSnippet";

export const dynamic = "force-static";

export const metadata = {
  title: "Pricing – Element Armory",
  description: "Element Armory pricing and plans.",
};

const PRICING_FAQ_ITEMS: FAQItem[] = [
  {
    question: "What's included in each plan?",
    answer:
      "Both plans include the full feature set: element capture, HTML and React JSX export, snippet library, and all future updates. There are no feature tiers — the only difference is billing frequency.",
  },
  {
    question: "How much do I save with the yearly plan?",
    answer:
      "The yearly plan is $9/month billed as $108/year. The monthly plan is $19/month ($228/year). Paying yearly saves you $120 — about 53% off.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. Monthly subscribers can cancel at any time — access continues until the end of the current billing period. Yearly subscribers retain access for the full year.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "There is no free plan. Both paid plans include all features with no usage caps. You can install the extension and explore the interface before subscribing.",
  },
  {
    question: "What happens to the elements I capture?",
    answer:
      "Capture runs locally in your browser. Page content is not sent to our servers. Only minimal account and usage data is stored as described in our Privacy policy.",
  },
  {
    question: "Which browsers are supported?",
    answer:
      "Element Armory is available as a Chrome extension. Support for other Chromium-based browsers may be added in the future.",
  },
];

export default function PricingPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section className="pricing-page" style={{ paddingTop: "var(--space-7)" }}>
          <Section inner>
            <h1 className="page-title">Pricing</h1>
            <p className="page-subtitle">
              Simple pricing. Both plans include everything — choose monthly flexibility or pay
              yearly and save 53%.
            </p>
            <PricingComparisonSnippet />
          </Section>
        </Section>

        <Section id="faq">
          <FAQ
            items={PRICING_FAQ_ITEMS}
            subtitle="Common questions about plans, billing, and features."
          />
        </Section>

        <Footer />
      </main>
    </>
  );
}
