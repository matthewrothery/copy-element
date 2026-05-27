import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  TopicBreadcrumb,
  TopicFaq,
  TopicCta,
  TopicRelatedLinks,
} from "@/components/Topic";
import { StructuredData } from "@/components/StructuredData";
import {
  getAllArticlesFlat,
  getArticle,
  getAllArticles,
  getHub,
  getCluster,
} from "@/lib/parseTopics";
import { schemaIsoDateFromFrontmatter } from "@/lib/schemaHelpers";
import { SITE_URL } from "@/lib/publicConfig";
import {
  articleSchema,
  buildPageMetadata,
  faqPageSchema,
} from "@/lib/seo";
import "@/styles/topics.css";
import "@/components/Article/ArticleBody.css";

export const dynamic = "force-static";

export function generateStaticParams(): {
  hub: string;
  cluster: string;
  slug: string;
}[] {
  return getAllArticlesFlat().map((a) => ({
    hub: a.hub,
    cluster: a.cluster,
    slug: a.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hub: string; cluster: string; slug: string }>;
}) {
  const { hub, cluster, slug } = await params;
  const article = getArticle(hub, cluster, slug);
  if (!article) return { title: "Not Found" };
  return buildPageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/topics/${hub}/${cluster}/${slug}`,
    image: article.coverImage,
    openGraphType: "article",
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ hub: string; cluster: string; slug: string }>;
}): Promise<ReactElement> {
  const { hub: hubSlug, cluster: clusterSlug, slug } = await params;
  const article = getArticle(hubSlug, clusterSlug, slug);
  if (!article) notFound();

  const hub = getHub(hubSlug);
  const cluster = getCluster(hubSlug, clusterSlug);
  const clusterArticles = getAllArticles(hubSlug, clusterSlug);

  const articleUrl = `${SITE_URL}/topics/${hubSlug}/${clusterSlug}/${slug}`;
  const published = schemaIsoDateFromFrontmatter(article.date);

  const schemaBlocks: Array<Record<string, unknown>> = [
    articleSchema({
      headline: article.title,
      description: article.excerpt,
      url: articleUrl,
      datePublished: published,
      image: article.coverImage,
      type: "Article",
    }),
  ];
  if (article.faq.length > 0) {
    schemaBlocks.push(faqPageSchema(article.faq, articleUrl));
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
            {
              label: cluster?.title ?? clusterSlug,
              href: `/topics/${hubSlug}/${clusterSlug}`,
            },
            { label: article.title },
          ]}
        />

        <header className="topics-page__header">
          <p className="topics-page__eyebrow">
            <span>{article.date}</span>
            <span aria-hidden>·</span>
            <span>{article.readTime}</span>
          </p>
          <h1 className="topics-page__heading">{article.title}</h1>
          <p className="topics-page__excerpt">{article.excerpt}</p>
        </header>

        {article.coverImage && (
          <div className="topics-article-cover-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="topics-article-cover"
              src={article.coverImage}
              alt={article.title}
              loading="lazy"
            />
          </div>
        )}

        <article
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />

        <TopicCta />
        <TopicFaq items={article.faq} />
        <TopicRelatedLinks
          currentSlug={slug}
          articles={clusterArticles}
          relatedSlugs={article.relatedSlugs}
          allArticles={getAllArticlesFlat()}
        />
      </main>
      <Footer />
    </>
  );
}
