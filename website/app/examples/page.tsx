import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";

export const dynamic = "force-static";

export const metadata = {
  title: "Examples – Element Armory",
  description: "Element Armory examples and use cases.",
};

export default function ExamplesPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section style={{ paddingTop: "var(--space-7)" }}>
          <h1 className="page-title">Examples</h1>
          <p className="page-subtitle">
            Example captures and use cases for Element Armory will be published here.
          </p>
        </Section>

        <Section id="faq">
          <FAQ />
        </Section>

        <Footer />
      </main>
    </>
  );
}
