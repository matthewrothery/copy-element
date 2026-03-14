import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";

export const dynamic = "force-static";

export const metadata = {
  title: "Help – Element Armory",
  description: "Element Armory help and documentation.",
};

export default function HelpPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section style={{ paddingTop: "var(--space-7)" }}>
          <h1 className="page-title">Help</h1>
          <p className="page-subtitle">
            Documentation and support for Element Armory will be available here.
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
