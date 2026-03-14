import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";

export const dynamic = "force-static";

export const metadata = {
  title: "Changelog – Element Armory",
  description: "Element Armory extension updates and release notes.",
};

export default function ChangelogPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section style={{ paddingTop: "var(--space-7)" }}>
          <h1 className="page-title">Changelog</h1>
          <p className="page-subtitle">
            Release notes and updates will be posted here.
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
