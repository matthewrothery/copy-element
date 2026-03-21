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
            subheading="Examples"
            title="Captured with Element Armory"
            subtitle="UI components captured from real sites and exported as clean HTML or JSX."
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
            subheading="Features"
            title="Capture & export"
            subtitle="Get clean HTML or JSX from any element. No extra markup or inline bloat."
            tabs={[
              {
                title: "One-click capture",
                description:
                  "Click any element on the page. Element Armory copies it with minimal, portable styles.",
              },
              {
                title: "HTML and JSX",
                description:
                  "Export as plain HTML or React JSX. Copy to clipboard or save to your library.",
              },
              {
                title: "Inline styles only",
                description:
                  "Only visual styles are included. No scripts, trackers, or unnecessary attributes.",
              },
            ]}
          />
        </Section>

        <Section>
          <FeatureSection
            subheading="Features"
            title="Snippet library"
            subtitle={
              <>
                <strong>Save and reuse.</strong> Build a library of UI components from any website.
              </>
            }
            tabs={[
              {
                title: "Save snippets",
                description: "Store captured elements in your library with a title and source URL.",
              },
              {
                title: "Copy anytime",
                description: "Copy HTML or JSX from your library without revisiting the original page.",
              },
              {
                title: "Quick preview",
                description: "Preview snippets before copying. Delete or organize as you like.",
              },
            ]}
          />
        </Section>

        <Section>
          <FeatureGrid
            title="Copy & reuse"
            subtitle={
              <>
                <strong>Optimal output, baked in.</strong> Copy HTML or JSX from any element and paste into your project or share with your team.
              </>
            }
            cards={[
              {
                title: "Copy HTML",
                description:
                  "One click copies the element as clean HTML. Minimal markup, no scripts or trackers.",
              },
              {
                title: "Copy JSX",
                description:
                  "Export as React JSX. Paste into your codebase or use with AI tools via the MCP server.",
              },
              {
                title: "Save to library",
                description:
                  "Store captured elements in your snippet library with a title and source URL for later reuse.",
              },
              {
                title: "Share link",
                description:
                  "Share snippets with your team. Anyone with the link can view and copy the captured UI.",
              },
            ]}
          />
        </Section>

        <Section>
          <FeatureSection
            subheading="Developer-friendly"
            title="Developer-friendly"
            subtitle="Minimal output. No bloat. Framework-neutral HTML and JSX."
            tabs={[
              {
                title: "Minimal CSS",
                description:
                  "Only display, position, margin, padding, font, color, background, border, flex, grid.",
              },
              {
                title: "No defaults",
                description: "Default values are omitted so your output stays small and readable.",
              },
              {
                title: "Portable",
                description: "Output works anywhere. No dependency on the original site or framework.",
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
