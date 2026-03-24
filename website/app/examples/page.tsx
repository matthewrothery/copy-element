import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";
import { ExampleCard } from "@/components/ExampleCard";
import { EXAMPLES } from "@/data/examples";

export const dynamic = "force-static";

export const metadata = {
  title: "UI Component Examples – Element Armory",
  description:
    "Browse live HTML and CSS UI components - buttons, cards, forms, navigation and more. Edit code live and copy for use with AI.",
};

export default function ExamplesPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section style={{ paddingTop: "var(--space-7)" }}>
          <Section inner>
            <h1 className="page-title">Examples</h1>
            <p className="page-subtitle">
              Browse live HTML and CSS components. Click any example to edit the
              code and copy it for use with AI.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "var(--space-4, 16px)",
                width: "100%",
              }}
            >
              {EXAMPLES.map((example) => (
                <ExampleCard key={example.id} example={example} />
              ))}
            </div>
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
