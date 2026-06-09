import Image from "next/image";
import { StructuredData } from "@/components/StructuredData";
import { DEFAULT_FAQ_ITEMS } from "@/components/FAQ/constants";
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
import { FeaturedContent, type FeaturedContentItem } from "@/components/FeaturedContent";
import { EXAMPLES } from "@/data/examples";
import { SITE_URL } from "@/lib/publicConfig";
import {
  buildPageMetadata,
  faqPageSchema,
  HOME_DESCRIPTION,
  HOME_TITLE,
  webPageSchema,
} from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
});

const homePageUrl = SITE_URL;

const FEATURED_CONTENT: FeaturedContentItem[] = [
  {
    href: "/blog/copy-any-website-element-and-convert-it-to-react",
    title: "Copy Any Website Element and Convert It to React",
    excerpt: "A practical workflow for capturing UI from any site and rebuilding it as a clean React component.",
    image: "/blog/copy-any-website-element-and-convert-it-to-react.jpg",
    type: "blog",
  },
  {
    href: "/topics/copy-ui-from-websites/copy-css-from-website/easiest-way-to-copy-css",
    title: "Easiest Way to Copy CSS from Any Website",
    excerpt: "Compare manual DevTools methods vs automated extraction, with real workflows for AI tools.",
    image: "/topic-images/copy-ui-from-websites/copy-css-from-website/easiest-way-to-copy-css.png",
    type: "guide",
  },
  {
    href: "/topics/ai-coding-workflows/claude-code-workflows/capture-ui-for-claude",
    title: "Capture UI for Claude Code",
    excerpt: "Feed production-quality HTML and CSS directly into Claude Code for faster, more accurate component generation.",
    image: "/topic-images/ai-coding-workflows/claude-code-workflows/capture-ui-for-claude.png",
    type: "guide",
  },
  {
    href: "/topics/ai-coding-workflows/cursor-workflows/send-html-to-cursor",
    title: "Send HTML to Cursor",
    excerpt: "Capture any live UI element and drop it straight into Cursor as working context — no manual copy-paste.",
    image: "/topic-images/ai-coding-workflows/cursor-workflows/send-html-to-cursor.png",
    type: "guide",
  },
  {
    href: "/blog/how-to-vibe-code-beautiful-ui",
    title: "How to Vibe Code Beautiful UI",
    excerpt: "Stop asking AI to invent everything. Give it structure, references, and constraints — here's the workflow.",
    image: "/blog/how-to-vibe-code-beautiful-ui.jpg",
    type: "blog",
  },
  {
    href: "/topics/copy-ui-from-websites/copy-html-css-together/copy-production-ready-ui",
    title: "Copy Production-Ready UI from Live Websites",
    excerpt: "Extract complete HTML and CSS from any live website in one click. Clean output you can paste straight into your project.",
    image: "/topic-images/copy-ui-from-websites/copy-html-css-together/copy-production-ready-ui.jpeg",
    type: "guide",
  },
  {
    href: "/blog/vibe-code-ui",
    title: "How to Vibe Code UI Without Getting Stuck",
    excerpt: "Capture real interfaces, break them into pieces, and rebuild with intent. The fastest path out of a stuck vibe session.",
    image: "/blog/vibe-code-ui.jpg",
    type: "blog",
  },
  {
    href: "/topics/tool-alternatives/divmagic-alternative/divmagic-for-ai-coding",
    title: "DivMagic for AI Coding: Why It Falls Short",
    excerpt: "DivMagic is built for design conversion. AI coding workflows need something different — here's what works better.",
    image: "/topic-images/tool-alternatives/divmagic-alternative/divmagic-for-ai-coding.png",
    type: "guide",
  },
];

export default function Home(): React.ReactElement {
  return (
    <>
      <StructuredData
        data={[
          webPageSchema({
            name: HOME_TITLE,
            description: HOME_DESCRIPTION,
            path: "/",
          }),
          faqPageSchema(DEFAULT_FAQ_ITEMS, homePageUrl),
        ]}
      />
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

        {/* <Section>
          <FeatureSection
            subheading="Built for developers"
            title="Output your tools can actually use."
            subtitle="Element Armory reads the page's real stylesheets-not getComputedStyle. The result is smaller, readable, class-based CSS that AI tools handle far better than inlined property dumps."
            tabs={[
              {
                title: "Only what applies",
                description:
                  "The extension walks the page's actual stylesheets and keeps only the rules that match the captured element and its children. No bloat, no noise-just the styles that are doing work.",
              },
              {
                title: "Readable by AI",
                description:
                  "Output is class-based CSS in a style block-the same structure AI tools are trained on. Browser defaults, transitions, animations, and pointer events are stripped so there's nothing to work around.",
              },
              {
                title: "Independent of the source",
                description:
                  "Once captured, your snippet has no dependency on the original site. The page can change, go down, or go behind a paywall-your code stays paste-ready.",
              },
            ]}
          />
        </Section> */}

        <Section id="pricing">
          <CTABlock />
        </Section>

        <Section id="guides">
          <FeaturedContent items={FEATURED_CONTENT} />
        </Section>

        <Section id="faq">
          <FAQ />
        </Section>

        <Footer />
      </main>
    </>
  );
}
