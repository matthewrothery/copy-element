import { StructuredData } from "@/components/StructuredData";
import { DEFAULT_FAQ_ITEMS } from "@/components/FAQ/constants";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { SITE_URL } from "@/lib/publicConfig";
import {
  buildPageMetadata,
  faqPageSchema,
  webPageSchema,
} from "@/lib/seo";
import "./page.css";

export const dynamic = "force-static";

const ROADMAP_TITLE = "Element Armory Product Roadmap";
const ROADMAP_DESCRIPTION =
  "See what Element Armory is building next: capture improvements, library features, AI workflows, and extension updates on the public roadmap.";

export const metadata = buildPageMetadata({
  title: ROADMAP_TITLE,
  description: ROADMAP_DESCRIPTION,
  path: "/roadmap",
});

const ROADMAP_ITEMS: { status: "in-progress" | "planned"; title: string; description: string }[] = [
  {
    status: "in-progress",
    title: "Capture quota and usage tracking",
    description:
      "In-extension feedback showing captures used this month, with alerts when approaching the monthly limit.",
  },
  {
    status: "in-progress",
    title: "Inline-styles diff mode",
    description:
      "Highlight which styles differ from browser defaults so you can focus on what actually matters.",
  },
  {
    status: "planned",
    title: "Library search and filtering",
    description:
      "Find saved captures by title, source domain, or selector. Useful when the library grows large.",
  },
  {
    status: "planned",
    title: "Team snippet sharing",
    description:
      "Share your library or individual captures with teammates. Works across projects and AI tools.",
  },
  {
    status: "planned",
    title: "More export formats",
    description:
      "Vue, Svelte, JSX, and other framework-specific component output alongside existing HTML.",
  },
  {
    status: "planned",
    title: "Figma plugin",
    description:
      "Import captured elements directly into a Figma frame for design reference and hand-off.",
  },
];

const STATUS_LABEL: Record<"in-progress" | "planned", string> = {
  "in-progress": "In progress",
  planned: "Planned",
};

export default function RoadmapPage(): React.ReactElement {
  const pageUrl = `${SITE_URL}/roadmap`;

  return (
    <>
      <StructuredData
        data={[
          webPageSchema({
            name: ROADMAP_TITLE,
            description: ROADMAP_DESCRIPTION,
            path: "/roadmap",
          }),
          faqPageSchema(DEFAULT_FAQ_ITEMS, pageUrl),
        ]}
      />
      <Header />
      <main>
        <PageHero
          title="Roadmap"
          subtitle="What we're building next for Element Armory."
        />

        <Section>
          <ul className="roadmap-list">
            {ROADMAP_ITEMS.map((item) => (
              <li key={item.title} className={`roadmap-item roadmap-item--${item.status}`}>
                <span className="roadmap-status">{STATUS_LABEL[item.status]}</span>
                <div className="roadmap-item-body">
                  <strong className="roadmap-item-title">{item.title}</strong>
                  <p className="roadmap-item-desc">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="faq">
          <FAQ />
        </Section>

        <Footer />
      </main>
    </>
  );
}
