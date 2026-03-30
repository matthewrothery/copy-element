import type { Metadata } from "next";
import Image from "next/image";
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
import { EXAMPLES } from "@/data/examples";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section center>
          <Hero media={<Image src="/assets/elementarmory.gif" alt="Element Armory" width={940} height={557} />} />
        </Section>

        <Section>
          <ElementsShowcase
            subheading="Real captures"
            title="Built from what already works."
            subtitle="Admire a UI pattern? Capture it. Study it. Build from it."
            items={EXAMPLES.map((ex) => ({
              exampleId: ex.id,
              alt: ex.name,
              label: ex.name,
            }))}
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
            subtitle="Any element, any page. Capture in one click, copy an AI or MCP prompt, then rebuild with your tools."
            tabs={[
              {
                title: "Click to capture",
                description:
                  "Hover any element and click to capture. Element Armory keeps the markup and just the styles that matter.",
                image: "/assets/one-click-capture.png",
              },
              {
                title: "Copy AI or MCP prompt",
                description:
                  "Copy a prompt with full HTML, styles, and layout context, or connect MCP to load it automatically.",
                image: "/assets/copy-ai-or-mcp-prompt.png",
              },
              {
                title: "Rebuild with AI",
                description:
                  "Use the prompt to rebuild, refactor, or match layouts. Built it fast, build it today.",
                image: "/assets/claude-code.png",
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
                title: "Auto-save captures",
                description: "Capture any element and it's automatically saved to your library.",
                image: "/assets/auto-save-capture.png",
              },
              {
                title: "Copy anytime",
                description: "Copy elements from your library anytime - even offline.",
                image: "/assets/copy-anytime.png",
              },
              {
                title: "Preview & edit",
                description: "Preview elements and edit code before copying.",
                image: "/assets/preview-and-edit.png",
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
                title: "Copy code snippets",
                description:
                  "Clean HTML with scoped styles. Paste directly into any project or framework.",
                image: "/assets/copy-code-snippet.png",
              },
              {
                title: "Copy AI prompt",
                description:
                  "A ready-made prompt with HTML and styles to rebuild the element in any AI tool.",
                image: "/assets/copy-ai-prompt.png",
              },
              {
                title: "Copy advanced prompt",
                description:
                  "A codebase-aware prompt that adapts the element to match your project.",
                image: "/assets/copy-advanced-prompt.png",
              },
              {
                title: "Copy MCP prompt",
                description:
                  "Use with MCP to load the element directly into your editor as context.",
                image: "/assets/copy-mcp-prompt.png",
              },
            ]}
          />
        </Section>

        <Section>
          <FeatureSection
            subheading="Built for developers"
            title="Output your tools can actually use."
            subtitle="Stylesheet-driven extraction: smaller, class-based CSS that AI tools parse more reliably than computed-style dumps — portable once captured."
            tabs={[
              {
                title: "Sheet-driven extraction",
                description:
                  "Walks the page’s real stylesheets and keeps only rules that apply to the captured element tree — not every computed property inlined.",
              },
              {
                title: "Readable CSS",
                description:
                  "Class-based rules in a style block. Browser defaults, transitions, animations, and pointer noise are stripped so output stays legible.",
              },
              {
                title: "Standalone snippets",
                description:
                  "No dependency on the source site or its framework. The original page can change — your snippet stays paste-ready anywhere.",
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
