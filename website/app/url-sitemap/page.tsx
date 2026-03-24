import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";
import "@/styles/policy.css";
import "./sitemap-page.css";

export const dynamic = "force-static";

export const metadata = {
  title: "Sitemap – Element Armory",
  description: "All pages on Element Armory.",
};

const SITEMAP_SECTIONS = [
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
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "All Tools", href: "/tools" },
      { label: "Copy HTML Free", href: "/tools/html-copy" },
      { label: "Copy as JSX", href: "/tools/copy-as-jsx" },
      { label: "CSS to Tailwind", href: "/tools/css-to-tailwind" },
      { label: "Color Palette Extractor", href: "/tools/color-palette" },
      { label: "Component to AI Prompt", href: "/tools/component-to-prompt" },
    ],
  },
  {
    title: "Compare",
    links: [
      { label: "Element Armory vs DivMagic", href: "/compare/element-armory-vs-divmagic" },
      { label: "Element Armory vs SnipCSS", href: "/compare/element-armory-vs-snipcss" },
      { label: "Element Armory vs CSS Scan", href: "/compare/element-armory-vs-css-scan" },
      { label: "Element Armory vs CopyCSS", href: "/compare/element-armory-vs-copycss" },
    ],
  },
  {
    title: "Alternatives",
    links: [
      { label: "Best DivMagic Alternative", href: "/alternatives/divmagic" },
      { label: "Best SnipCSS Alternative", href: "/alternatives/snipcss" },
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
      <Header />
      <main>
        <Section style={{ paddingTop: "var(--space-7)", paddingBottom: 0 }}>
          <h1 className="page-title">Sitemap</h1>
          <p className="page-subtitle">All pages on Element Armory.</p>
        </Section>

        <div className="policy-content">
          <div className="sitemap-grid">
            {SITEMAP_SECTIONS.map((section) => (
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
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
