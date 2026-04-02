import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/Section";
import { PageHero } from "@/components/PageHero";
import { FAQ } from "@/components/FAQ";
import type { FAQItem } from "@/components/FAQ";
import { CTABlock } from "@/components/CTABlock";
import { HtmlToReactConverter } from "@/components/HtmlToReactConverter";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "HTML to React Converter – Free JSX & Tailwind Tool | Element Armory",
  description:
    "Convert HTML to React JSX, Vue, or Next.js components instantly. Optionally map inline CSS to Tailwind classes and apply accessibility fixes. Free, no signup required.",
  alternates: { canonical: "/tools/html-to-react" },
  openGraph: {
    title: "HTML to React Converter – Element Armory",
    description:
      "Convert HTML to React JSX, Vue, or Next.js. Map inline CSS to Tailwind classes. Free tool, no signup.",
  },
};

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How do I convert HTML to a React component?",
    answer:
      "Paste your HTML into the input pane, select React as the framework, and click Convert. The tool rewrites HTML attributes to JSX equivalents-class becomes className, for becomes htmlFor, void elements get self-closing slashes, and inline style strings become JavaScript objects.",
  },
  {
    question: "What's the difference between HTML and JSX?",
    answer:
      "JSX is a JavaScript syntax extension used in React. The key differences are: class becomes className (since class is a reserved word in JavaScript), for becomes htmlFor, self-closing void elements require a trailing slash (e.g. <br />), and inline styles use JavaScript objects ({ color: 'red' }) instead of strings.",
  },
  {
    question: "Can I convert HTML to a Next.js component?",
    answer:
      "Yes-select Next.js in the framework selector. The tool applies all React JSX transforms and adds a 'use client' directive at the top when it detects event handler attributes (onclick, onchange, etc.) in your HTML.",
  },
  {
    question: "How does the CSS to Tailwind conversion work?",
    answer:
      "When the CSS → Tailwind toggle is enabled, the tool parses inline style attributes and maps common CSS properties to their Tailwind utility equivalents-things like display, flex layout, padding, margin, font-weight, and more. Properties without a direct Tailwind mapping are kept as an inline style object instead of dropped.",
  },
  {
    question: "What accessibility fixes does the tool apply?",
    answer:
      "When accessibility fixes are enabled, the tool adds missing alt attributes to img elements, adds aria-label to icon-only buttons, and adds aria-label to bare input elements that lack an id or label association.",
  },
  {
    question: "What's the easiest way to get React-ready code from any website?",
    answer:
      "The Element Armory Chrome extension captures the exact HTML and computed styles from any live page-no copy-pasting required. It exports clean React JSX and CSS directly, saving you the manual conversion step.",
  },
];

export default function HtmlToReactPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <PageHero
          title="HTML to React Converter"
          subtitle="Paste any HTML and convert it to React JSX, Vue, or Next.js. Optionally map inline styles to Tailwind classes."
        />

        <Section>
          <HtmlToReactConverter />
        </Section>

        <Section id="faq">
          <FAQ items={FAQ_ITEMS} />
        </Section>

        <Section>
          <CTABlock />
        </Section>
      </main>
      <Footer />
    </>
  );
}
