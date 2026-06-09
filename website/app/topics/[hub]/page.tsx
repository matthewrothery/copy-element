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
import { StructuredData } from "@/components/StructuredData";
import { getAllHubs, getHub } from "@/lib/parseTopics";
import { SITE_URL } from "@/lib/publicConfig";
import {
  buildPageMetadata,
  breadcrumbListSchema,
  collectionPageSchema,
  faqPageSchema,
} from "@/lib/seo";
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
  return buildPageMetadata({
    title: hub.title,
    description: hub.excerpt,
    path: `/topics/${hubSlug}`,
  });
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
  const schemaBlocks: Array<Record<string, unknown>> = [
    breadcrumbListSchema([
      { label: "Topics", href: "/topics" },
      { label: hub.title, href: `/topics/${hub.hub}` },
    ]),
    collectionPageSchema({
      name: hub.title,
      description: hub.excerpt,
      url: pageUrl,
      hasPart: hub.clusters.map((c) => ({
        name: c.title,
        url: `${SITE_URL}/topics/${hub.hub}/${c.cluster}`,
        description: c.excerpt,
      })),
    }),
  ];
  if (hub.faq.length > 0) {
    schemaBlocks.push(faqPageSchema(hub.faq, pageUrl));
  }

  return (
    <>
      <StructuredData data={schemaBlocks} />
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
            <span>
              {hub.clusters.length}{" "}
              {hub.clusters.length === 1 ? "cluster" : "clusters"}
            </span>
            <span aria-hidden>·</span>
            <span>
              {totalArticles} {totalArticles === 1 ? "article" : "articles"}
            </span>
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
