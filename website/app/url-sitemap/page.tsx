import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import "@/styles/policy.css";
import "./sitemap-page.css";

export const dynamic = "force-static";

export const metadata = {
  title: "Sitemap – Element Armory",
  description: "All pages on Element Armory.",
  alternates: { canonical: "/url-sitemap" },
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
        <PageHero
          title="Sitemap"
          subtitle="All pages on Element Armory."
        />

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
