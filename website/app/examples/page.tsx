import { StructuredData } from "@/components/StructuredData";
import { DEFAULT_FAQ_ITEMS } from "@/components/FAQ/constants";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { ExampleCard } from "@/components/ExampleCard";
import { EXAMPLES } from "@/data/examples";
import { SITE_URL } from "@/lib/publicConfig";
import {
  buildPageMetadata,
  faqPageSchema,
  itemListSchema,
  webPageSchema,
} from "@/lib/seo";

export const dynamic = "force-static";

const EXAMPLES_TITLE = "Captured UI Examples for Developers";
const EXAMPLES_DESCRIPTION =
  "Browse live HTML and CSS UI examples captured with Element Armory. Open any component, edit the code, and copy it for your project or AI workflow.";

export const metadata = buildPageMetadata({
  title: EXAMPLES_TITLE,
  description: EXAMPLES_DESCRIPTION,
  path: "/examples",
});

export default function ExamplesPage(): React.ReactElement {
  const pageUrl = `${SITE_URL}/examples`;

  return (
    <>
      <StructuredData
        data={[
          webPageSchema({
            name: EXAMPLES_TITLE,
            description: EXAMPLES_DESCRIPTION,
            path: "/examples",
          }),
          itemListSchema({
            name: EXAMPLES_TITLE,
            description: EXAMPLES_DESCRIPTION,
            url: pageUrl,
            items: EXAMPLES.map((example) => ({
              name: example.name,
              url: `${SITE_URL}/examples/${example.id}`,
              description: example.description,
            })),
          }),
          faqPageSchema(DEFAULT_FAQ_ITEMS, pageUrl),
        ]}
      />
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
