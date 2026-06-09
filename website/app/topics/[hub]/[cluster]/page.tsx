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
import { StructuredData } from "@/components/StructuredData";
import { getAllClustersFlat, getCluster, getHub } from "@/lib/parseTopics";
import { schemaIsoDateFromFrontmatter } from "@/lib/schemaHelpers";
import { SITE_URL } from "@/lib/publicConfig";
import {
  buildPageMetadata,
  breadcrumbListSchema,
  collectionPageSchema,
  faqPageSchema,
} from "@/lib/seo";
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
  return buildPageMetadata({
    title: cluster.title,
    description: cluster.excerpt,
    path: `/topics/${hubSlug}/${clusterSlug}`,
  });
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

  const schemaBlocks: Array<Record<string, unknown>> = [
    breadcrumbListSchema([
      { label: "Topics", href: "/topics" },
      { label: hub?.title ?? hubSlug, href: `/topics/${hubSlug}` },
      { label: cluster.title, href: `/topics/${hubSlug}/${clusterSlug}` },
    ]),
    collectionPageSchema({
      name: cluster.title,
      description: cluster.excerpt,
      url: pageUrl,
      hasPart: cluster.articles.map((a) => ({
        name: a.title,
        url: `${SITE_URL}/topics/${hubSlug}/${clusterSlug}/${a.slug}`,
        description: a.excerpt,
        type: "Article",
        datePublished: schemaIsoDateFromFrontmatter(a.date),
      })),
    }),
  ];
  if (cluster.faq.length > 0) {
    schemaBlocks.push(faqPageSchema(cluster.faq, pageUrl));
  }

  return (
    <>
      <StructuredData data={schemaBlocks} />
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
