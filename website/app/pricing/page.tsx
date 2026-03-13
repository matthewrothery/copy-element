import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";
import { PricingBlock } from "@/components/PricingBlock";
import { PricingComparisonSnippet } from "@/components/PricingComparisonSnippet";

export const dynamic = "force-static";

export const metadata = {
  title: "Pricing – Element Armory",
  description: "Element Armory pricing and plans.",
};

export default function PricingPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section className="pricing-page" style={{ paddingTop: "var(--space-7)" }}>
          <Section inner>
            <h1 className="page-title">Pricing</h1>
            <p className="page-subtitle">
              Choose the plan that fits your workflow. Base plan includes core features; add-ons
              scale with your usage.
            </p>
            <PricingComparisonSnippet />
            <PricingBlock />
          </Section>
        </Section>

        <Section id="faq">
          <FAQ />
        </Section>

        <Footer />
      </main>
    </>
  );
}
