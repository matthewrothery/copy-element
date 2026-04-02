import { FAQ } from "@/components/FAQ";
import type { FAQItem } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { PricingCards } from "@/components/PricingCards";

export const dynamic = "force-static";

export const metadata = {
  title: "Pricing – Element Armory",
  description: "Element Armory pricing and plans.",
  alternates: { canonical: "/pricing" },
};

const PRICING_FAQ_ITEMS: FAQItem[] = [
  {
    question: "What's included in each plan?",
    answer:
      "The Pro plan includes the full feature set: element capture, HTML export, unlimited snippet library, advanced AI prompt, and MCP server copy. The Free plan includes 25 saved snippets, 20 captures per month, and the basic AI prompt.",
  },
  {
    question: "How much do I save with the yearly plan?",
    answer:
      "The yearly plan is $9/month billed as $108/year. The monthly plan is $19/month ($228/year). Paying yearly saves you $120 - about 53% off.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. Monthly subscribers can cancel at any time - access continues until the end of the current billing period. Yearly subscribers retain access for the full year.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. Create a free account and get 25 saved snippets, 20 captures per month, and the basic AI prompt. Upgrade to remove all limits and unlock the advanced prompt and MCP copy.",
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
        <PageHero
          title="Pricing"
          subtitle="Free to start. Upgrade when you need unlimited captures and advanced AI features."
        />
        <Section>
          <PricingCards />
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
