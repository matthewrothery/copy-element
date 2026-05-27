import Link from "next/link";
import { StructuredData } from "@/components/StructuredData";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import { getAllHubs } from "@/lib/parseTopics";
import { buildPageMetadata, webPageSchema } from "@/lib/seo";
import "@/styles/policy.css";
import "./sitemap-page.css";

export const dynamic = "force-static";

const URL_SITEMAP_TITLE = "Element Armory HTML Sitemap";
const URL_SITEMAP_DESCRIPTION =
  "Browse every public page on Element Armory, including product pages, guides, comparisons, blog posts, and topic hubs.";

export const metadata = buildPageMetadata({
  title: URL_SITEMAP_TITLE,
  description: URL_SITEMAP_DESCRIPTION,
  path: "/url-sitemap",
});

const topicHubs = getAllHubs();

const STATIC_SITEMAP_SECTIONS = [
  {
    title: "Main",
    links: [
      { label: "Home", href: "/" },
      { label: "Product", href: "/product" },
      { label: "Pricing", href: "/pricing" },
      { label: "Examples", href: "/examples" },
      { label: "Blog", href: "/blog" },
      { label: "Changelog", href: "/changelog" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Support", href: "/support" },
      { label: "Features", href: "/features" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "HTML → React / Tailwind Converter", href: "/tools/html-to-react" },
      { label: "CSS → Tailwind Converter", href: "/tools/css-to-tailwind" },
      { label: "UI Component Prompt Generator", href: "/tools/ui-prompt-generator" },
      { label: "Border Radius Generator", href: "/tools/border-radius-generator" },
      { label: "Gradient Generator", href: "/tools/gradient-generator" },
      { label: "CSS Shadow Generator", href: "/tools/shadow-generator" },
    ],
  },
  {
    title: "Compare",
    links: [
      { label: "Element Armory vs DivMagic", href: "/compare/element-armory-vs-divmagic" },
      { label: "Element Armory vs SnipCSS", href: "/compare/element-armory-vs-snipcss" },
      { label: "Element Armory vs CSS Scan", href: "/compare/element-armory-vs-css-scan" },
      { label: "Element Armory vs CopyCSS", href: "/compare/element-armory-vs-copycss" },
      { label: "Element Armory vs VisBug", href: "/compare/element-armory-vs-visbug" },
      { label: "Element Armory vs CSSPeeper", href: "/compare/element-armory-vs-csspeeper" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/sign-in" },
      { label: "My Account", href: "/account" },
      { label: "Billing", href: "/billing" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Sitemap", href: "/url-sitemap" },
    ],
  },
];

export default function SitemapPage(): React.ReactElement {
  return (
    <>
      <StructuredData
        data={webPageSchema({
          name: URL_SITEMAP_TITLE,
          description: URL_SITEMAP_DESCRIPTION,
          path: "/url-sitemap",
        })}
      />
      <Header />
      <main>
        <PageHero
          title="Sitemap"
          subtitle="All pages on Element Armory."
        />

        <div className="policy-content">
          <div className="sitemap-grid">
            {STATIC_SITEMAP_SECTIONS.map((section) => (
              <div key={section.title} className="sitemap-section">
                <h2 className="sitemap-section-title">{section.title}</h2>
                <ul className="sitemap-list">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="sitemap-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="sitemap-section sitemap-section--topics">
              <h2 className="sitemap-section-title">Topics</h2>
              <ul className="sitemap-list">
                <li>
                  <Link href="/topics" className="sitemap-link">
                    All topics
                  </Link>
                </li>
                {topicHubs.map((hub) => (
                  <li key={hub.hub}>
                    <Link href={`/topics/${hub.hub}`} className="sitemap-link">
                      {hub.title}
                    </Link>
                    <ul className="sitemap-list sitemap-list--nested">
                      {hub.clusters.map((cluster) => (
                        <li key={`${hub.hub}/${cluster.cluster}`}>
                          <Link
                            href={`/topics/${hub.hub}/${cluster.cluster}`}
                            className="sitemap-link"
                          >
                            {cluster.title}
                          </Link>
                          <ul className="sitemap-list sitemap-list--nested">
                            {cluster.articles.map((article) => (
                              <li key={`${hub.hub}/${cluster.cluster}/${article.slug}`}>
                                <Link
                                  href={`/topics/${hub.hub}/${cluster.cluster}/${article.slug}`}
                                  className="sitemap-link"
                                >
                                  {article.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
