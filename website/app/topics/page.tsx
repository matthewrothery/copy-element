import type { ReactElement } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StructuredData } from "@/components/StructuredData";
import { TopicHubCard } from "@/components/Topic";
import { getAllHubs } from "@/lib/parseTopics";
import { SITE_URL } from "@/lib/publicConfig";
import { buildPageMetadata, collectionPageSchema } from "@/lib/seo";
import "@/styles/topics.css";

export const dynamic = "force-static";

const TOPICS_TITLE = "UI Capture Guides and Topic Hubs";
const TOPICS_DESCRIPTION =
  "In-depth guides on copying UI from websites, AI coding workflows, Chrome extension tips, and alternatives to other capture tools.";

export const metadata = buildPageMetadata({
  title: TOPICS_TITLE,
  description: TOPICS_DESCRIPTION,
  path: "/topics",
});

export default function TopicsIndexPage(): ReactElement {
  const hubs = getAllHubs();
  const pageUrl = `${SITE_URL}/topics`;

  return (
    <>
      <StructuredData
        data={collectionPageSchema({
          name: TOPICS_TITLE,
          description: TOPICS_DESCRIPTION,
          url: pageUrl,
          hasPart: hubs.map((hub) => ({
            name: hub.title,
            url: `${SITE_URL}/topics/${hub.hub}`,
            description: hub.excerpt,
          })),
        })}
      />
      <Header />
      <main className="topics-page">
        <header className="topics-page__header">
          <h1 className="topics-page__heading">Developer UI Guides</h1>
          <p className="topics-page__excerpt">
            In-depth resources on capturing UI from websites, building with AI
            tools, comparing developer extensions, and shipping great-looking
            products without a design background.
          </p>
        </header>
        <div className="topics-hub-grid">
          {hubs.map((hub) => (
            <TopicHubCard key={hub.hub} hub={hub} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
