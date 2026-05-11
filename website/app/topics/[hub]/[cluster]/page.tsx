import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  TopicBreadcrumb,
  TopicArticleCard,
  TopicFaq,
  TopicCta,
} from "@/components/Topic";
import { getAllClustersFlat, getCluster, getHub } from "@/lib/parseTopics";
import { schemaIsoDateFromFrontmatter } from "@/lib/schemaHelpers";
import { SITE_URL } from "@/lib/publicConfig";
import "@/styles/topics.css";
import "@/components/Article/ArticleBody.css";

export const dynamic = "force-static";

export function generateStaticParams(): { hub: string; cluster: string }[] {
  return getAllClustersFlat();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hub: string; cluster: string }>;
}) {
  const { hub: hubSlug, cluster: clusterSlug } = await params;
  const cluster = getCluster(hubSlug, clusterSlug);
  if (!cluster) return { title: "Not Found" };
  return {
    title: `${cluster.title} – Element Armory`,
    description: cluster.excerpt,
    alternates: { canonical: `/topics/${hubSlug}/${clusterSlug}` },
  };
}

export default async function ClusterPage({
  params,
}: {
  params: Promise<{ hub: string; cluster: string }>;
}): Promise<ReactElement> {
  const { hub: hubSlug, cluster: clusterSlug } = await params;
  const cluster = getCluster(hubSlug, clusterSlug);
  if (!cluster) notFound();

  const hub = getHub(hubSlug);

  const pageUrl = `${SITE_URL}/topics/${hubSlug}/${clusterSlug}`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#webpage`,
    name: cluster.title,
    description: cluster.excerpt,
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
    hasPart: cluster.articles.map((a) => ({
      "@type": "Article",
      headline: a.title,
      url: `${SITE_URL}/topics/${hubSlug}/${clusterSlug}/${a.slug}`,
      description: a.excerpt,
      datePublished: schemaIsoDateFromFrontmatter(a.date),
    })),
  };

  const faqSchema =
    cluster.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${pageUrl}#faq`,
          mainEntity: cluster.faq.map((item) => ({
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
            { label: hub?.title ?? hubSlug, href: `/topics/${hubSlug}` },
            { label: cluster.title },
          ]}
        />

        <header className="topics-page__header">
          <p className="topics-page__eyebrow">
            {cluster.articles.length}{" "}
            {cluster.articles.length === 1 ? "article" : "articles"}
          </p>
          <h1 className="topics-page__heading">{cluster.title}</h1>
          <p className="topics-page__excerpt">{cluster.excerpt}</p>
        </header>

        {cluster.contentHtml && (
          <article
            className="article-body"
            dangerouslySetInnerHTML={{ __html: cluster.contentHtml }}
          />
        )}

        <ul className="topics-article-list">
          {cluster.articles.map((article) => (
            <li key={article.slug}>
              <TopicArticleCard article={article} />
            </li>
          ))}
        </ul>

        <TopicCta />
        <TopicFaq items={cluster.faq} />
      </main>
      <Footer />
    </>
  );
}
