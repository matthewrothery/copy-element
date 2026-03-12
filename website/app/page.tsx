import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeatureSection } from "@/components/FeatureSection";
import { CTABlock } from "@/components/CTABlock";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/Section";

export default function Home(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section>
          <Hero />
        </Section>

        <Section>
          <FeatureSection
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
          <FeatureSection
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

        <Footer />
      </main>
    </>
  );
}
