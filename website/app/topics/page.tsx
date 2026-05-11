import type { ReactElement } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TopicHubCard } from "@/components/Topic";
import { getAllHubs } from "@/lib/parseTopics";
import { SITE_URL } from "@/lib/publicConfig";
import "@/styles/topics.css";

export const dynamic = "force-static";

export const metadata = {
  title: "Topics – Element Armory",
  description:
    "In-depth guides on copying UI from websites, AI coding workflows, tool alternatives, and building UI without design skills.",
  alternates: { canonical: "/topics" },
};

export default function TopicsIndexPage(): ReactElement {
  const hubs = getAllHubs();

  const pageUrl = `${SITE_URL}/topics`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#webpage`,
    name: "Topics – Element Armory",
    description:
      "In-depth guides on copying UI, AI coding workflows, tool alternatives, and frontend development for developers.",
    url: pageUrl,
    inLanguage: "en-US",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Element Armory",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Element Armory",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    hasPart: hubs.map((h) => ({
      "@type": "WebPage",
      name: h.title,
      url: `${SITE_URL}/topics/${h.hub}`,
      description: h.excerpt,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
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
