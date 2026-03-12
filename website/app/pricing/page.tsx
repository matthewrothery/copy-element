import { Header } from "@/components/Header";
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
      <main className="section pricing-page" style={{ paddingTop: "var(--space-7)" }}>
        <div className="section-inner">
          <h1 className="hero-title">Pricing</h1>
          <p className="hero-subtitle" style={{ textAlign: "left", maxWidth: "60ch" }}>
            Choose the plan that fits your workflow. Base plan includes core features; add-ons scale
            with your usage.
          </p>
          <PricingComparisonSnippet />
          <PricingBlock />
        </div>
      </main>
    </>
  );
}
