import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { Changelog } from "@/components/Changelog";
import { parseChangelog } from "@/lib/parseChangelog";

export const dynamic = "force-static";

export const metadata = {
  title: "Changelog – Element Armory",
  description: "Element Armory extension updates and release notes.",
  alternates: { canonical: "/changelog" },
};

export default function ChangelogPage(): React.ReactElement {
  const entries = parseChangelog();

  return (
    <>
      <Header />
      <main>
        <PageHero
          title="Changelog"
          subtitle="Release notes and updates for Element Armory."
        />
        <Section>
          <Changelog entries={entries} />
        </Section>

        <Footer />
      </main>
    </>
  );
}
