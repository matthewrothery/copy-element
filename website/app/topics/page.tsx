import type { ReactElement } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChromeStoreCtaLabel } from "@/components/ChromeStoreCtaLabel";
import { StructuredData } from "@/components/StructuredData";
import { getAllArticlesFlat, getAllHubs } from "@/lib/parseTopics";
import opportunityData from "@/data/topic-opportunities.json";
import { CHROME_STORE_URL, SITE_URL } from "@/lib/publicConfig";
import { buildPageMetadata, collectionPageSchema, itemListSchema } from "@/lib/seo";
import "@/styles/topics.css";

export const dynamic = "force-static";

const TOPICS_TITLE = "UI Capture Guides and Topic Hubs";
const TOPICS_DESCRIPTION =
  "In-depth guides on copying UI from websites, AI coding workflows, Chrome extension tips, and alternatives to other capture tools.";

const SEARCH_PATHS = [
  {
    label: "copy HTML in Chrome",
    href: "/topics/copy-ui-from-websites/copy-html-from-website/copy-html-of-element-chrome",
  },
  {
    label: "copy CSS without DevTools",
    href: "/topics/copy-ui-from-websites/copy-css-from-website/copy-css-without-devtools",
  },
  {
    label: "CSS extractor extension",
    href: "/topics/tool-alternatives/general-alternatives/best-css-extractor-chrome-extension",
  },
  {
    label: "SnipCSS review",
    href: "/topics/tool-alternatives/snipcss-alternative/snipcss-review",
  },
  {
    label: "use UI with Claude Code",
    href: "/topics/ai-coding-workflows/claude-code-workflows/use-ui-with-claude-code",
  },
];

function formatReason(reasons: string[] | undefined): string {
  if (!reasons || reasons.length === 0) return "High-fit developer workflow";
  if (reasons.some((reason) => reason.includes("low CTR"))) {
    return "Visible in search; needs a stronger click path";
  }
  if (reasons.some((reason) => reason.includes("comparison"))) {
    return "Comparison intent with product fit";
  }
  if (reasons.some((reason) => reason.includes("extraction"))) {
    return "Practical extraction intent";
  }
  return reasons[0];
}

export const metadata = buildPageMetadata({
  title: TOPICS_TITLE,
  description: TOPICS_DESCRIPTION,
  path: "/topics",
});

