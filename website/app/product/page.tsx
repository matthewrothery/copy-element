import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ElementsShowcase } from "@/components/ElementsShowcase";
import { FeatureSection } from "@/components/FeatureSection";
import { PipelineDiagramSection } from "@/components/PipelineDiagram";
import { SnippetHero } from "@/components/SnippetHero";
import { FeatureGrid } from "@/components/FeatureGrid";
import { CTABlock } from "@/components/CTABlock";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/Section";
import { EXAMPLES } from "@/data/examples";

export const metadata: Metadata = {
  title: "How It Works – Element Armory",
  description:
    "Click any element on any site. Get clean HTML instantly. Save it, reuse it, and pipe it straight into Cursor or Claude with the MCP server.",
  alternates: { canonical: "/product" },
};

export const dynamic = "force-static";

export default function ProductPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section center>
          <Hero
            title="The UI you want is already built. Just capture it."
            subtitle="Click any element on any site. Get clean HTML in one click."
            ctaSubtext="Free. No account required."
            media={<Image src="/assets/elementarmory.gif" alt="Element Armory" width={940} height={557} />}
          />

        </Section>

        <Section>
          <ElementsShowcase
            subheading="Captured in the wild"
            title="Any element. Any site. Yours in seconds."
            subtitle="These were captured from real sites using Element Armory. One click. Clean code."
            items={EXAMPLES.map((ex) => ({
              exampleId: ex.id,
              alt: ex.name,
              label: ex.name,
            }))}
          />
        </Section>

        <Section id="capture">
          <FeatureSection
            subheading="Capture"
            title="One click. Clean code. Zero friction."
            subtitle="No DevTools. No copy-paste archaeology. Click the element, get the code."
            tabs={[
              {
                title: "Click to capture",
                description:
                  "Open Element Armory, hover any element, click. The extension extracts it with its visual styles - display, layout, typography, color, spacing. Nothing else.",
                image: "/assets/one-click-capture.png",
              },
              {
                title: "Copy HTML",
                description:
                  "Clean markup with a scoped CSS style block. One click to clipboard - paste directly into any project or framework.",
                image: "/assets/copy-code-snippet.png",
              },
              {
                title: "No bloat, no noise",
                description:
                  "Output contains only the styles you can see. No scripts, no trackers, no framework dependencies. Paste it anywhere and it works.",
                image: "/assets/capture-html-css.png",
              },
            ]}
          />
        </Section>

        <Section center>
          <PipelineDiagramSection />
        </Section>

        <Section>
          <SnippetHero subheading="Snippet library" />
        </Section>

        <Section id="library">
          <FeatureSection
            subheading="Library"
            title="Your UI collection. Always one click away."
            subtitle={
              <>
                <strong>Save once, reuse forever.</strong> Build up a personal library of components worth keeping.
              </>
            }
            tabs={[
              {
                title: "Save snippets",
                description:
                  "After capturing, save the element to your library with a title and the source URL. It stays there across sessions and devices.",
                image: "/assets/auto-save-capture.png",
              },
              {
                title: "Copy without revisiting",
                description:
                  "Open your library, find the snippet, copy HTML. The original site doesn't need to be open. Your code is already there.",
                image: "/assets/copy-anytime.png",
              },
              {
                title: "Preview and organize",
                description:
                  "See a visual preview of every saved element. Delete what you don't need. Keep only what earns its place.",
                image: "/assets/preview-and-edit.png",
              },
            ]}
          />
        </Section>

        <Section id="ai">
          <FeatureSection
            subheading="AI integration"
            title="Your AI coding tool already knows what to build."
            subtitle={
              <>
                <strong>MCP server + AI-ready prompts.</strong> Element Armory pipes captured UI directly into Cursor, Claude, and any MCP-compatible tool.
              </>
            }
            tabs={[
              {
                title: "MCP server",
                description:
                  "Connect Element Armory to Cursor or any MCP-compatible AI editor. Captured elements land directly in your tool's context - no manual paste required.",
                image: "/assets/copy-mcp-prompt.png",
              },
              {
                title: "AI-ready prompts",
                description:
                  "Copy a codebase-aware prompt that includes the captured element, its structure, and a clear instruction. Paste into your AI tool and get accurate, usable output immediately.",
                image: "/assets/copy-ai-or-mcp-prompt.png",
              },
              {
                title: "Framework-neutral output",
                description:
                  "HTML works with any framework. Next.js, Remix, SvelteKit, or plain HTML-captured code drops in without modification.",
                image: "/assets/claude-code.png",
              },
            ]}
          />
        </Section>

        <Section>
          <FeatureGrid
            title="Clean by design. Not by accident."
            subtitle={
              <>
                <strong>No cleanup required.</strong> Every captured element comes out minimal, portable, and ready to use.
              </>
            }
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

        <Section id="get-started">
          <CTABlock
            title="Your next feature is already designed. Go get it."
            subtitle="Install in 30 seconds. No sign-up required to start capturing."
            secondaryCtaHref="/pricing"
            secondaryCtaLabel="View pricing"
            features={[
              {
                title: "Start capturing now",
                description:
                  "Install the extension, open any site, click any element. That's it.",
                href: process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#",
                linkLabel: "Add to Chrome",
                icon: "code",
              },
              {
                title: "Connect your AI tool",
                description:
                  "Set up the MCP server in Cursor or Claude in under two minutes. Your captures flow directly into your editor.",
                href: "/changelog",
                linkLabel: "See what's new",
                icon: "tag",
              },
            ]}
          />
        </Section>

        <Section id="faq">
          <FAQ
            items={[
              {
                question: "Does it work with Cursor?",
                answer:
                  "Yes. Element Armory ships with an MCP server. Connect it to Cursor and captured elements land directly in your editor context. Setup takes under two minutes - see the help docs for a step-by-step guide.",
              },
              {
                question: "Can I use the output with any framework?",
                answer:
                  "Yes. HTML output is clean markup with a scoped CSS style block-it works in any project without modification. Framework-neutral and requires no cleanup.",
              },
              {
                question: "Do I need to sign up to start?",
                answer:
                  "No. Install the extension and start capturing immediately. An account is required to save snippets to your library and sync across devices.",
              },
              {
                question: "What sites does it work on?",
                answer:
                  "Any publicly accessible website. Element Armory runs entirely in your browser - it doesn't need access to a site's source code or APIs.",
              },
              {
                question: "Will saved snippets break if the original site changes?",
                answer:
                  "No. Once captured, your snippet is independent of the original site. Changes to the source don't affect anything saved in your library.",
              },
              {
                question: "How does the MCP server work?",
                answer:
                  "The MCP server connects Element Armory to MCP-compatible AI editors. When you capture an element, it becomes available as context inside your editor so your AI tool can reference it directly when generating code.",
              },
              {
                question: "Does it capture JavaScript behavior?",
                answer:
                  "No - by design. Element Armory captures visual structure and styles only. No scripts, event handlers, or runtime logic are included. This keeps output portable and safe to paste into any project.",
              },
            ]}
          />
        </Section>

        <Footer />
      </main>
    </>
  );
}
