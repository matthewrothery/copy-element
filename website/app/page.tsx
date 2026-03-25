import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeatureSection } from "@/components/FeatureSection";
import { FeatureGrid } from "@/components/FeatureGrid";
import { ElementsShowcase } from "@/components/ElementsShowcase";
import { SnippetHero } from "@/components/SnippetHero";
import { PipelineDiagramSection } from "@/components/PipelineDiagram";
import { CTABlock } from "@/components/CTABlock";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section center>
          <Hero />
        </Section>

        <Section>
          <ElementsShowcase
            subheading="Real captures"
            title="Built from what already works."
            subtitle="Admire a UI pattern? Capture it. Study it. Build from it."
            items={[
              {
                src: "https://picsum.photos/seed/element-pricing/1120/630",
                alt: "Card layout",
                label: "Pricing card",
              },
              {
                src: "https://picsum.photos/seed/element-header/1120/630",
                alt: "Navigation bar",
                label: "Header with nav",
              },
              {
                src: "https://picsum.photos/seed/element-form/1120/630",
                alt: "Form controls",
                label: "Form section",
              },
              {
                src: "https://picsum.photos/seed/element-article/1120/630",
                alt: "Content block",
                label: "Article preview",
              },
              {
                src: "https://picsum.photos/seed/element-footer/1120/630",
                alt: "Footer",
                label: "Site footer",
              },
            ]}
          />
        </Section>

        <Section>
          <SnippetHero subheading="Snippet library" />
        </Section>

        <Section center>
          <PipelineDiagramSection />
        </Section>

        <Section id="features">
          <FeatureSection
            subheading="How it works"
            title="Click. Copy. Build."
            subtitle="Any element, any page. Clean HTML or JSX — ready to paste in one click."
            tabs={[
              {
                title: "One-click capture",
                description:
                  "Hover any element, click to capture. Element Armory strips it down to just the styles that matter.",
              },
              {
                title: "HTML and JSX",
                description:
                  "Export as plain HTML or React JSX. Paste directly into your project or drop into an AI tool.",
              },
              {
                title: "Inline styles only",
                description:
                  "Visual styles only — no scripts, trackers, or framework dependencies. Works anywhere.",
              },
            ]}
          />
        </Section>

        <Section>
          <FeatureSection
            subheading="Your library"
            title="Save the good ones. Use them later."
            subtitle="Build a personal library of UI components from any site. Organized, always one click from your clipboard."
            tabs={[
              {
                title: "Save snippets",
                description: "Tag and save any captured element with a title and source. Your library grows as you browse.",
              },
              {
                title: "Copy anytime",
                description: "Paste HTML or JSX from your library without revisiting the original page — even offline.",
              },
              {
                title: "Quick preview",
                description: "Preview before you copy. Delete what you don't need. Keep only what works.",
              },
            ]}
          />
        </Section>

        <Section>
          <FeatureGrid
            title="Paste-ready. Every time."
            subtitle="Clean output that drops straight into your project. No cleanup, no reformatting."
            cards={[
              {
                title: "Copy HTML",
                description:
                  "One click. Clean markup, minimal styles. Paste into any page or framework.",
              },
              {
                title: "Copy JSX",
                description:
                  "Export as React JSX. Ready for your codebase or your AI editor via the MCP server.",
              },
              {
                title: "Save to library",
                description:
                  "Keep the elements that matter. Access them from the extension, anytime.",
              },
              {
                title: "Share link",
                description:
                  "Send a snippet to your team. They can view and copy without installing anything.",
              },
            ]}
          />
        </Section>

        <Section>
          <FeatureSection
            subheading="Built for developers"
            title="Output your tools can actually use."
            subtitle="Minimal, portable, framework-neutral. The code you'd write by hand — just faster."
            tabs={[
              {
                title: "Minimal CSS",
                description:
                  "Only display, layout, spacing, typography, color, border, flex, and grid. Nothing else.",
              },
              {
                title: "No defaults",
                description: "Default browser values are stripped out. Your output stays readable and easy to override.",
              },
              {
                title: "Portable",
                description: "No dependency on the source site or its framework. Drop it into anything.",
              },
            ]}
          />
        </Section>

        <Section id="pricing">
          <CTABlock />
        </Section>

        <Section id="faq">
          <FAQ />
        </Section>

        <Footer />
      </main>
    </>
  );
}
