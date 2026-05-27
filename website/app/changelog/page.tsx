import { StructuredData } from "@/components/StructuredData";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { Changelog } from "@/components/Changelog";
import { parseChangelog } from "@/lib/parseChangelog";
import { buildPageMetadata, webPageSchema } from "@/lib/seo";

export const dynamic = "force-static";

const CHANGELOG_TITLE = "Element Armory Changelog and Release Notes";
const CHANGELOG_DESCRIPTION =
  "See what is new in Element Armory: Chrome extension updates, capture improvements, library features, and MCP workflow changes.";

export const metadata = buildPageMetadata({
  title: CHANGELOG_TITLE,
  description: CHANGELOG_DESCRIPTION,
  path: "/changelog",
});

export default function ChangelogPage(): React.ReactElement {
  const entries = parseChangelog();

  return (
    <>
      <StructuredData
        data={webPageSchema({
          name: CHANGELOG_TITLE,
          description: CHANGELOG_DESCRIPTION,
          path: "/changelog",
        })}
      />
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
