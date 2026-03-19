import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";
import { Changelog } from "@/components/Changelog";
import { parseChangelog } from "@/lib/parseChangelog";

export const dynamic = "force-static";

export const metadata = {
  title: "Changelog – Element Armory",
  description: "Element Armory extension updates and release notes.",
};

export default function ChangelogPage(): React.ReactElement {
  const entries = parseChangelog();

  return (
    <>
      <Header />
      <main>
        <Section style={{ paddingTop: "var(--space-7)" }}>
          <Section inner>
            <h1 className="page-title">Changelog</h1>
            <p className="page-subtitle">
              Release notes and updates for Element Armory.
            </p>
            <Changelog entries={entries} />
          </Section>
        </Section>

        <Footer />
      </main>
    </>
  );
}
