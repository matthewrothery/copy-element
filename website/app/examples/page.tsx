import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { ExampleCard } from "@/components/ExampleCard";
import { EXAMPLES } from "@/data/examples";

export const dynamic = "force-static";

export const metadata = {
  title: "UI Component Examples – Element Armory",
  description:
    "Browse live HTML and CSS UI components - buttons, cards, forms, navigation and more. Edit code live and copy for use with AI.",
  alternates: { canonical: "/examples" },
};

export default function ExamplesPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <PageHero
          title="Examples"
          subtitle="Browse live HTML and CSS components. Click any example to edit the code and copy it for use with AI."
        />
        <Section>
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

        <Section id="faq">
          <FAQ />
        </Section>

        <Footer />
      </main>
    </>
  );
}
