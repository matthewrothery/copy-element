import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  TopicBreadcrumb,
  TopicClusterCard,
  TopicFaq,
  TopicCta,
} from "@/components/Topic";
import { getAllHubs, getHub } from "@/lib/parseTopics";
import { SITE_URL } from "@/lib/publicConfig";
import "@/styles/topics.css";

export const dynamic = "force-static";

export function generateStaticParams(): { hub: string }[] {
  return getAllHubs().map((h) => ({ hub: h.hub }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hub: string }>;
}) {
  const { hub: hubSlug } = await params;
  const hub = getHub(hubSlug);
  if (!hub) return { title: "Not Found" };
  return {
    title: `${hub.title} – Element Armory`,
    description: hub.excerpt,
    alternates: { canonical: `/topics/${hubSlug}` },
  };
}

export default async function HubPage({
  params,
}: {
  params: Promise<{ hub: string }>;
}): Promise<ReactElement> {
  const { hub: hubSlug } = await params;
  const hub = getHub(hubSlug);
  if (!hub) notFound();

  const totalArticles = hub.clusters.reduce(
    (sum, c) => sum + c.articles.length,
    0
  );

  const pageUrl = `${SITE_URL}/topics/${hub.hub}`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#webpage`,
    name: hub.title,
    description: hub.excerpt,
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
    hasPart: hub.clusters.map((c) => ({
      "@type": "WebPage",
      name: c.title,
      url: `${SITE_URL}/topics/${hub.hub}/${c.cluster}`,
      description: c.excerpt,
    })),
  };

  const faqSchema =
    hub.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${pageUrl}#faq`,
          mainEntity: hub.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <Header />
      <main className="topics-page">
        <TopicBreadcrumb
          items={[
            { label: "Topics", href: "/topics" },
            { label: hub.title },
          ]}
        />

        <header className="topics-page__header">
          <p className="topics-page__eyebrow">
            <span>{hub.clusters.length} {hub.clusters.length === 1 ? "cluster" : "clusters"}</span>
            <span aria-hidden>·</span>
            <span>{totalArticles} {totalArticles === 1 ? "article" : "articles"}</span>
          </p>
          <h1 className="topics-page__heading">{hub.title}</h1>
          <p className="topics-page__excerpt">{hub.excerpt}</p>
        </header>

        <div className="topics-cluster-grid">
          {hub.clusters.map((cluster) => (
            <TopicClusterCard key={cluster.cluster} cluster={cluster} />
          ))}
        </div>

        <TopicCta />
        <TopicFaq items={hub.faq} />
      </main>
      <Footer />
    </>
  );
}