export default function TopicsIndexPage(): ReactElement {
  const hubs = getAllHubs();
  const articles = getAllArticlesFlat();
  const articleMap = new Map(
    articles.map((article) => [
      `/topics/${article.hub}/${article.cluster}/${article.slug}`,
      article,
    ])
  );
  const featuredGuides = opportunityData.opportunities
    .filter((item) => articleMap.has(item.path))
    .slice(0, 8)
    .map((item) => {
      const article = articleMap.get(item.path);
      return {
        path: item.path,
        title: item.title ?? article?.title ?? "Topic guide",
        label: item.clusterTitle ?? article?.clusterTitle ?? "Guide",
        reason: formatReason(item.reasons),
        readTime: article?.readTime ?? "5 min read",
      };
    });
  const latestGuides = [...articles]
    .sort((a, b) => ((a.updatedAt ?? a.date) < (b.updatedAt ?? b.date) ? 1 : -1))
    .slice(0, 8);
  const totalClusters = hubs.reduce((sum, hub) => sum + hub.clusters.length, 0);
  const totalArticles = articles.length;
  const pageUrl = `${SITE_URL}/topics`;
  const schemaBlocks = [
    collectionPageSchema({
      name: TOPICS_TITLE,
      description: TOPICS_DESCRIPTION,
      url: pageUrl,
      hasPart: hubs.map((hub) => ({
        name: hub.title,
        url: `${SITE_URL}/topics/${hub.hub}`,
        description: hub.excerpt,
      })),
    }),
    itemListSchema({
      name: "Featured UI capture guides",
      description: "Priority Element Armory topic guides selected from Search Console opportunity data.",
      url: `${pageUrl}#featured-guides`,
      items: featuredGuides.map((guide) => ({
        name: guide.title,
        url: `${SITE_URL}${guide.path}`,
        description: guide.reason,
      })),
    }),
  ];

  return (
    <>
      <StructuredData data={schemaBlocks} />
      <Header />
      <main className="topics-page topics-page--index">
        <section className="topics-index-hero">
          <div className="topics-index-hero__content">
            <p className="topics-index-hero__eyebrow">Element Armory guides</p>
            <h1 className="topics-index-hero__heading">UI capture guides for developers</h1>
            <p className="topics-index-hero__excerpt">
              Practical guides for extracting HTML and CSS, replacing slow DevTools workflows,
              comparing capture tools, and giving AI coding tools real UI context.
            </p>
            <div className="topics-index-hero__actions">
              <a className="topics-index-button topics-index-button--primary" href={CHROME_STORE_URL}>
                <ChromeStoreCtaLabel />
              </a>
              <Link
                className="topics-index-button topics-index-button--secondary"
                href="/topics/copy-ui-from-websites/copy-html-from-website/copy-html-of-element-chrome"
              >
                Start with Chrome HTML capture
              </Link>
            </div>
          </div>
          <dl className="topics-index-stats" aria-label="Topic library stats">
            <div>
              <dt>{hubs.length}</dt>
              <dd>hubs</dd>
            </div>
            <div>
              <dt>{totalClusters}</dt>
              <dd>clusters</dd>
            </div>
            <div>
              <dt>{totalArticles}</dt>
              <dd>guides</dd>
            </div>
          </dl>
        </section>

        <section className="topics-index-section" id="featured-guides">
          <div className="topics-index-section__header">
            <h2>Featured guides</h2>
            <p>Search-informed pages with strong developer intent and clear product fit.</p>
          </div>
          <div className="topics-featured-grid">
            {featuredGuides.map((guide) => (
              <Link className="topics-featured-guide" href={guide.path} key={guide.path}>
                <span className="topics-featured-guide__label">{guide.label}</span>
                <h3>{guide.title}</h3>
                <p>{guide.reason}</p>
                <span className="topics-featured-guide__meta">{guide.readTime}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="topics-index-section">
          <div className="topics-index-section__header">
            <h2>Browse by workflow</h2>
            <p>Pick the job you are trying to finish, then drill into the strongest child guides.</p>
          </div>
          <div className="topics-workflow-grid">
            {hubs.map((hub) => {
              const total = hub.clusters.reduce((sum, cluster) => sum + cluster.articles.length, 0);
              const childLinks = hub.clusters
                .flatMap((cluster) =>
                  cluster.articles.slice(0, 2).map((article) => ({
                    title: article.title,
                    href: `/topics/${article.hub}/${article.cluster}/${article.slug}`,
                  }))
                )
                .slice(0, 3);
              return (
                <article className="topics-workflow-card" key={hub.hub}>
                  <div>
                    <p className="topics-workflow-card__meta">
                      {hub.clusters.length} clusters · {total} guides
                    </p>
                    <h3>
                      <Link href={`/topics/${hub.hub}`}>{hub.title}</Link>
                    </h3>
                    <p>{hub.excerpt}</p>
                  </div>
                  {childLinks.length > 0 && (
                    <ul className="topics-workflow-card__links">
                      {childLinks.map((link) => (
                        <li key={link.href}>
                          <Link href={link.href}>{link.title}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="topics-index-section topics-search-paths">
          <div className="topics-index-section__header">
            <h2>Popular search paths</h2>
            <p>Jump straight to query-shaped guides developers are already looking for.</p>
          </div>
          <div className="topics-search-paths__chips">
            {SEARCH_PATHS.map((path) => (
              <Link href={path.href} key={path.href}>
                {path.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="topics-index-section">
          <div className="topics-index-section__header">
            <h2>Latest guides</h2>
            <p>Recently published and refreshed topics across the library.</p>
          </div>
          <ul className="topics-latest-list">
            {latestGuides.map((article) => (
              <li key={`${article.hub}/${article.cluster}/${article.slug}`}>
                <Link href={`/topics/${article.hub}/${article.cluster}/${article.slug}`}>
                  <span>{article.clusterTitle}</span>
                  <strong>{article.title}</strong>
                  <em>{article.updatedAt ?? article.date}</em>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="topics-index-cta">
          <div>
            <h2>Capture UI from any site and rebuild it with AI.</h2>
            <p>Use Element Armory when screenshots are not enough and DevTools copying is too slow.</p>
          </div>
          <a className="topics-index-button topics-index-button--primary" href={CHROME_STORE_URL}>
            <ChromeStoreCtaLabel />
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
